import { beforeEach, describe, expect, it, vi } from "vitest";
import jwt from "jsonwebtoken";
import User from "../src/models/User.js";
import { verifyJWT } from "../src/middlewares/auth.middleware.js";

const runMiddleware = (req) => new Promise((resolve) => {
  const next = vi.fn((error) => resolve({ error, next, req }));
  verifyJWT(req, {}, next);
});

describe("verifyJWT", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.ACCESS_TOKEN_SECRET = "test-access-secret";
  });

  it("accepts an access token from cookies and attaches the user", async () => {
    const user = { _id: "user-1", email: "user@example.com" };
    const verifySpy = vi.spyOn(jwt, "verify").mockReturnValue({ _id: user._id });
    vi.spyOn(User, "findById").mockResolvedValue(user);
    const req = { cookies: { accesstoken: "cookie-token" }, header: vi.fn() };

    const result = await runMiddleware(req);

    expect(result.error).toBeUndefined();
    expect(req.user).toBe(user);
    expect(verifySpy).toHaveBeenCalledWith("cookie-token", "test-access-secret");
  });

  it("accepts a Bearer token when the cookie is absent", async () => {
    const user = { _id: "user-2" };
    vi.spyOn(jwt, "verify").mockReturnValue({ _id: user._id });
    vi.spyOn(User, "findById").mockResolvedValue(user);
    const req = {
      cookies: {},
      header: vi.fn((name) => name === "Authorization" ? "Bearer header-token" : undefined)
    };

    const result = await runMiddleware(req);

    expect(result.error).toBeUndefined();
    expect(req.user).toBe(user);
    expect(jwt.verify).toHaveBeenCalledWith("header-token", "test-access-secret");
  });

  it("rejects requests without an access token", async () => {
    const findUserSpy = vi.spyOn(User, "findById");
    const req = { cookies: {}, header: vi.fn() };

    const result = await runMiddleware(req);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("Unauthorized request");
    expect(findUserSpy).not.toHaveBeenCalled();
  });

  it("rejects a valid token when its user no longer exists", async () => {
    vi.spyOn(jwt, "verify").mockReturnValue({ _id: "deleted-user" });
    vi.spyOn(User, "findById").mockResolvedValue(null);
    const req = { cookies: { accesstoken: "valid-token" }, header: vi.fn() };

    const result = await runMiddleware(req);

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error.message).toBe("Invalid Access Token");
  });

  it("forwards JWT verification errors", async () => {
    vi.spyOn(jwt, "verify").mockImplementation(() => {
      throw new Error("jwt expired");
    });
    const req = { cookies: { accesstoken: "expired-token" }, header: vi.fn() };

    const result = await runMiddleware(req);

    expect(result.error.message).toBe("jwt expired");
  });
});
