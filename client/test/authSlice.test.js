import { describe, expect, it } from "vitest";
import reducer, {
  loadUser,
  loginSuccess,
  logoutUser
} from "../src/features/auth/authSlice.js";

describe("authSlice", () => {
  it("stores a user after login", () => {
    const user = { _id: "user-1", name: "Utkarsh" };
    const state = reducer(undefined, loginSuccess(user));

    expect(state).toEqual({
      user,
      isAuthenticated: true,
      loading: false
    });
  });

  it("tracks the load-user lifecycle", () => {
    const pending = reducer(undefined, { type: loadUser.pending.type });
    expect(pending.loading).toBe(true);

    const user = { _id: "user-1" };
    const fulfilled = reducer(pending, {
      type: loadUser.fulfilled.type,
      payload: user
    });
    expect(fulfilled.user).toBe(user);
    expect(fulfilled.isAuthenticated).toBe(true);
    expect(fulfilled.loading).toBe(false);

    const rejected = reducer(fulfilled, { type: loadUser.rejected.type });
    expect(rejected.user).toBeNull();
    expect(rejected.isAuthenticated).toBe(false);
    expect(rejected.loading).toBe(false);
  });

  it("clears authentication even when the logout request is rejected", () => {
    const authenticated = {
      user: { _id: "user-1" },
      isAuthenticated: true,
      loading: true
    };

    const fulfilled = reducer(authenticated, { type: logoutUser.fulfilled.type });
    const rejected = reducer(authenticated, { type: logoutUser.rejected.type });

    expect(fulfilled).toEqual({ user: null, isAuthenticated: false, loading: false });
    expect(rejected).toEqual({ user: null, isAuthenticated: false, loading: false });
  });
});
