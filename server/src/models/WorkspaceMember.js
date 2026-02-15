import mongoose from 'mongoose';

const workspaceMemberSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },

  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
 
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    required: true,
  },

  joinedVia: {
    type: String,
    enum: ['invite', 'create'],
  },

  invitedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  status: {
    type: String,
    enum: ['active', 'removed'],
    default: 'active',
  }
}, { timestamps: true });

workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

export default mongoose.model('WorkspaceMember', workspaceMemberSchema);
