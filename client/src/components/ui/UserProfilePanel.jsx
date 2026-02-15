import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "../../features/auth/authSlice"; 
import { toast } from "react-hot-toast";
import { X, LogOut, Trash2, Settings, Mail } from "lucide-react"; 

export default function UserProfilePanel({ onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);

  const handleLogout = () => {
    dispatch(logoutUser());
    toast.success("Logged out successfully");
    navigate("/auth"); 
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      <div className="absolute inset-y-0 right-0 max-w-xs w-full flex">
        <div className="h-full w-full bg-[#121016] border-l border-gray-800 shadow-2xl transform transition-transform animate-in slide-in-from-right duration-300 flex flex-col">
          
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800">
            <h2 className="text-lg font-bold text-white">Profile</h2>
            <button 
              onClick={onClose} 
              className="p-1 rounded-md text-gray-400 hover:bg-gray-800 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex flex-col items-center py-8 border-b border-gray-800 bg-[#1a1b21]">
            <div className="w-24 h-24 rounded-full bg-gray-700 flex items-center justify-center text-4xl font-bold text-white mb-4 border-4 border-[#121016]">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="User" className="w-full h-full rounded-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            <h3 className="text-xl font-bold text-white">{user?.name}</h3>
            <div className="flex items-center gap-2 text-gray-400 text-sm mt-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              Active
            </div>
          </div>

          <div className="p-6 space-y-6 flex-1 overflow-y-auto">
            
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Email Address</label>
              <div className="flex items-center gap-3 text-gray-300">
                <Mail size={16} />
                <span>{user?.email}</span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">User ID</label>
              <code className="block bg-gray-800 p-2 rounded text-xs text-gray-400 font-mono select-all">
                {user?._id}
              </code>
            </div>

             <div className="pt-4 space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 transition text-sm font-medium">
                    <Settings size={18} />
                    Account Settings
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-400 hover:bg-red-500/10 transition text-sm font-medium">
                    <Trash2 size={18} />
                    Delete Account
                </button>
             </div>
          </div>

          <div className="p-6 border-t border-gray-800 bg-[#15171c]">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600/10 text-red-500 border border-red-600/20 hover:bg-red-600 hover:text-white py-2.5 rounded-lg font-bold transition-all"
            >
              <LogOut size={18} />
              Log Out
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
