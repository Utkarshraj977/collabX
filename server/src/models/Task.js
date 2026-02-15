import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },

  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },

  title: { 
    type: String,
    required: true,
    trim: true
  },

  description: {
    type: String,
    trim: true
  },

  status: {
    type: String,
    enum: ['todo', 'in-progress', 'done'],
    default: 'todo',
  },

  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium',
  },

  assignedTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  dueDate: {
    type: Date,
  }
}, { timestamps: true });


// This makes fetching tasks for a specific channel very fast 
taskSchema.index({ channelId: 1, status: 1 });
taskSchema.index({ workspaceId: 1 });

export default mongoose.model('Task', taskSchema);