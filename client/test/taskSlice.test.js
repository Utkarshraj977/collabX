import { describe, expect, it } from "vitest";
import reducer, {
  addNewTask,
  clearTasks,
  fetchTasks,
  removeTaskRealtime,
  updateTaskRealtime
} from "../src/features/tasks/taskSlice.js";

const initialState = {
  tasks: [],
  channelMembers: [],
  loading: false,
  error: null
};

describe("taskSlice", () => {
  it("adds realtime tasks once and keeps the newest task first", () => {
    const olderTask = { _id: "task-1", title: "Older" };
    const newerTask = { _id: "task-2", title: "Newer" };

    let state = reducer({ ...initialState, tasks: [olderTask] }, addNewTask(newerTask));
    state = reducer(state, addNewTask(newerTask));

    expect(state.tasks).toEqual([newerTask, olderTask]);
  });

  it("updates and removes tasks received through Socket.IO", () => {
    const task = { _id: "task-1", status: "todo" };
    const updatedTask = { _id: "task-1", status: "done" };

    const updated = reducer(
      { ...initialState, tasks: [task] },
      updateTaskRealtime(updatedTask)
    );
    expect(updated.tasks).toEqual([updatedTask]);

    const removed = reducer(updated, removeTaskRealtime("task-1"));
    expect(removed.tasks).toEqual([]);
  });

  it("tracks fetch success and failure", () => {
    const pending = reducer(initialState, { type: fetchTasks.pending.type });
    expect(pending.loading).toBe(true);
    expect(pending.error).toBeNull();

    const tasks = [{ _id: "task-1" }];
    const fulfilled = reducer(pending, {
      type: fetchTasks.fulfilled.type,
      payload: tasks
    });
    expect(fulfilled.tasks).toBe(tasks);
    expect(fulfilled.loading).toBe(false);

    const rejected = reducer(fulfilled, {
      type: fetchTasks.rejected.type,
      payload: "Request failed"
    });
    expect(rejected.loading).toBe(false);
    expect(rejected.error).toBe("Request failed");
  });

  it("clears channel-specific task state", () => {
    const state = reducer({
      ...initialState,
      tasks: [{ _id: "task-1" }],
      loading: true,
      error: "old error"
    }, clearTasks());

    expect(state.tasks).toEqual([]);
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});
