import mongoose from "mongoose";

const gitHubEventSchema = new mongoose.Schema(
    {
        integrationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "GitHubIntegration",
            required: true
        },
        eventType: {
            type: String,
            required: true
        },
        actor: {
            type: String
        },
        payload: {
            type: mongoose.Schema.Types.Mixed
        },
        githubDeliveryId: {
            type: String,
            required: true,
            unique: true
        }
    },
    { 
        timestamps: true 
    }
);

export default mongoose.model("GitHubEvent", gitHubEventSchema);