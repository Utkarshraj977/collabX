 import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-hot-toast";
import { X, Search, UserPlus, CheckCircle2, Shield, ShieldAlert, Loader2 } from "lucide-react"; 
import { getAllWorkspaceMembers, addMemberToChannel } from "../../services/api"

export default function ChannelMemberPanel({ onClose }) {
  const { workspaceId, channelId } = useParams();
  const dispatch = useDispatch();
  
  // Get current channel details from Redux for the header
  const { channels } = useSelector((state) => state.workspace);
  const currentChannel = channels.find(c => c._id === channelId);

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  const [addingIds, setAddingIds] = useState(new Set());
  const [addedIds, setAddedIds] = useState(new Set());

  // 1. Fetch All Workspace Members on Mount
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await getAllWorkspaceMembers(workspaceId);
        setMembers(response.data.data || []);
      } catch (error) {
        toast.error("Failed to load workspace members");
      } finally {
        setLoading(false);
      }
    };

    if (workspaceId) fetchMembers();
  }, [workspaceId]);

  // 2. Handle Add Member Logic
  const handleAddUser = async (userId) => {
    // Prevent double clicks
    if (addingIds.has(userId) || addedIds.has(userId)) return;

    // Add to loading set
    setAddingIds(prev => new Set(prev).add(userId));

    try {
      // Call the API (Sending array as per your new controller)
      await addMemberToChannel(channelId, [userId]); 
      
      toast.success("Member added successfully");
      
      // Add to 'Success' set to show Checkmark
      setAddedIds(prev => new Set(prev).add(userId));

    } catch (error) {
      
      toast.error("You are not authorized to add this member or allready exist");
    } finally {
      // Remove from loading set
      setAddingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(userId);
        return newSet;
      });
    }
  };

  // Filter logic
  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Slide-in Panel */}
      <div className="absolute inset-y-0 right-0 max-w-sm w-full flex pointer-events-none">
        <div className="pointer-events-auto h-full w-full bg-[#121016] border-l border-gray-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* --- HEADER --- */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-[#15171c]">
            <div>
                <h2 className="text-lg font-bold text-white">Add People</h2>
                <p className="text-xs text-gray-400">
                    To <span className="text-white font-bold">#{currentChannel?.name || "Channel"}</span>
                </p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* --- SEARCH BAR --- */}
          <div className="p-4 border-b border-gray-800 bg-[#121016]">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-500 transition-colors" size={16} />
                <input 
                    type="text" 
                    placeholder="Search by name or email..." 
                    className="w-full bg-[#0b0c10] border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-gray-600"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
            </div>
          </div>

          {/* --- MEMBER LIST --- */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {loading ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500 gap-3">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                    <span className="text-sm">Loading members...</span>
                </div>
            ) : filteredMembers.length > 0 ? (
                filteredMembers.map((member) => {
                    const isAdding = addingIds.has(member._id);
                    const isAdded = addedIds.has(member._id);

                    return (
                        <div key={member._id} className="flex items-center justify-between p-3 rounded-lg hover:bg-[#1a1b21] border border-transparent hover:border-gray-800 transition group">
                            
                            {/* User Info */}
                            <div className="flex items-center gap-3 overflow-hidden">
                                <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center text-sm font-bold text-white shrink-0 border border-gray-600">
                                    {member.avatarUrl ? (
                                        <img src={member.avatarUrl} alt={member.name} className="w-full h-full rounded-lg object-cover" />
                                    ) : (
                                        member.name?.charAt(0).toUpperCase()
                                    )}
                                </div>
                                
                                <div className="flex flex-col overflow-hidden">
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-gray-200 truncate">{member.name}</span>
                                        {/* Roles Badges */}
                                        {member.role === 'admin' && <ShieldAlert size={12} className="text-red-400" title="Workspace Admin" />}
                                        {member.role === 'manager' && <Shield size={12} className="text-blue-400" title="Workspace Manager" />}
                                    </div>
                                    <span className="text-xs text-gray-500 truncate">{member.email}</span>
                                </div>
                            </div>

                            {/* Action Button */}
                            <button 
                                onClick={() => handleAddUser(member._id)}
                                disabled={isAdding || isAdded}
                                className={`p-2 rounded-lg transition-all duration-200 border ${
                                    isAdded 
                                    ? "bg-green-500/10 text-green-500 border-green-500/20" 
                                    : "bg-gray-800 text-gray-400 border-gray-700 hover:bg-blue-600 hover:text-white hover:border-blue-500"
                                }`}
                                title={isAdded ? "Already Added" : "Add to Channel"}
                            >
                               {isAdding ? (
                                   <Loader2 size={18} className="animate-spin" />
                               ) : isAdded ? (
                                   <CheckCircle2 size={18} />
                               ) : (
                                   <UserPlus size={18} />
                               )}
                            </button>
                        </div>
                    );
                })
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                    <Search size={32} className="mb-2 opacity-20" />
                    <p className="text-sm">No members found</p>
                </div>
            )}
          </div>

          {/* --- FOOTER --- */}
          <div className="p-4 border-t border-gray-800 bg-[#15171c]">
             <div className="flex items-start gap-2 text-[11px] text-gray-500 bg-gray-800/30 p-3 rounded-lg border border-gray-800">
                <Shield size={14} className="mt-0.5 shrink-0" />
                <p>Only Workspace Admins & Channel Managers have permission to add members to this channel.</p>
             </div>
          </div>

        </div>
      </div>
    </div>
  );
}
