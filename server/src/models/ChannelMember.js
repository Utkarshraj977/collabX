import mongoose from 'mongoose';

const channelMemberSchema = new mongoose.Schema({
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true,
  },
   
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  addedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'member'],
    required: true,
  },
}, { timestamps: true });

channelMemberSchema.index({ channelId: 1, userId: 1 }, { unique: true });

export default mongoose.model('ChannelMember', channelMemberSchema);
