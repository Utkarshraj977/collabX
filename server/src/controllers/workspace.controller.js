// import Workspace from "../models/Workspace.js";
// import WorkspaceMember from "../models/WorkspaceMember.js";
// import { asyncHandler } from "../utils/asyncHandler.js";
// import mongoose from "mongoose";

// const createworkspace=asyncHandler(async(req,res)=>{
//     const {name,slug}=req.body;

//     if (!name) {
//         return res.status(400).json({ message: "Workspace name is required" });
//     }
//     let workspaceslug = slug ? slug.toLowerCase() 
//     : name.toLowerCase().replace(/ /g,'-').replace(/[^\w-]+/g,'') ;

//     const isexitingworklog = await Workspace.findOne({slug:workspaceslug})
//     if (isexitingworklog) {
//         return res.status(409).json({ message: "Workspace URL (slug) is already taken. Please choose another." });
//     }

//     const session = await mongoose.startSession();
//     session.startTransaction();

//     try{
//         const [newWorkspace] = await Workspace.create([{
//             name,
//             slug:workspaceslug,
//             ownerId:req.user._id,
//             settings: {
//                 defaultChannels: ['general']
//             }
//         }],{session});

//         await WorkspaceMember.create([{
//             workspaceId: newWorkspace._id,
//             userId: req.user._id,
//             role: 'admin',
//             joinedVia: 'create',
//             status: 'active'
//         }], { session });

//         await session.commitTransaction();

//         return res.status(201).json({
//             success: true,
//             message: "Workspace created successfully",
//             data: newWorkspace
//         });
//     }catch(error){
//         await session.abortTransaction();
//         console.error("Workspace creation failed:", error);
//         return res.status(500).json({ message: "Internal server error during workspace creation" });
//     }finally{
//         session.endSession();
//     }
// })

// export {createworkspace};

//-------------------------------------------------------------------------------
//**************FOR DEVOLOPMENT *****************//
//-------------------------------------------------------------------------------
import Workspace from "../models/Workspace.js";
import WorkspaceMember from "../models/WorkspaceMember.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import redis from "../config/redis.js";

const createWorkspace = asyncHandler(async (req, res) => {
    const { name, slug } = req.body;

    if (!name) {
        return res.status(400).json({ message: "Workspace name is required" });
    }

    // Slug Logic
    let workspaceSlug = slug
        ? slug.toLowerCase()
        : name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');

    const existingWorkspace = await Workspace.findOne({ slug: workspaceSlug });
    if (existingWorkspace) {
        return res.status(409).json({ message: "Workspace URL (slug) is already taken." });
    }

    // --- REMOVED TRANSACTION START ---

    // Step A: Create Workspace (Use Object, NOT Array)
    const newWorkspace = await Workspace.create({
        name,
        slug: workspaceSlug,
        ownerId: req.user._id,
        settings: {
            defaultChannels: ['general']
        }
    });

    await WorkspaceMember.create({
        workspaceId: newWorkspace._id,
        userId: req.user._id,
        role: 'admin',
        joinedVia: 'create',
        status: 'active'
    });

    // Jab bhi workspace create ya join ho:
    await redis.del(`user:workspaces:${req.user._id}`);
    return res.status(201).json({
        success: true,
        message: "Workspace created successfully",
        data: newWorkspace
    });
});

//Get All Workspace
export const getUserWorkspaces = asyncHandler(async (req, res) => {
    const userId = req.user._id.toString();
    const workspaceKey = `user:workspaces:${userId}`;

    // 1. Check Redis Cache First
    const cachedWorkspaces = await redis.get(workspaceKey);
    if (cachedWorkspaces) {
        console.log("🚀 Serving Workspaces from Redis");
        return res.status(200).json({
            success: true,
            data: JSON.parse(cachedWorkspaces)
        });
    }

    console.log("🐌 Fetching Workspaces from MongoDB");

    // 2. Optimized Database Query (Single Call)
    const memberships = await WorkspaceMember.find({ userId })
        .populate("workspaceId")
        .lean();

    const createdWorkspaces = [];
    const joinedWorkspaces = [];

    // 3. Process data in one loop
    memberships.forEach(m => {
        if (!m.workspaceId) return;

        const workspaceData = {
            ...m.workspaceId,
            myRole: m.joinedVia === "create" ? "admin" : m.role
        };

        if (m.joinedVia === "create") {
            createdWorkspaces.push(workspaceData);
        } else {
            joinedWorkspaces.push(workspaceData);
        }
    });

    const responseData = {
        created: createdWorkspaces,
        joined: joinedWorkspaces
    };

    await redis.setex(workspaceKey, 3600, JSON.stringify(responseData));

    return res.status(200).json({
        success: true,
        data: responseData
    });
});


// Get Workspace By ID
const GetWorkspaceById = asyncHandler(async (req, res) => {
    const { workspaceid } = req.params;
    const workspace = await Workspace.findById(workspaceid).lean();
    if (!workspace) {
        return res.status(404).json({
            success: false,
            message: "Workspace not found"
        });
    }
    return res.status(200).json({
        success: true,
        data: workspace,
        message: "Data fetched successfully"
    });
});

//GetOnlineUsers
const getonlineusers = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;

    const onlineuserid = await redis.smembers(`workspace:${workspaceId}:online`);
    if (onlineuserid.length == 0) {
        return res.status(404).json({ message: "data not found" })
    }

    const pipeline = redis.pipeline();

    onlineuserid.forEach((id) => {
        pipeline.hgetall(`user:session:${id}`);
    });

    const results = await pipeline.exec();

    const onlineUsers = results
        .map(([err, user], index) => {
            if (user && Object.keys(user).length > 0) {
                return { _id: onlineuserid[index], ...user };
            }
            return null;
        })
        .filter(user => user !== null);

    return res.status(200).json({
        success: true,
        data: onlineUsers
    });
})

const getWorkspaceMembers = asyncHandler(async (req, res) => {
    const { workspaceId } = req.params;
    const currentUserId = req.user._id;
    const members = await WorkspaceMember.find({ workspaceId, userId: { $ne: currentUserId } })
        .populate('userId', 'name email avatarUrl');

    if (!members) {
        return res.status(404).json({ message: "No members found" });
    }

    const formattedMembers = members.map(member => ({
        _id: member.userId._id,
        name: member.userId.name,
        email: member.userId.email,
        avatarUrl: member.userId.avatarUrl,
        role: member.role,
        joinedAt: member.createdAt
    }));

    res.status(200).json({
        success: true,
        data: formattedMembers
    });
});

export { createWorkspace, getWorkspaceMembers, getUserWorkspaces, getonlineusers, GetWorkspaceById };
