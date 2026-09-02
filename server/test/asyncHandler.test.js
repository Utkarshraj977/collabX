import { describe, expect, it, vi } from "vitest";
import { asyncHandler } from "../src/utils/asyncHandler.js";

const flushPromises = () => new Promise((resolve) => setImmediate(resolve));

describe("asyncHandler", () => {
  it("runs a successful async request handler", async () => {
    const req = { id: "request-1" };
    const res = {};
    const next = vi.fn();
    const handler = vi.fn().mockResolvedValue("done");

    asyncHandler(handler)(req, res, next);
    await flushPromises();

    expect(handler).toHaveBeenCalledWith(req, res, next);
    expect(next).not.toHaveBeenCalled();
  });

  it("forwards rejected errors to Express", async () => {
    const error = new Error("database unavailable");
    const next = vi.fn();

    asyncHandler(async () => {
      throw error;
    })({}, {}, next);
    await flushPromises();

    expect(next).toHaveBeenCalledOnce();
    expect(next).toHaveBeenCalledWith(error);
  });

});
