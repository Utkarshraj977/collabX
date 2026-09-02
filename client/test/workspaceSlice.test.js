import { describe, expect, it, vi } from "vitest";

vi.mock("react-hot-toast", () => ({
  toast: { success: vi.fn(), error: vi.fn() }
}));

import reducer, {
  addAccessibleChannel,
  addWorkspace,
  clearWorkspaces,
  fetchWorkSpaceByid,
  resetAccessibleChannels,
  setCurrentWorkspace,
  setWorkspaces
} from "../src/features/workspace/workspaceSlice.js";

describe("workspaceSlice", () => {
  it("separates owned and joined workspaces", () => {
    const created = [{ _id: "workspace-1" }];
    const joined = [{ _id: "workspace-2" }];

    const state = reducer(undefined, setWorkspaces({ created, joined }));

    expect(state.myWorkspaces).toBe(created);
    expect(state.joinedWorkspaces).toBe(joined);
    expect(state.loading).toBe(false);
  });

  it("adds owned workspaces and selects the current workspace", () => {
    const workspace = { _id: "workspace-1", name: "Engineering" };
    let state = reducer(undefined, addWorkspace(workspace));
    state = reducer(state, setCurrentWorkspace(workspace));

    expect(state.myWorkspaces).toEqual([workspace]);
    expect(state.currentWorkspace).toBe(workspace);
  });

  it("does not duplicate accessible channel IDs", () => {
    let state = reducer(undefined, addAccessibleChannel("channel-1"));
    state = reducer(state, addAccessibleChannel("channel-1"));

    expect(state.accessibleChannels).toEqual(["channel-1"]);
    expect(reducer(state, resetAccessibleChannels()).accessibleChannels).toEqual([]);
  });

  it("tracks workspace fetch success and failure", () => {
    const pending = reducer(undefined, { type: fetchWorkSpaceByid.pending.type });
    expect(pending.loading).toBe(true);

    const workspace = { _id: "workspace-1" };
    const fulfilled = reducer(pending, {
      type: fetchWorkSpaceByid.fulfilled.type,
      payload: workspace
    });
    expect(fulfilled.currentWorkspace).toBe(workspace);
    expect(fulfilled.loading).toBe(false);

    const rejected = reducer(fulfilled, {
      type: fetchWorkSpaceByid.rejected.type,
      payload: "Workspace not found"
    });
    expect(rejected.error).toBe("Workspace not found");
  });

  it("clears user-specific workspace state", () => {
    const populated = {
      ...reducer(undefined, { type: "init" }),
      myWorkspaces: [{ _id: "workspace-1" }],
      joinedWorkspaces: [{ _id: "workspace-2" }],
      currentWorkspace: { _id: "workspace-1" },
      error: "old error"
    };

    const state = reducer(populated, clearWorkspaces());

    expect(state.myWorkspaces).toEqual([]);
    expect(state.joinedWorkspaces).toEqual([]);
    expect(state.currentWorkspace).toBeNull();
    expect(state.error).toBeNull();
  });
});
