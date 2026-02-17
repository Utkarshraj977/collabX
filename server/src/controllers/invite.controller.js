import crypto from "crypto";
import WorkspaceInvite from "../models/WorkspaceInvite.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import Workspace from "../models/Workspace.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redis from "../config/redis.js";

const createInviteLink = asyncHandler(async(req, res) => {
    const { workspaceId } = req.params;
    const { role } = req.body; 
    const userId = req.user._id;

    const member = await WorkspaceMember.findOne({ workspaceId, userId });
    
    if (!member || (member.role !== "admin" && member.role !== "manager")) {
        return res.status(403).json({ message: "Permission denied" });
    }

    const token = crypto.randomBytes(20).toString('hex');

    const invite = await WorkspaceInvite.create({
        workspaceId,
        inviterId: userId,
        token,
        role: role || 'member',
        expiresAt: Date.now() + 1 * 24 * 60 * 60 * 1000 
    });

    const inviteUrl = `${process.env.FRONTEND_URL}/invite/ws/${token}`;

    return res.status(201).json({
        success: true,
        data: {
            inviteUrl,
            token,
            expiresAt: invite.expiresAt
        }
    });
});

const joinWorkspaceByInvite = asyncHandler(async(req, res) => {
    const { token } = req.params;
    const userId = req.user._id;

    const invite = await WorkspaceInvite.findOne({ token });

    if (!invite) {
        return res.status(404).json({ message: "Invalid or expired invite link" });
    }

    if (invite.expiresAt < Date.now()) {
        return res.status(410).json({ message: "Invite link has expired" });
    }

    const existingMember = await WorkspaceMember.findOne({
        workspaceId: invite.workspaceId,
        userId
    });

    if (existingMember) {
        return res.status(409).json({ message: "You are already a member of this workspace" });
    }
    const newMember = await WorkspaceMember.create({
        workspaceId: invite.workspaceId,
        userId,
        role: invite.role,
        joinedVia: 'invite',
        invitedBy: invite.inviterId
    });
    
    await redis.del(`user:workspaces:${req.user._id}`);
    return res.status(200).json({
        success: true,
        message: "Successfully joined workspace",
        data: newMember
    });
});

export { createInviteLink, joinWorkspaceByInvite };
