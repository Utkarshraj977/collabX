import TaskCard from "./TaskCard";

export default function TaskColumn({ title, tasks, color, onStatusChange, onDelete }) {
  const borderColor = {
    gray: "border-gray-500",
    blue: "border-blue-500",
    green: "border-green-500"
  }[color] || "border-gray-500";
   

  return (
    <div className={`flex flex-col h-full bg-[#15171c]/50 rounded-lg border-t-4 ${borderColor}`}>
        <div className="p-3 flex justify-between items-center border-b border-gray-800">
            <h3 className="font-semibold text-gray-300 text-sm">{title}</h3>
            <span className="text-xs bg-gray-800 text-gray-400 px-2 py-1 rounded-full">
                {tasks?.length || 0}
            </span>
        </div>

        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
            {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                    <TaskCard 
                        key={task._id} 
                        task={task} 
                        onStatusChange={onStatusChange} 
                        onDelete={onDelete} 
                    />
                ))
            ) : (
                <div className="text-center text-gray-600 text-xs mt-10">
                    No tasks
                </div>
            )}
        </div>
    </div>
  );
}