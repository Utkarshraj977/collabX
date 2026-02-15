import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { joininvite } from "../services/api";
import { fetchMyWorkspace } from "../features/workspace/workspaceSlice";
import CreateWorkspace from "../components/ui/CreateWorkspace";
import toast from "react-hot-toast";
import UserProfilePanel from "../components/ui/UserProfilePanel";

export default function Dashboard() {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { user } = useSelector((state) => state.auth);
  const { myWorkspaces, joinedWorkspaces } = useSelector((state) => state.workspace || { myWorkspaces: [], joinedWorkspaces: [] });

  const [inviteCode, setInviteCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showprofile, setShowProfile] = useState(false);

  useEffect(() => {
    if ((!myWorkspaces || myWorkspaces.length === 0) && (!joinedWorkspaces || joinedWorkspaces.length === 0)) {
      dispatch(fetchMyWorkspace());
    }
  }, [dispatch, myWorkspaces?.length, joinedWorkspaces?.length]);

  const handleshowprofile = () => {
    setShowProfile(!showprofile);
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    try {
      setLoading(true);
      await joininvite(inviteCode);
      toast.success(`Joined workspace successfully!`);
      setInviteCode("");
      dispatch(fetchMyWorkspace());
    } catch (error) {
      toast.error("Invalid Invite Code");
    } finally {
      setLoading(false);
    }
  };
  const userInitials = user?.name
    ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2)
    : "UR";

  return (
    <div className="min-h-screen bg-background text-text-main p-8 md:p-16">

      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">CollabX<span className="text-secondary">.</span></h1>
          <p className="text-text-muted mt-1">Welcome back, {user?.name}</p>
        </div>

        <div 
          onClick={handleshowprofile}
          className="w-10 h-10 rounded-full bg-surface border border-gray-700 flex items-center justify-center overflow-hidden cursor-pointer hover:border-secondary transition-colors"
        >
          {user?.avatarUrl ? (
            <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <span className="text-secondary font-bold">{userInitials}</span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        <div className="lg:col-span-4 space-y-8">
          <CreateWorkspace />

          <div className="bg-surface border border-gray-800 p-5 rounded-xl">
            <label className="text-sm font-bold text-text-muted mb-3 block">Link: Join via Invite Link</label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Paste code here..."
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="w-full bg-background border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-secondary transition"
              />
              <button
                onClick={handleJoin}
                disabled={loading}
                className="bg-secondary/20 text-secondary border border-secondary/50 px-4 py-2 rounded-lg hover:bg-secondary hover:text-black font-bold transition disabled:opacity-50"
              >
                {loading ? "Joining..." : "Join"}
              </button>
            </div>
          </div>
        </div>

        <div className="lg:col-span-8 bg-surface/30 border border-gray-700 rounded-2xl p-6 h-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">

            <div className="flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-primary border-b border-gray-800 pb-2">
                Your Created Workspace List
              </h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">

                {(!myWorkspaces || myWorkspaces.length === 0) && (
                  <p className="text-gray-500 text-sm">No workspaces created yet.</p>
                )}

                {(myWorkspaces || []).map((ws) => (
                  <div
                    key={ws._id}
                    onClick={() => navigate(`/workspace/${ws._id}`)}
                    className="group flex justify-between items-center p-4 bg-background border border-gray-800 rounded-lg cursor-pointer hover:border-primary transition-all shadow-sm"
                  >
                    <span className="font-medium group-hover:text-primary transition-colors">{ws.name}</span>
                    <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded capitalize">
                      {ws.myRole}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col">
              <h2 className="text-lg font-bold mb-4 text-secondary border-b border-gray-800 pb-2">
                Joined Workspace List
              </h2>
              <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">

                {(!joinedWorkspaces || joinedWorkspaces.length === 0) && (
                  <p className="text-gray-500 text-sm">No joined workspaces yet.</p>
                )}

                {(joinedWorkspaces || []).map((ws) => (
                  <div
                    key={ws._id}
                    onClick={() => navigate(`/workspace/${ws._id}`)}
                    className="group flex justify-between items-center p-4 bg-background border border-gray-800 rounded-lg cursor-pointer hover:border-secondary transition-all shadow-sm"
                  >
                    <span className="font-medium group-hover:text-secondary transition-colors">{ws.name}</span>
                    <span className="text-xs text-gray-500 border border-gray-700 px-2 py-0.5 rounded capitalize">
                      {ws.myRole}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>
      {showprofile && <UserProfilePanel onClose={() => setShowProfile(false)} />}
    </div>
  );
}