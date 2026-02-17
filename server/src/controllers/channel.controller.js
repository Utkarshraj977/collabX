import Channel from "../models/Channel.js";
import ChannelMember from "../models/ChannelMember.js";
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redis from "../config/redis.js";

//channel creation
const createChannel = asyncHandler(async(req, res) => {
    const { name, description } = req.body;
    const { workspaceId } = req.params; 
    const userId = req.user._id;

    if(!name || !description) {
        return res.status(400).json({ message: "Channel name and description are required" });
    }

    const channelName = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const workspace = await Workspace.findById(workspaceId);
    if(!workspace) {
        return res.status(404).json({ message: "Workspace not found" });
    }

    const member = await WorkspaceMember.findOne({
        workspaceId: workspace._id,
        userId: userId
    });

    if (!member || (member.role !== "admin" && member.role !== "manager")) {
        return res.status(403).json({ message: "Only Admins or Managers can create channels" });
    }

    // Check duplicate channel name in THIS workspace
    const existingChannel = await Channel.findOne({
        workspaceId: workspace._id,
        name: channelName
    });

    if(existingChannel) {
        return res.status(409).json({ message: "A channel with this name already exists in this workspace" });
    }

    // Create Channel
    const newChannel = await Channel.create({
        workspaceId: workspace._id,
        name: channelName,
        description,
        createdBy: userId
    });

    await ChannelMember.create({
        channelId: newChannel._id, 
        userId: userId,
        addedBy: userId,
        role:'admin'
    });

    return res.status(201).json({
        success: true,
        message: "Channel created successfully",
        data: newChannel
    });
});
 
//List All Channels of a workspace
const getWorkspaceChannels = asyncHandler(async(req, res) => {
    const { workspaceId } = req.params;
    const userId = req.user._id.toString();
    const cacheKey = `channels:${workspaceId}:${userId}`;

    try {
        // 1. Check Redis Cache First
        const cachedChannels = await redis.get(cacheKey);
        if (cachedChannels) {
            return res.status(200).json({
                success: true,
                data: JSON.parse(cachedChannels)
            });
        }

        const isWorkspaceMember = await WorkspaceMember.findOne({ workspaceId, userId });

        if (!isWorkspaceMember) {
            return res.status(403).json({ message: "You are not a member of this workspace" });
        }

        const userChannelMemberships = await ChannelMember.find({ 
            workspaceId, 
            userId 
        }).lean();
        
        const myChannelIds = userChannelMemberships.map(m => m.channelId);

        const channels = await Channel.find({
            workspaceId: workspaceId,
            isArchived: false, 
            $or: [
                { isPrivate: false },
                { _id: { $in: myChannelIds } }
            ]
        }).lean();
        await redis.setex(cacheKey, 1800, JSON.stringify(channels));

        return res.status(200).json({
            success: true,
            data: channels
        });

    } catch (error) {
        console.error("Redis Error in getWorkspaceChannels:", error);
        const isWorkspaceMember = await WorkspaceMember.findOne({ workspaceId, userId });
        if (!isWorkspaceMember) return res.status(403).json({ message: "You are not a member..." });
        
        const userChannelMemberships = await ChannelMember.find({ workspaceId, userId }).lean();
        const myChannelIds = userChannelMemberships.map(m => m.channelId);
        const channels = await Channel.find({
            workspaceId,
            isArchived: false, 
            $or: [{ isPrivate: false }, { _id: { $in: myChannelIds } }]
        }).lean();

        return res.status(200).json({ success: true, data: channels });
    }
});

//List of All Members of Channel
const getChannelMembers = asyncHandler(async(req, res) => {
    const { channelId } = req.params;

    const isMember = await ChannelMember.findOne({
        channelId,
        userId: req.user._id
    });

    if (!isMember) {
        return res.status(403).json({ message: "You are not a member of this channel" });
    }

    const members = await ChannelMember.find({ channelId }).populate("userId", "name email avatarUrl");

    return res.status(200).json({
        success: true,
        data: members
    });
})  

const addChannelMembers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const { memberIds } = req.body; 
    const requesterId = req.user._id;

    if (!Array.isArray(memberIds) || memberIds.length === 0) {
        return res.status(400).json({ message: "Please provide an array of memberIds" });
    }

    const channel = await Channel.findById(channelId);
    if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
    }

    const [workspaceMembership, channelMembership] = await Promise.all([
        WorkspaceMember.findOne({ workspaceId: channel.workspaceId, userId: requesterId }),
        ChannelMember.findOne({ channelId, userId: requesterId })
    ]);

    const isWorkspaceAdmin = workspaceMembership &&
        (workspaceMembership.role === "admin" || workspaceMembership.role === "manager");

    const isChannelAdmin = channelMembership && (channelMembership.role === "admin" || channelMembership.role === "manager");

    if (!isWorkspaceAdmin && !isChannelAdmin) {
        return res.status(403).json({
            message: "Permission denied. You must be a Workspace Manager or Channel Admin."
        });
    }
  
    const validWorkspaceMembers = await WorkspaceMember.find({
        workspaceId: channel.workspaceId,
        userId: { $in: memberIds }
    }).select('userId');

    const validUserIds = validWorkspaceMembers.map(m => m.userId.toString());

    if (validUserIds.length === 0) {
        return res.status(400).json({ message: "None of the provided users belong to this workspace" });
    }

    const existingChannelMembers = await ChannelMember.find({
        channelId,
        userId: { $in: validUserIds }
    }).select('userId');

    const existingUserIds = existingChannelMembers.map(m => m.userId.toString());

    const usersToAdd = validUserIds.filter(userId => !existingUserIds.includes(userId));

    if (usersToAdd.length === 0) {
        return res.status(409).json({ message: "selected users are already in this channel" });
    }

    const newMembersData = usersToAdd.map(userId => ({
        channelId,
        workspaceId: channel.workspaceId,
        userId,
        role: 'member',
        addedBy: requesterId
    }));

    await ChannelMember.insertMany(newMembersData);

    return res.status(200).json({
        success: true,
        message: `${usersToAdd.length} members added successfully`,
        addedCount: usersToAdd.length,
        alreadyMemberCount: existingUserIds.length,
        data: usersToAdd 
    });
});

//AllMembers of a workspace
const getChannelSuggestions = asyncHandler(async(req, res) => {
    const { channelId } = req.params;

    const channel = await Channel.findById(channelId);
    if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
    }

    const workspaceMembers = await WorkspaceMember.find({ 
        workspaceId: channel.workspaceId 
    }).populate("userId", "name email avatarUrl");

    const currentChannelMembers = await ChannelMember.find({ channelId });
    
    const existingMemberIds = new Set(
        currentChannelMembers.map(m => m.userId.toString())
    );

    const suggestions = workspaceMembers.filter(wm => 
        !existingMemberIds.has(wm.userId._id.toString())
    ).map(wm => wm.userId);

    return res.status(200).json({
        success: true,
        data: suggestions
    });
});

//Get Channel By ID
const getchannelbyid = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!channelId) {
        return res.status(400).json({ message: "Channel ID is required" });
    }
    const currentchannel = await Channel.findById(channelId);
    if (!currentchannel) {
        return res.status(404).json({ message: "Channel Not Found" });
    }

    return res.status(200).json({
        success: true,
        message: "Channel found successfully",
        data: currentchannel
    });
});
 
const checkChannelMembership = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    const userId = req.user._id;

    const membership = await ChannelMember.findOne({
        channelId,
        userId
    });

    return res.status(200).json({
        success: true,
        isMember: !!membership 
    });
});

export { createChannel,checkChannelMembership,getChannelSuggestions,getchannelbyid, getWorkspaceChannels, getChannelMembers,addChannelMembers };


