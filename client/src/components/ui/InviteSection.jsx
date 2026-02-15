import { useState } from "react";
import { UserPlus, Check, Copy, Loader2 } from "lucide-react"; 
import { createWorkspaceInvite } from "../../services/api";
import toast from "react-hot-toast"; 

export default function InviteSection({ workspaceId, isAdmin }) {
    const [isLoading, setIsLoading] = useState(false);
    const [inviteUrl, setInviteUrl] = useState(null);
    const [copied, setCopied] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    if (!isAdmin) return null;

    const handleGenerateLink = async () => {
        setIsLoading(true);
        try {
            let response = await createWorkspaceInvite(workspaceId, "member");
            response=response.data

            if (response.success) {
                setInviteUrl(response.data.token);
                setIsOpen(true);
                toast.success("Invite link generated!");
            }
        } catch (error) {
            toast.error(error || "Failed to generate link");
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(inviteUrl);
        setCopied(true);
        toast.success("Copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="px-2 mb-2">
            {!isOpen ? (
                <button
                    onClick={handleGenerateLink}
                    disabled={isLoading}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-text-muted hover:text-text-main hover:bg-surface rounded-lg transition-colors group"
                >
                    <div className="w-8 h-8 rounded bg-surface border border-gray-700 flex items-center justify-center group-hover:border-gray-500 transition-colors">
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        ) : (
                            <UserPlus className="w-4 h-4" />
                        )}
                    </div>
                    <span className="truncate">Invite People</span>
                </button>
            ) : (
                <div className="bg-surface border border-gray-700 rounded-lg p-3 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-text-muted uppercase">Invite Link</span>
                        <button 
                            onClick={() => setIsOpen(false)} 
                            className="text-xs text-red-400 hover:text-red-300 hover:underline"
                        >
                            Close
                        </button>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-background border border-gray-800 rounded p-1.5">
                        <input 
                            type="text" 
                            readOnly 
                            value={inviteUrl} 
                            className="bg-transparent text-xs text-text-main w-full outline-none"
                        />
                        <button
                            onClick={copyToClipboard}
                            className="p-1 hover:bg-surface rounded text-text-muted hover:text-white transition-colors"
                            title="Copy Link"
                        >
                            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                    </div>
                    <p className="text-[10px] text-text-muted mt-1.5 italic">
                        Link expires in 7 days.
                    </p>
                </div>
            )}
        </div>
    );
}