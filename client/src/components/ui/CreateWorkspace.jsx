import { useState } from "react";
import { useDispatch } from "react-redux"; 
import { createworkspace } from "../../services/api";
import { addWorkspace } from "../../features/workspace/workspaceSlice"; 

export default function CreateWorkspace() {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    
    const dispatch = useDispatch();

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        try {
            const response = await createworkspace({ name });
            const newWorkspace = response.data.data; 

            dispatch(addWorkspace(newWorkspace));
            setIsOpen(false);
            setName("");

        } catch (error) {
            console.error("Error creating workspace:", error);
        }
    };

    return (
        <>
           
           <button
                onClick={() => setIsOpen(true)}
                className="w-full py-5 bg-primary text-black font-bold rounded-xl shadow-[0_0_15px_rgba(0,212,255,0.3)] hover:scale-105 transition-transform flex items-center justify-center gap-2 text-lg"
            >
                <span className="text-xl">+</span> Create Workspace
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 backdrop-blur-sm p-4">
                    <div className="bg-surface border border-gray-700 p-6 rounded-2xl w-full max-w-sm relative shadow-2xl">
                         <button 
                            onClick={() => setIsOpen(false)}
                            className="absolute top-3 right-4 text-gray-400 hover:text-white font-bold"
                        >✕</button>

                        <h2 className="text-lg font-bold text-white mb-4">New Workspace</h2>

                        <form onSubmit={handleCreate} className="flex flex-col gap-4">
                            <input
                                type="text"
                                placeholder="Workspace Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="p-3 rounded bg-background border border-gray-600 text-white focus:border-primary focus:outline-none"
                                autoFocus
                            />
                            <button 
                                type="submit" 
                                className="bg-primary text-black font-bold py-2 rounded hover:bg-cyan-400 transition"
                            >
                                Create
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}
