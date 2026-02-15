import { useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import toast from "react-hot-toast"; 
import { UserPlus } from "lucide-react"; // 🔥 Import Icon

import { addAccessibleChannel } from "../../features/workspace/workspaceSlice";
import CreateWorkspace from "./CreateWorkspace";
import CreateChannelModal from "./CreateChannelModal";
import UserProfilePanel from "./UserProfilePanel";
import InviteSection from "./InviteSection";
import ChannelMemberPanel from "./ChannelMemberPanel"; // 🔥 Import Panel
import { verifyChannelAccess } from "../../services/api"; 

export default function Sidebar() {
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showCreateWorkspace, setShowCreateWorkspace] = useState(false);
    const [showCreateChannel, setShowCreateChannel] = useState(false);
    
    // Existing Profile State
    const [showProfile, setShowProfile] = useState(false);
    
    // 🔥 NEW State for Add Member Panel
    const [showAddMember, setShowAddMember] = useState(false);
    
    const [isNavigating, setIsNavigating] = useState(false); 

    const navigate = useNavigate();
    const location = useLocation();
    
    // Get channelId to conditionally show the Add button
    const { workspaceId, channelId } = useParams();
    
    const dispatch = useDispatch(); 
    const { user } = useSelector((state) => state.auth);
    const { currentWorkspace, myWorkspaces, accessibleChannels, joinedWorkspaces, channels } = useSelector((state) => state.workspace);

    const myws = myWorkspaces || [];
    const joinedws = joinedWorkspaces || [];
    const allws = [...myws, ...joinedws];
    const currentws = currentWorkspace;
    const channelList = channels || [];

    const isAdmin = currentws?.ownerId === user?._id;

    const handleCreateWorkspaceOpen = () => {
        setIsDropdownOpen(false);
        setShowCreateWorkspace(true);
    };

    const handleNavigate = async (targetChannelId) => {
        if (isNavigating) return; 

        if (location.pathname.includes(targetChannelId)) return;
        if (accessibleChannels.includes(targetChannelId)) {
            navigate(`/workspace/${workspaceId}/channel/${targetChannelId}`);
            return;
        }
        setIsNavigating(true);
        try {
            let response = await verifyChannelAccess(targetChannelId);
            // Check if response has data property or is direct data
            const data = response.data || response; 
            
            if (data.isMember) {
                navigate(`/workspace/${workspaceId}/channel/${targetChannelId}`);
                dispatch(addAccessibleChannel(targetChannelId));                
            } else {
                toast.error("You are not a member of this channel.");
            }
        } catch (error) {
            toast.error("Unable to verify channel access.");
        } finally {
            setIsNavigating(false);
        }
    };

    return (
        <div className="h-full flex flex-col relative bg-background border-r border-gray-800 text-text-main">

            {/* --- WORKSPACE HEADER --- */}
            <div
                className="h-12 flex items-center px-4 gap-2 border-b border-gray-800 cursor-pointer hover:bg-surface transition-colors"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
                <div className="w-6 h-6 rounded bg-surface flex items-center justify-center text-xs font-bold text-text-main shrink-0 border border-gray-700">
                    {currentws?.name?.charAt(0).toUpperCase() || "W"}
                </div>
                <div className="flex-1 overflow-hidden">
                    <span className="font-bold text-md truncate block text-text-main">
                        {currentws?.name || "Select Workspace"}
                    </span>
                </div>
                <span className={`text-xs text-text-muted transform transition-transform ${isDropdownOpen ? "rotate-180" : ""}`}>
                    ▼
                </span>
            </div>

            {isDropdownOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsDropdownOpen(false)}></div>
                    <div className="absolute top-14 left-2 right-2 bg-surface border border-gray-700 rounded-lg shadow-2xl z-20 py-2">
                        <p className="px-4 py-2 text-xs font-bold text-text-muted uppercase tracking-wider">
                            Switch Workspace
                        </p>

                        {allws.map((ws) => (
                            <div
                                key={ws._id}
                                onClick={() => {
                                    navigate(`/workspace/${ws._id}`);
                                    setIsDropdownOpen(false);
                                }}
                                className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-background transition-colors"
                            >
                                <div className="w-6 h-6 rounded bg-background border border-gray-700 flex items-center justify-center text-xs font-bold text-text-muted">
                                    {ws.name?.charAt(0).toUpperCase()}
                                </div>
                                <span className={`text-sm ${ws._id === workspaceId ? "font-bold text-primary" : "text-text-muted"}`}>
                                    {ws.name}
                                </span>
                            </div>
                        ))}

                        <div className="h-px bg-gray-700 my-2 mx-2"></div>

                        <div
                            onClick={handleCreateWorkspaceOpen}
                            className="px-4 py-2 flex items-center gap-3 cursor-pointer hover:bg-background text-text-muted hover:text-text-main transition"
                        >
                            <div className="w-6 h-6 rounded border border-dashed border-gray-500 flex items-center justify-center text-xs">
                                +
                            </div>
                            <span className="text-sm">Create Workspace</span>
                        </div>
                    </div>
                </>
            )}

            {/* --- CHANNEL LIST --- */}
            <div className="flex-1 overflow-y-auto mt-4 px-2 custom-scrollbar">

                <div className="flex items-center justify-between px-2 mb-2 group h-6">
                    <h3 className="text-xs font-bold text-text-muted uppercase tracking-wider">
                        Channels
                    </h3>

                    {isAdmin && (
                        <div
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowCreateChannel(true);
                            }}
                            className="text-text-muted hover:text-text-main cursor-pointer p-1 rounded hover:bg-surface transition-all"
                            title="Create Channel"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="12" y1="5" x2="12" y2="19"></line>
                                <line x1="5" y1="12" x2="19" y2="12"></line>
                            </svg>
                        </div>
                    )}
                </div>

                <div className="space-y-[2px]">
                    {channelList.map((channel) => {
                        const isActive = location.pathname.includes(channel._id);
                        return (
                            <div
                                key={channel._id}
                                onClick={() => handleNavigate(channel._id)}
                                className={`w-full px-3 py-2 rounded-lg cursor-pointer transition-colors group mx-1 ${isActive ? "bg-secondary/10 text-secondary" : "hover:bg-surface text-text-muted hover:text-text-main"}`}
                            >
                                <div className="flex items-center gap-2">
                                    <span className={`text-lg leading-none ${isActive ? "opacity-100" : "opacity-70"}`}>#</span>
                                    <span className={`font-medium text-sm truncate ${isActive ? "font-bold" : ""}`}>{channel.name}</span>
                                </div>

                                {channel.description && (
                                    <p className={`text-[11px] pl-5 mt-0.5 truncate ${isActive ? "text-secondary/70" : "text-text-muted/70 group-hover:text-text-muted"}`}>
                                        {channel.description}
                                    </p>
                                )}
                            </div>
                        );
                    })}

                    {channelList.length === 0 && (
                        <div className="px-4 text-xs text-text-muted italic mt-2">No channels found</div>
                    )}
                </div>
            </div>

            <InviteSection 
                workspaceId={currentws?._id} 
                isAdmin={isAdmin} 
            />

            {/* 🔥 UPDATED FOOTER SECTION */}
            <div className="p-4 bg-surface/50 border-t border-gray-800 flex items-center justify-between gap-2">
                
                {/* 1. Profile Trigger (Left Side - Keeps existing behavior) */}
                <div 
                    onClick={() => setShowProfile(true)}
                    className="flex-1 flex items-center gap-3 cursor-pointer hover:opacity-80 transition overflow-hidden"
                >
                    <div className="w-8 h-8 rounded bg-gray-600 flex items-center justify-center text-black font-bold border border-gray-500 shrink-0">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt="User" className="w-full h-full rounded-full object-cover" />
                        ) : (
                            user?.name?.charAt(0).toUpperCase()
                        )}
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm font-bold text-text-main truncate">{user?.name || "User"}</p>
                        <p className="text-xs text-secondary flex items-center gap-1">
                            <span className="inline-block w-2 h-2 rounded-full bg-secondary"></span>
                            Online
                        </p>
                    </div>
                </div>

                {/* 2. Add Member Trigger (Right Side - Only visible inside a channel) */}
                {channelId && (
                    <button
                        onClick={() => setShowAddMember(true)}
                        className="p-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white transition-all shrink-0"
                        title="Add people to channel"
                    >
                        <UserPlus size={16} />
                    </button>
                )}
            </div>

            {/* --- MODALS --- */}
            {showCreateWorkspace && (
                <CreateWorkspace onClose={() => setShowCreateWorkspace(false)} />
            )}

            {showCreateChannel && (
                <CreateChannelModal
                    workspaceId={workspaceId}
                    onClose={() => setShowCreateChannel(false)}
                />
            )}

            {/* Existing Profile Panel */}
            {showProfile && (
                <UserProfilePanel onClose={() => setShowProfile(false)} />
            )}

            {/* 🔥 NEW Add Member Panel */}
            {showAddMember && channelId && (
                <ChannelMemberPanel onClose={() => setShowAddMember(false)} />
            )}
        </div>
    );
}