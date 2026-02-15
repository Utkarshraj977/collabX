import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { GitBranch, Copy, Check, X, Settings, ExternalLink, GitCommit, GitPullRequest, AlertCircle } from "lucide-react";
import { connectRepo, clearWebhookDetails, fetchConnectedRepos, setWebhookDetails } from "../features/github/githubSlice";
import { addNewMessage } from "../features/messages/messageSlice"; 
import { getSocket } from "../services/socket";

export default function GitHub({ channelId, workspaceId }) {
  const dispatch = useDispatch();
  const socket = getSocket(); 

  const { connectedRepos, webhookDetails, loading, error } = useSelector((state) => state.github);
  const { messages } = useSelector((state) => state.message); 
  
  // Local State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [repoName, setRepoName] = useState("");
  const [copied, setCopied] = useState(null);

  // 1. Fetch Connected Repos on Mount
  useEffect(() => {
    if (channelId) {
      dispatch(fetchConnectedRepos(channelId));
    }
  }, [dispatch, channelId]);

  
  useEffect(() => {
    if (!socket) return;
    socket.emit("join-channel",channelId);

    const handleNewMessage = (newMessage) => {
      if (newMessage.channelId === channelId && newMessage.type === 'github') {
        dispatch(addNewMessage(newMessage));
      }
    };

    socket.on("new-message", handleNewMessage);

    return () => {
      socket.off("new-message", handleNewMessage);
    };
  }, [socket, channelId, dispatch]);

  const githubMessages = messages.filter(m => m.type === 'github');

  const handleConnect = async (e) => {
    e.preventDefault();
    if (!repoName.trim()) return;
    await dispatch(connectRepo({ channelId, workspaceId, repoFullName: repoName }));
  };

  const openConfigModal = (repo) => {
    const webhookUrl = `${import.meta.env.VITE_BACKEND_URL.replace('/api/v1', '')}/api/v1/github/webhook`;
    
    dispatch(setWebhookDetails({
        url: webhookUrl,
        secret: repo.webhookSecret 
    }));
    setIsModalOpen(true);
  };

  const handleClose = () => {
      setIsModalOpen(false);
      dispatch(clearWebhookDetails());
      setRepoName("");
  };

  const copyToClipboard = (text, type) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  // --- Render Helper: The Activity Feed Item ---
  const renderFeedItem = (msg) => {
    // Simple parsing to determine icon based on content string
    let Icon = GitCommit;
    let color = "text-blue-400";
    
    if (msg.content.includes("Pull Request")) { Icon = GitPullRequest; color = "text-purple-400"; }
    else if (msg.content.includes("Issue")) { Icon = AlertCircle; color = "text-yellow-400"; }

    return (
      <div key={msg._id} className="bg-[#1e1f24] p-3 rounded-lg border border-gray-800 mb-3 flex gap-3">
        <div className={`mt-1 ${color}`}><Icon size={18} /></div>
        <div className="flex-1 overflow-hidden">
            <div className="text-sm text-gray-300 whitespace-pre-wrap font-mono" dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>') }} />
            <div className="text-[10px] text-gray-500 mt-1">{new Date(msg.createdAt).toLocaleString()}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#15171c]">
      
      {/* --- View 1: Not Connected (Empty State) --- */}
      {connectedRepos.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
            <GitBranch size={48} className="mb-4 text-gray-600" />
            <h2 className="text-xl font-bold text-white">GitHub Integration</h2>
            <p className="text-gray-400 mb-6">Connect a repository to receive real-time updates.</p>
            <button 
                onClick={() => setIsModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded text-white transition flex items-center gap-2 font-medium"
            >
                <GitBranch size={16} /> Connect Repo
            </button>
        </div>
      ) : (
        /* --- View 2: Dashboard (Activity Feed) --- */
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-[#1e1f24]">
                <div className="flex items-center gap-2">
                    <GitBranch className="text-white" size={20} />
                    <h2 className="font-bold text-white text-lg">
                        {connectedRepos[0]?.repoFullName}
                    </h2>
                    <span className="bg-green-500/10 text-green-500 text-xs px-2 py-0.5 rounded border border-green-500/20">Active</span>
                </div>
                <button 
                    onClick={() => openConfigModal(connectedRepos[0])}
                    className="text-xs flex items-center gap-1 text-gray-400 hover:text-white border border-gray-700 px-3 py-1.5 rounded hover:bg-gray-700 transition"
                >
                    <Settings size={14} /> Configuration
                </button>
            </div>

            {/* Scrollable Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {githubMessages.length > 0 ? (
                    githubMessages.slice().reverse().map(renderFeedItem)
                ) : (
                    <div className="text-center text-gray-500 mt-10">
                        <p>No activity yet.</p>
                        <p className="text-xs mt-1">Push code to your repo to see events here.</p>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* --- Shared Connect/Config Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-[#1e1f24] p-6 rounded-xl w-[500px] border border-gray-700 shadow-2xl">
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white">
                  {webhookDetails ? "Webhook Configuration" : "Connect Repository"}
              </h3>
              <button onClick={handleClose} className="text-gray-400 hover:text-white transition"><X size={20}/></button>
            </div>

            {error && <div className="bg-red-500/10 text-red-400 p-3 rounded mb-4 text-sm border border-red-500/20">{error}</div>}

            {webhookDetails ? (
              <div className="space-y-5 animate-in fade-in zoom-in duration-200">
                <div className="bg-blue-500/10 text-blue-400 p-3 rounded text-sm border border-blue-500/20 flex gap-2">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <span>Copy these details to your GitHub Repository Settings &gt; Webhooks.</span>
                </div>
                
                <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Payload URL</label>
                    <div className="flex items-center gap-2 bg-[#15171c] border border-gray-700 rounded p-2">
                        <code className="text-sm text-blue-400 truncate flex-1 font-mono">{webhookDetails.url}</code>
                        <button onClick={() => copyToClipboard(webhookDetails.url, 'url')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition">
                            {copied === 'url' ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </button>
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 block mb-1 uppercase tracking-wider font-semibold">Secret Key</label>
                    <div className="flex items-center gap-2 bg-[#15171c] border border-gray-700 rounded p-2">
                        <code className="text-sm text-yellow-400 truncate flex-1 font-mono">{webhookDetails.secret}</code>
                        <button onClick={() => copyToClipboard(webhookDetails.secret, 'secret')} className="p-1.5 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition">
                            {copied === 'secret' ? <Check size={16} className="text-green-500"/> : <Copy size={16}/>}
                        </button>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <button 
                        onClick={handleClose}
                        className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition"
                    >
                        Close
                    </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConnect} className="animate-in fade-in zoom-in duration-200">
                <div className="mb-6">
                  <label className="text-sm text-gray-300 block mb-2 font-medium">Repository Full Name</label>
                  <div className="relative">
                    <GitBranch className="absolute left-3 top-2.5 text-gray-500" size={18} />
                    <input 
                        type="text" 
                        placeholder="owner/repo-name"
                        className="w-full bg-[#15171c] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition"
                        value={repoName}
                        onChange={(e) => setRepoName(e.target.value)}
                        autoFocus
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 ml-1">Example: <span className="text-gray-400">facebook/react</span> or <span className="text-gray-400">collabx/frontend</span></p>
                </div>
                
                <div className="flex justify-end gap-3">
                  <button type="button" onClick={handleClose} className="px-4 py-2 text-gray-400 hover:text-white transition">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 flex items-center gap-2 transition shadow-lg shadow-blue-900/20"
                  >
                    {loading ? "Generating..." : "Generate Webhook"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

