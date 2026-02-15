import Task from "../models/Task.js";
import ChannelMember from "../models/ChannelMember.js"; 
import { getIO } from "../socket.js"; 
import { asyncHandler } from "../utils/asyncHandler.js";

const createTask = asyncHandler(async (req, res) => {
    const { title, description, priority, dueDate, assignedTo, channelId, workspaceId } = req.body;

    if (!title || !channelId || !workspaceId) {
        return res.status(400).json({ message: "Title, Channel ID, and Workspace ID are required" });
    }

    const member = await ChannelMember.findOne({
        channelId,
        userId: req.user._id
    });

    if (!member) {
        return res.status(403).json({ message: "You are not a member of this channel" });
    }

    if (member.role !== "admin" && member.role !== "manager") {
        return res.status(403).json({ message: "Access Denied: Only Channel Admins or Managers can create tasks" });
    }

    const task = await Task.create({
        title,
        description,
        priority,
        dueDate,
        status:"todo",
        assignedTo,
        channelId,
        workspaceId,
        createdBy: req.user._id
    });
    const populatedTask = await Task.findById(task._id)
        .populate("assignedTo", "name avatar email")
        .populate("createdBy", "name avatar");

    const io = getIO();
    io.to(channelId).emit("new-task", populatedTask);

    return res.status(201).json({
        success: true,
        data: populatedTask,
        message: "Task created successfully"
    });
});

const getChannelTasks = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    const tasks = await Task.find({ channelId })
        .populate("assignedTo", "name avatarUrl")
        .populate("createdBy", "name avatarUrl")
        .sort({ createdAt: -1 });
   
    return res.status(200).json({
        success: true,
        data: tasks,
        message: "Tasks fetched successfully"
    });
});

const updateTaskStatus = asyncHandler(async (req, res) => {
    const { taskId } = req.params;
    const { status } = req.body;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const member = await ChannelMember.findOne({
        channelId: task.channelId,
        userId: req.user._id
    });

    if (!member || (member.role !== "admin" && member.role !== "manager")) {
        const isAssignee = task.assignedTo.map(id => id.toString()).includes(req.user._id.toString());
        if (!isAssignee) {
             return res.status(403).json({ message: "Access Denied" });
        }
    }

    task.status = status;
    await task.save();
    
    const updatedTask = await Task.findById(taskId)
        .populate("assignedTo", "name avatar")
        .populate("createdBy", "name avatar");
    
    const io = getIO();
    io.to(task.channelId.toString()).emit("task-updated", updatedTask);

    return res.status(200).json({
        success: true,
        data: updatedTask,
        message: "Task status updated"
    });
});

const deleteTask = asyncHandler(async (req, res) => {
    const { taskId } = req.params;

    const task = await Task.findById(taskId);
    if (!task) return res.status(404).json({ message: "Task not found" });

    const member = await ChannelMember.findOne({
        channelId: task.channelId,
        userId: req.user._id
    });

    if (!member || (member.role !== "admin" && member.role !== "manager")) {
        return res.status(403).json({ message: "Access Denied: Only Channel Admins can delete tasks" });
    }

    await Task.findByIdAndDelete(taskId);

    const io = getIO();
    io.to(task.channelId.toString()).emit("task-deleted", taskId);

    return res.status(200).json({
        success: true,
        message: "Task deleted successfully"
    });
}); 

export { createTask, getChannelTasks, updateTaskStatus, deleteTask };
