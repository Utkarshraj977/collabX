import mongoose from 'mongoose';

const aiSummarySchema = new mongoose.Schema({
  workspaceId:{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Workspace',
    required: true,
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
  requestedBy: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // Required false hai, to ye sahi hai (Auto summary me null jayega)
  },
  generatedFor: {
    type: String,
    // 🔥 FIX: Yahan 'auto_summary' add karo
    enum: ['messages', 'github', 'tasks', 'auto_summary'], 
    required: true
  },
  content: { 
    type: String,
    required: true,
  }
}, { timestamps: true });

export default mongoose.model('AISummary', aiSummarySchema);