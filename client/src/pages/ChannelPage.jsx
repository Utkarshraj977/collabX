import { useParams } from "react-router-dom";
import { useState, useEffect } from "react";
import { MessageSquare, ListTodo, Video, GitBranch } from "lucide-react";
import Chat from "./Chat";
import Tasks from "./Tasks";
import GitHub from "./GitHub";
import Meet1 from "./Meet1";
import { fetchChannelById } from "../features/workspace/workspaceSlice";
import { useDispatch, useSelector } from "react-redux";
import toast from 'react-hot-toast';
import { getSocket } from '../services/socket';

export default function ChannelPage() {
  const { channelId, workspaceId } = useParams();
  const [activeTab, setActiveTab] = useState("chat");
  const [isMeetingLive, setIsMeetingLive] = useState(false);
  const dispatch = useDispatch();
  const socket=getSocket();
  
  const tabs = [
    { id: "chat", label: "Chat", icon: MessageSquare },
    { id: "tasks", label: "Tasks", icon: ListTodo },
    { id: "github", label: "GitHub", icon: GitBranch },
    { id: "meet", label: "Meet", icon: Video },
  ];

  useEffect(() => {
    socket.on("meeting-is-live", (data) => {
      if (data.channelId === channelId) {
        setIsMeetingLive(true);
        toast.success(data.message, { duration: 5000 });
      }
    });

    return () => {
      socket.off("meeting-is-live");
    }
  }, [channelId]);
  useEffect(() => {
    if (channelId) {
      dispatch(fetchChannelById(channelId));

    }
  }, [dispatch, channelId]);

  const currentChannel = useSelector((state) => state.workspace);
  const cc = currentChannel.currentChannel;
  return (
    <div className="flex flex-col h-full bg-[#15171c] text-white">
      <div className="h-16 border-b border-gray-800 flex items-center justify-between px-6 bg-surface/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl text-gray-500 font-light">#</span>
              <h1 className="font-bold text-lg tracking-wide">{cc?.name}</h1>
            </div>
            <p className="text-[10px] text-gray-400 hidden md:block">{cc?.description}</p>
          </div>
        </div>

        <div className="flex bg-[#0b0c10] rounded-lg p-1 gap-1 border border-gray-800">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-xs font-bold flex items-center gap-2 transition-all ${activeTab === tab.id
                  ? "bg-gray-700 text-white shadow-lg"
                  : "text-gray-500 hover:bg-gray-800 hover:text-gray-300"
                  }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="flex -space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500 border-2 border-[#15171c]" title="Rahul"></div>
          <div className="w-8 h-8 rounded-full bg-secondary border-2 border-[#15171c]" title="Utkarsh"></div>
          <div className="w-8 h-8 rounded-full bg-gray-700 border-2 border-[#15171c] flex items-center justify-center text-xs">+3</div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {activeTab === "chat" && <Chat channelId={channelId} />}
        {activeTab === "tasks" && <Tasks channelId={channelId} workspaceId={workspaceId} />}
        {activeTab === "github" && <GitHub channelId={channelId} workspaceId={workspaceId} />}
        {activeTab === "meet" && <Meet1 channelId={channelId} />}
      </div>
    
    </div>
  );
}

