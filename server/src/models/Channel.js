import mongoose from 'mongoose';

const channelSchema = new mongoose.Schema({
  workspaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  
  name: {
    type: String,
    required: true,
  },

  description: {
    type: String,
  },

  isPrivate: {
    type: Boolean,
    default: false,
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  isArchived: {
    type: Boolean,
    default: false,
  }
}, { timestamps: true });

channelSchema.index({ workspaceId: 1, name: 1 }, { unique: true });

export default mongoose.model('Channel', channelSchema);
