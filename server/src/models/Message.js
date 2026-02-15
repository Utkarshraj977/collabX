import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  }, 

  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }, 
  isDeleted:{
    type:Boolean
  },

  type: {
    type: String,
    enum: ['text', 'file', 'github', 'ai'],
    default: 'text',
  },
 
  content: { 
    type: String,
  },

  metadata: {
    fileUrl: String,
    githubEventId: mongoose.Schema.Types.ObjectId,
  }
}, { timestamps: true });

export default mongoose.model('Message', messageSchema);
