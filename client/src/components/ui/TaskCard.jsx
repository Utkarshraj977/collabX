import { MoreVertical, User as UserIcon } from "lucide-react";

export default function TaskCard({ task, onStatusChange, onDelete }) {
  const priorityColor = {
    high: "border-red-500 bg-red-500/10",
    medium: "border-yellow-500 bg-yellow-500/10",
    low: "border-green-500 bg-green-500/10",
  };
  return (
    <div className={`bg-[#1e1f24] p-3 rounded-lg mb-3 border-l-4 ${priorityColor[task.priority] || "border-gray-500"} shadow-sm group hover:bg-[#25262c] transition-all`}>
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-gray-200 text-sm">{task.title}</h4>

        <button
          onClick={() => onDelete(task._id)}
          className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreVertical size={14} />
        </button>
      </div>

      <p className="text-xs text-gray-400 mb-3 line-clamp-2">
        {task.description || "No description"}
      </p>

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1">
          {task.assignedTo && task.assignedTo.length > 0 ? (
            task.assignedTo.map((u) => (
              <div key={u._id} className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center overflow-hidden border border-gray-600" title={u.name}>
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt={u.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-gray-300">{u.name?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            ))
          ) : (
            <div className="w-6 h-6 rounded-full bg-gray-800 flex items-center justify-center">
              <UserIcon size={12} className="text-gray-500" />
            </div>
          )}
        </div>

        <select
          value={task.status}
          onChange={(e) => onStatusChange(task._id, e.target.value)}
          className="bg-[#15171c] text-xs text-gray-300 border border-gray-700 rounded px-2 py-1 outline-none focus:border-blue-500 cursor-pointer"
        >
          <option value="todo">To Do</option>
          <option value="in-progress">In Prog</option>
          <option value="done">Done</option>
        </select>
      </div>
    </div>
  );
}
