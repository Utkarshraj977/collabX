import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../src/models/Task.js", () => ({
  default: {
    create: vi.fn(),
    find: vi.fn(),
    findById: vi.fn(),
    findByIdAndDelete: vi.fn()
  }
}));

vi.mock("../src/models/ChannelMember.js", () => ({
  default: { findOne: vi.fn() }
}));

vi.mock("../src/socket.js", () => ({
  getIO: vi.fn()
}));

import Task from "../src/models/Task.js";
import ChannelMember from "../src/models/ChannelMember.js";
import { getIO } from "../src/socket.js";
import {
  createTask,
  deleteTask,
  updateTaskStatus
} from "../src/controllers/task.controller.js";

const invoke = (handler, req) => new Promise((resolve) => {
  let settled = false;
  const finish = (value) => {
    if (!settled) {
      settled = true;
      resolve(value);
    }
  };
  const res = {
    statusCode: 200,
    body: undefined,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      finish({ res: this, error: undefined });
      return this;
    }
  };
  const next = vi.fn((error) => finish({ res, error }));
  handler(req, res, next);
});

const populatedQuery = (value) => ({
  populate: vi.fn(() => ({
    populate: vi.fn().mockResolvedValue(value)
  }))
});

describe("task controller authorization and behavior", () => {
  let emit;
  let to;

  beforeEach(() => {
    vi.clearAllMocks();
    emit = vi.fn();
    to = vi.fn(() => ({ emit }));
    getIO.mockReturnValue({ to });
  });

  it("rejects task creation when required fields are missing", async () => {
    const result = await invoke(createTask, {
      body: { title: "Incomplete task" },
      user: { _id: "user-1" }
    });

    expect(result.res.statusCode).toBe(400);
    expect(result.res.body.message).toMatch(/required/i);
    expect(ChannelMember.findOne).not.toHaveBeenCalled();
    expect(Task.create).not.toHaveBeenCalled();
  });

  it("prevents non-members from creating tasks", async () => {
    ChannelMember.findOne.mockResolvedValue(null);

    const result = await invoke(createTask, {
      body: { title: "Task", channelId: "channel-1", workspaceId: "workspace-1" },
      user: { _id: "outsider" }
    });

    expect(result.res.statusCode).toBe(403);
    expect(result.res.body.message).toBe("You are not a member of this channel");
    expect(Task.create).not.toHaveBeenCalled();
  });

  it("prevents regular members from creating tasks", async () => {
    ChannelMember.findOne.mockResolvedValue({ role: "member" });

    const result = await invoke(createTask, {
      body: { title: "Task", channelId: "channel-1", workspaceId: "workspace-1" },
      user: { _id: "member-1" }
    });

    expect(result.res.statusCode).toBe(403);
    expect(result.res.body.message).toMatch(/Admins or Managers/i);
    expect(Task.create).not.toHaveBeenCalled();
  });

  it("allows a manager to create a task and emits the realtime event", async () => {
    const populatedTask = { _id: "task-1", title: "Write tests", status: "todo" };
    ChannelMember.findOne.mockResolvedValue({ role: "manager" });
    Task.create.mockResolvedValue({ _id: "task-1" });
    Task.findById.mockReturnValue(populatedQuery(populatedTask));

    const result = await invoke(createTask, {
      body: {
        title: "Write tests",
        description: "Protect important behavior",
        priority: "high",
        assignedTo: ["member-1"],
        channelId: "channel-1",
        workspaceId: "workspace-1"
      },
      user: { _id: "manager-1" }
    });

    expect(result.res.statusCode).toBe(201);
    expect(result.res.body.data).toBe(populatedTask);
    expect(Task.create).toHaveBeenCalledWith(expect.objectContaining({
      title: "Write tests",
      status: "todo",
      createdBy: "manager-1"
    }));
    expect(to).toHaveBeenCalledWith("channel-1");
    expect(emit).toHaveBeenCalledWith("new-task", populatedTask);
  });

  it("returns 404 when updating a missing task", async () => {
    Task.findById.mockResolvedValue(null);

    const result = await invoke(updateTaskStatus, {
      params: { taskId: "missing-task" },
      body: { status: "done" },
      user: { _id: "user-1" }
    });

    expect(result.res.statusCode).toBe(404);
    expect(result.res.body.message).toBe("Task not found");
  });

  it("prevents an unrelated member from updating a task", async () => {
    Task.findById.mockResolvedValue({
      _id: "task-1",
      channelId: "channel-1",
      assignedTo: ["assignee-1"]
    });
    ChannelMember.findOne.mockResolvedValue({ role: "member" });

    const result = await invoke(updateTaskStatus, {
      params: { taskId: "task-1" },
      body: { status: "done" },
      user: { _id: "member-2" }
    });

    expect(result.res.statusCode).toBe(403);
    expect(result.res.body.message).toBe("Access Denied");
  });

  it("allows an assignee to update task status", async () => {
    const task = {
      _id: "task-1",
      channelId: "channel-1",
      assignedTo: ["assignee-1"],
      status: "todo",
      save: vi.fn().mockResolvedValue(undefined)
    };
    const updatedTask = { ...task, status: "done" };
    Task.findById
      .mockResolvedValueOnce(task)
      .mockReturnValueOnce(populatedQuery(updatedTask));
    ChannelMember.findOne.mockResolvedValue({ role: "member" });

    const result = await invoke(updateTaskStatus, {
      params: { taskId: "task-1" },
      body: { status: "done" },
      user: { _id: "assignee-1" }
    });

    expect(result.res.statusCode).toBe(200);
    expect(task.status).toBe("done");
    expect(task.save).toHaveBeenCalledOnce();
    expect(emit).toHaveBeenCalledWith("task-updated", updatedTask);
  });

  it("prevents regular members from deleting tasks", async () => {
    Task.findById.mockResolvedValue({
      _id: "task-1",
      channelId: "channel-1"
    });
    ChannelMember.findOne.mockResolvedValue({ role: "member" });

    const result = await invoke(deleteTask, {
      params: { taskId: "task-1" },
      user: { _id: "member-1" }
    });

    expect(result.res.statusCode).toBe(403);
    expect(Task.findByIdAndDelete).not.toHaveBeenCalled();
  });

  it("allows a channel admin to delete a task and emits the event", async () => {
    Task.findById.mockResolvedValue({
      _id: "task-1",
      channelId: "channel-1"
    });
    ChannelMember.findOne.mockResolvedValue({ role: "admin" });
    Task.findByIdAndDelete.mockResolvedValue({ _id: "task-1" });

    const result = await invoke(deleteTask, {
      params: { taskId: "task-1" },
      user: { _id: "admin-1" }
    });

    expect(result.res.statusCode).toBe(200);
    expect(Task.findByIdAndDelete).toHaveBeenCalledWith("task-1");
    expect(emit).toHaveBeenCalledWith("task-deleted", "task-1");
  });
});
