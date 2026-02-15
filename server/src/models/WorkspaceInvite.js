import mongoose from "mongoose";

const workspaceInviteSchema = new mongoose.Schema({
    workspaceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Workspace',
        required: true
    },
    inviterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    token: {
        type: String,
        required: true,
        unique: true
    },
    role: {
        type: String,
        enum: ['member', 'manager'],
        default: 'member'
    },
    expiresAt: {
        type: Date,
        required: true
    }
}, { timestamps: true });

workspaceInviteSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('WorkspaceInvite', workspaceInviteSchema);
