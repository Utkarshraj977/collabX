import mongoose, { Schema } from "mongoose";

const gitHubIntegrationSchema = new Schema(
    {
        workspaceId: {
            type: Schema.Types.ObjectId,
            ref: "Workspace",
            required: true
        },
        channelId: {
            type: Schema.Types.ObjectId,
            ref: "Channel",
            required: true
        },
        repoFullName: {
            type: String,
            required: true,
            trim: true
        },
        webhookSecret: {
            type: String,
            required: true
        },
        addedBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: true
        }
    },
    {
        timestamps: true
    }
);

gitHubIntegrationSchema.index({ repoFullName: 1 });

export const GitHubIntegration = mongoose.model("GitHubIntegration", gitHubIntegrationSchema);
