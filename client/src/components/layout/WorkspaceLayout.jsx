import { useEffect } from "react";
import { Outlet, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import Sidebar from "../ui/Sidebar"

import { fetchChannelInWS, fetchMyWorkspace, fetchWorkSpaceByid } from "../../features/workspace/workspaceSlice";

export default function WorkspaceLayout() {
  const dispatch = useDispatch();
  const { workspaceId } = useParams();
  const { loading, currentWorkspace, myWorkspaces, joinedWorkspaces } = useSelector((state) => state.workspace);

  useEffect(() => {
    if (workspaceId && currentWorkspace?._id !== workspaceId) {
      dispatch(fetchWorkSpaceByid(workspaceId));
    }
    if ((!myWorkspaces || myWorkspaces.length === 0) && (!joinedWorkspaces || joinedWorkspaces.length === 0)) {
      dispatch(fetchMyWorkspace());
    }
    dispatch(fetchChannelInWS(workspaceId));
  }, [dispatch, workspaceId, currentWorkspace?._id, myWorkspaces?.length, joinedWorkspaces?.length]);
  
  const isTransitioning = currentWorkspace?._id !== workspaceId;
  if (loading && isTransitioning) {
    return (
      <div className="flex h-screen items-center justify-center bg-background text-white">
        Loading Workspace...
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <div className="w-[260px] h-full border-r border-gray-800 bg-surface">
        <Sidebar />
      </div>
      <div className="flex-1 h-full flex flex-col min-w-0">
        <Outlet />
      </div>
    </div>
  );
}

