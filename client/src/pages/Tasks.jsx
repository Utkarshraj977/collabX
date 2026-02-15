import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";

import { 
  fetchTasks, 
  fetchChannelMembers, 
  createTask, 
  updateTaskStatus, 
  deleteTask, 
  addNewTask, 
  updateTaskRealtime, 
  removeTaskRealtime, 
  clearTasks 
} from "../features/tasks/taskSlice";

import TaskColumn from "../components/ui/TaskColumn";
import CreateTaskModal from "../components/ui/CreateTaskModel";
import { getSocket } from "../services/socket";

export default function Tasks({ channelId, workspaceId }) {
  const dispatch = useDispatch();
  const socketRef = useRef(null);

  // 🔥 Get channelMembers from store
  const { tasks, channelMembers, loading } = useSelector((state) => state.tasks);
  const { user } = useSelector((state) => state.auth);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {

    const isDifferentChannel = tasks.length > 0 && tasks[0]?.channelId !== channelId;
    const noTasks = tasks.length === 0;

    if (noTasks || isDifferentChannel) {
      
      if (isDifferentChannel) {
          dispatch(clearTasks());
      }

      dispatch(fetchTasks(channelId));
      dispatch(fetchChannelMembers(channelId)); 
    }
  }, [dispatch, channelId]); 

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleJoin = () => {
        if(channelId && socket.connected) socket.emit("join-channel", channelId);
    };

    socket.on("connect", handleJoin);
    if(socket.connected) handleJoin();

    socket.on("new-task", (task) => {
        if(task.channelId === channelId) dispatch(addNewTask(task));
    });

    socket.on("task-updated", (updatedTask) => {
        if(updatedTask.channelId === channelId) dispatch(updateTaskRealtime(updatedTask));
    });

    socket.on("task-deleted", (taskId) => {
        dispatch(removeTaskRealtime(taskId));
    });

    return () => {
        socket.off("connect");
        socket.off("new-task");
        socket.off("task-updated");
        socket.off("task-deleted");
    };
  }, [channelId, user, dispatch]);

  const handleCreateTask = async (formData) => {
    const assignedUsers = formData.assignedTo && formData.assignedTo.length > 0 
        ? formData.assignedTo 
        : [user._id];

    const resultAction = await dispatch(createTask({
      ...formData,
      channelId,
      workspaceId,
      assignedTo: assignedUsers 
    }));

    if (createTask.fulfilled.match(resultAction)) {
      setIsModalOpen(false);
    } else {
      alert("Failed to create task: " + resultAction.payload);
    }
  };

  const handleStatusChange = (taskId, newStatus) => {
    dispatch(updateTaskStatus({ taskId, status: newStatus }));
  };

  const handleDelete = (taskId) => {
    if(window.confirm("Delete this task?")) {
      dispatch(deleteTask(taskId));
    }
  };

  const todoTasks = tasks.filter(t => t.status === 'todo');
  const progressTasks = tasks.filter(t => t.status === 'in-progress');
  const doneTasks = tasks.filter(t => t.status === 'done');
  if (loading && tasks.length === 0) {
    return <div className="text-gray-500 p-10 text-center">Loading Board...</div>;
  }

  return (
    <div className="flex flex-col h-full bg-[#121016] p-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-white">Board</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md flex items-center gap-2 text-sm transition font-medium"
        >
          <Plus size={16} /> New Task
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4 overflow-hidden">
        
        <TaskColumn 
            title="To Do" 
            tasks={todoTasks} 
            color="gray"
            onStatusChange={handleStatusChange} 
            onDelete={handleDelete} 
        />

        <TaskColumn 
            title="In Progress" 
            tasks={progressTasks} 
            color="blue"
            onStatusChange={handleStatusChange} 
            onDelete={handleDelete} 
        />

        <TaskColumn 
            title="Done" 
            tasks={doneTasks} 
            color="green"
            onStatusChange={handleStatusChange} 
            onDelete={handleDelete} 
        />
      </div>

      <CreateTaskModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onCreate={handleCreateTask} 
        members={channelMembers} 
      />
    </div>
  );
}

