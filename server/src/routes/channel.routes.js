import { Router } from "express";
import { createChannel,checkChannelMembership,getChannelSuggestions,
    getChannelMembers,getWorkspaceChannels,addChannelMembers,getchannelbyid } from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router({ mergeParams: true }); 
router.use(verifyJWT);
router.route("/:workspaceId/createchannel").post(createChannel);
router.route("/:channelId/getchannelmember").get(getChannelMembers);
router.route("/:workspaceId/getworkspacechannel").get(getWorkspaceChannels);
router.route("/:channelId/addchannelmember").post(addChannelMembers);
router.route("/:channelId/suggestions").get(getChannelSuggestions);
router.route("/:channelId/getchannelbyid").get(getchannelbyid);
router.get("/check-membership/:channelId", checkChannelMembership);

export default router; 

