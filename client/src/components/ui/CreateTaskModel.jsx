import { useState } from "react";
import { X } from "lucide-react";

export default function CreateTaskModal({ isOpen, onClose, onCreate, members = [] }) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    assignedTo: []
  });

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await onCreate(formData);
    setFormData({ title: "", description: "", priority: "medium", dueDate: "", assignedTo: [] });
    onClose();
  };

  const toggleMember = (userId) => {
    setFormData(prev => {
      const isSelected = prev.assignedTo.includes(userId);
      if (isSelected) {
        return { ...prev, assignedTo: prev.assignedTo.filter(id => id !== userId) };
      } else {
        return { ...prev, assignedTo: [...prev.assignedTo, userId] };
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
        <div className="bg-[#1e1f24] p-6 rounded-lg w-96 border border-gray-700 shadow-xl max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-white">Create New Task</h3>
                <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input 
                        className="w-full bg-[#15171c] border border-gray-700 rounded p-2 text-white outline-none focus:border-blue-500" 
                        placeholder="Task Title"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        required
                        autoFocus
                    />
                </div>
                
                <div>
                    <textarea 
                        className="w-full bg-[#15171c] border border-gray-700 rounded p-2 text-white outline-none focus:border-blue-500 resize-none" 
                        placeholder="Description"
                        rows="3"
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                    />
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Priority</label>
                        <select 
                            className="w-full bg-[#15171c] border border-gray-700 rounded p-2 text-white outline-none focus:border-blue-500 text-sm"
                            value={formData.priority}
                            onChange={e => setFormData({...formData, priority: e.target.value})}
                        >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-400 mb-1 block">Due Date</label>
                        <input 
                            type="date"
                            className="w-full bg-[#15171c] border border-gray-700 rounded p-2 text-white outline-none focus:border-blue-500 text-sm"
                            value={formData.dueDate}
                            onChange={e => setFormData({...formData, dueDate: e.target.value})}
                        />
                    </div>
                </div>

                <div>
                    <label className="text-xs text-gray-400 mb-2 block">Assign To</label>
                    <div className="bg-[#15171c] border border-gray-700 rounded p-2 max-h-32 overflow-y-auto custom-scrollbar">
                        {members.length > 0 ? (
                            members.map((member) => {
                                const userId = member.userId?._id || member._id;
                                const userName = member.userId?.name || member.name || "Unknown";
                                const isSelected = formData.assignedTo.includes(userId);

                                return (
                                    <div 
                                        key={userId} 
                                        onClick={() => toggleMember(userId)}
                                        className={`flex items-center gap-2 p-2 rounded cursor-pointer mb-1 transition-colors ${isSelected ? 'bg-blue-600/20 border border-blue-600' : 'hover:bg-gray-800 border border-transparent'}`}
                                    >
                                        <div className="w-6 h-6 rounded-full bg-gray-600 overflow-hidden flex items-center justify-center shrink-0">
                                            <span className="text-[10px] text-white">
                                                {userName.charAt(0).toUpperCase()}
                                            </span>
                                        </div>
                                        <span className={`text-sm ${isSelected ? 'text-blue-200' : 'text-gray-300'}`}>
                                            {userName}
                                        </span>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-xs text-gray-500 text-center py-2">No members found</div>
                        )}
                    </div>
                </div>
                
                <div className="flex justify-end gap-2 mt-6">
                    <button type="button" onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white transition-colors">Cancel</button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 rounded text-white hover:bg-blue-700 transition-colors font-medium">Create</button>
                </div>
            </form>
        </div>
    </div>
  );
}