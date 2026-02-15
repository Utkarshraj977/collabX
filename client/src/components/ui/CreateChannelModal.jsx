import { useState } from "react";
import { useDispatch } from "react-redux";
import { addChannel } from "../../features/workspace/workspaceSlice";
import { toast } from "react-hot-toast";

export default function CreateChannelModal({ onClose, workspaceId }) {
    const dispatch = useDispatch();
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return toast.error("Channel name is required");

        setIsLoading(true);
        try {
            await dispatch(addChannel({
                workspaceId,
                channelData: { name, description }
            })).unwrap();

            onClose();
        } catch (error) {
            toast.error("something went wrong")
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
           
            <div 
                className="w-full max-w-md bg-surface border border-gray-700 rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200"
                onClick={(e) => e.stopPropagation()}
            >
               
                <div className="px-6 py-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-text-main">Create Channel</h3>
                    <button onClick={onClose} className="text-text-muted hover:text-text-main transition">
                        ✕
                    </button>
                </div>

             
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-2">
                            Channel Name
                        </label>
                        <div className="relative flex items-center">
                            <span className="absolute left-3 text-text-muted">#</span>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value.toLowerCase().replace(/\s+/g, '-'))}
                                placeholder="e.g. marketing"
                                className="w-full bg-background border border-gray-700 text-text-main text-sm rounded-lg pl-8 pr-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                                autoFocus
                            />
                        </div>
                        <p className="text-[10px] text-text-muted mt-1">
                            Names must be lowercase, without spaces.
                        </p>
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-text-muted uppercase mb-2">
                            Description (Optional)
                        </label>
                        <input
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="What's this channel about?"
                            className="w-full bg-background border border-gray-700 text-text-main text-sm rounded-lg px-4 py-2.5 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition"
                        />
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-main transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="px-6 py-2 text-sm font-bold text-black bg-primary rounded-lg hover:bg-primary/90 transition disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? "Creating..." : "Create Channel"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}