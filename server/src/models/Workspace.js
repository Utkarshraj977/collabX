import mongoose from 'mongoose';

const workspaceSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true, // google, microsoft
  },

  slug: {   //unique name of workspace
    type: String,
    required: true,
    unique: true,   
  },

  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  planType: {
    type: String,
    enum: ['free', 'pro'],
    default: 'free',
  },

  settings: {
    allowPublicChannels: {
      type: Boolean,
      default: true, 
    },
    defaultChannels: {
      type: [String], // ["general", "announcements"]
      default: ['general'],
    }
  }
}, { timestamps: true });

export default mongoose.model('Workspace', workspaceSchema);
