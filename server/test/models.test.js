import { beforeAll, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import Channel from "../src/models/Channel.js";
import Message from "../src/models/Message.js";
import Task from "../src/models/Task.js";
import User from "../src/models/User.js";
import Workspace from "../src/models/Workspace.js";

const objectId = () => new mongoose.Types.ObjectId();

describe("Mongoose model contracts", () => {
  beforeAll(() => {
    process.env.ACCESS_TOKEN_SECRET = "access-secret-for-tests";
    process.env.ACCESS_TOKEN_EXPIRY = "15m";
    process.env.REFRESH_TOKEN_SECRET = "refresh-secret-for-tests";
    process.env.REFRESH_TOKEN_EXPIRY = "7d";
  });

  it("applies task defaults and validates required fields", () => {
    const task = new Task({
      workspaceId: objectId(),
      channelId: objectId(),
      title: "Ship test suite",
      createdBy: objectId()
    });

    expect(task.validateSync()).toBeUndefined();
    expect(task.status).toBe("todo");
    expect(task.priority).toBe("medium");
    expect(task.assignedTo).toEqual([]);

    const invalidTask = new Task({ status: "blocked" });
    const error = invalidTask.validateSync();
    expect(error.errors.title).toBeDefined();
    expect(error.errors.workspaceId).toBeDefined();
    expect(error.errors.channelId).toBeDefined();
    expect(error.errors.createdBy).toBeDefined();
    expect(error.errors.status).toBeDefined();
  });

  it("applies workspace plan and channel defaults", () => {
    const workspace = new Workspace({
      name: "Engineering",
      slug: "engineering",
      ownerId: objectId()
    });
    const channel = new Channel({
      workspaceId: workspace._id,
      name: "general",
      createdBy: workspace.ownerId
    });

    expect(workspace.validateSync()).toBeUndefined();
    expect(workspace.planType).toBe("free");
    expect(workspace.settings.allowPublicChannels).toBe(true);
    expect(workspace.settings.defaultChannels).toEqual(["general"]);
    expect(channel.isPrivate).toBe(false);
    expect(channel.isArchived).toBe(false);
  });

  it("keeps channel names unique within each workspace", () => {
    const compoundIndex = Channel.schema.indexes().find(([fields]) =>
      fields.workspaceId === 1 && fields.name === 1
    );

    expect(compoundIndex).toBeDefined();
    expect(compoundIndex[1].unique).toBe(true);
  });

  it("uses text as the default message type", () => {
    const message = new Message({ channelId: objectId(), content: "Hello" });

    expect(message.validateSync()).toBeUndefined();
    expect(message.type).toBe("text");
  });

  it("generates access and refresh tokens with the correct identity", () => {
    const user = new User({
      name: "Test User",
      email: "TEST@EXAMPLE.COM",
      passwordHash: "plain-text-before-save"
    });

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    const accessPayload = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
    const refreshPayload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);

    expect(user.email).toBe("test@example.com");
    expect(accessPayload._id).toBe(user._id.toString());
    expect(accessPayload.email).toBe("test@example.com");
    expect(refreshPayload._id).toBe(user._id.toString());
  });
});
