import crypto from "crypto";
import { GitHubIntegration } from "../models/GitHubIntegration.js";
import GitHubEvent from "../models/GitHubEvent.js";
import Message from "../models/Message.js";
import ChannelMember from "../models/ChannelMember.js";
import { getIO } from "../socket.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redis from "../config/redis.js";

const addRepository = asyncHandler(async (req, res) => {
    const { channelId, repoFullName, workspaceId } = req.body;

    if (!channelId || !repoFullName || !workspaceId) {
        return res.status(400).json({ message: "Missing required fields" });
    }

    const member = await ChannelMember.findOne({
        channelId,
        userId: req.user._id
    });

    if (!member || (member.role !== "admin" && member.role !== "manager")) {
        return res.status(403).json({ message: "Access Denied" });
    }

    const existing = await GitHubIntegration.findOne({ channelId, repoFullName });
    if (existing) {
        return res.status(400).json({ message: "Repository already connected" });
    }

    const webhookSecret = crypto.randomBytes(20).toString("hex");

    const integration = await GitHubIntegration.create({
        workspaceId,
        channelId,
        repoFullName,
        webhookSecret,
        addedBy: req.user._id
    });

    return res.status(201).json({
        success: true,
        data: {
            webhookUrl: `${process.env.API_BASE_URL}/api/v1/github/webhook`,
            webhookSecret,
            integration
        },
        message: "Integration created"
    });
});
 
const handleWebhook = asyncHandler(async (req, res) => {
    const signature = req.headers["x-hub-signature-256"];
    const eventType = req.headers["x-github-event"];
    const deliveryId = req.headers["x-github-delivery"];
    const rawBody = req.rawBody;
    const payload = req.body;

    if (!signature || !deliveryId || !rawBody) {
        return res.status(400).json({ message: "Missing headers or raw body" });
    }

    const isReplay = await redis.get(`github:delivery:${deliveryId}`);
    if (isReplay) {
        return res.status(200).json({ message: "Event already processed" });
    }

    const repoFullName = payload.repository?.full_name;
    const integrations = await GitHubIntegration.find({ repoFullName });

    if (!integrations.length) {
        return res.status(404).json({ message: "No integrations found" });
    }

    const secret = integrations[0].webhookSecret;
    const hmac = crypto.createHmac("sha256", secret);
    const digest = "sha256=" + hmac.update(rawBody).digest("hex");

    if (signature !== digest) {
        return res.status(401).json({ message: "Invalid signature" });
    }

    await redis.set(`github:delivery:${deliveryId}`, "processed", "EX", 86400);

    const ALLOWED_EVENTS = ["push", "pull_request", "issues"];
    if (!ALLOWED_EVENTS.includes(eventType)) {
        return res.status(200).json({ message: "Event ignored" });
    }

    let messageContent = "";
    
    if (eventType === "push") {
        const pusherName = payload.pusher?.name || payload.sender.login;
        const branch = payload.ref.split("/").pop();
        const commitMsg = payload.commits?.[0]?.message || "No commit message";
        const commitUrl = payload.commits?.[0]?.url || payload.repository.html_url;
        messageContent = `🔨 **Git Push** by ${pusherName}\nBranch: \`${branch}\`\nMessage: "${commitMsg}"\n[View Commit](${commitUrl})`;
    } 
    else if (eventType === "pull_request") {
        const action = payload.action;
        const prTitle = payload.pull_request.title;
        const prUser = payload.pull_request.user.login;
        const prUrl = payload.pull_request.html_url;

        if (action === "opened") {
            messageContent = `🔌 **Pull Request Opened** by ${prUser}\nTitle: ${prTitle}\n[View PR](${prUrl})`;
        } else if (action === "closed" && payload.pull_request.merged) {
            messageContent = `✅ **Pull Request Merged** by ${prUser}\nTitle: ${prTitle}`;
        } else {
            return res.status(200).json({ message: "PR Action ignored" });
        }
    }
    else if (eventType === "issues" && payload.action === "opened") {
        messageContent = `🐛 **New Issue Opened** by ${payload.issue.user.login}\nTitle: ${payload.issue.title}\n[View Issue](${payload.issue.html_url})`;
    }

    const eventPromises = integrations.map(async (integration) => {
        const event = await GitHubEvent.create({
            integrationId: integration._id,
            eventType,
            actor: payload.sender?.login || "unknown",
            payload: payload,
            githubDeliveryId: deliveryId
        });

        const message = await Message.create({
            channelId: integration.channelId,
            workspaceId: integration.workspaceId,
            type: "github",
            content: messageContent,
            metadata: { githubEventId: event._id }
        });

        const socketPayload = {
            ...message.toObject(),
            metadata: { ...message.metadata, event: event }
        };
        
        getIO().to(integration.channelId.toString()).emit("new-message", socketPayload);
    });

    await Promise.all(eventPromises);

    return res.status(200).json({ success: true, processed: integrations.length });
});


const getConnectedRepos = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!channelId) {
        return res.status(400).json({ message: "Channel ID is required" });
    }

    const integrations = await GitHubIntegration.find({ channelId });

    return res.status(200).json({
        success: true,
        data: integrations, 
        message: "Connected repositories fetched"
    });
});



export { addRepository, handleWebhook, getConnectedRepos };

