// src/features/github/githubSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { connectGitHubRepoApi, getConnectedReposApi } from "../../services/api"; // Ensure these exist in api.js

export const fetchConnectedRepos = createAsyncThunk(
  "github/fetchRepos",
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await getConnectedReposApi(channelId);
      return response.data; // Expecting { data: [integration1, integration2] }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch repos");
    }
  }
);

export const connectRepo = createAsyncThunk(
  "github/connectRepo",
  async ({ channelId, workspaceId, repoFullName }, { rejectWithValue }) => {
    try {
      const response = await connectGitHubRepoApi({ channelId, workspaceId, repoFullName });
      return response.data; 
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to connect repository");
    }
  }
);

const githubSlice = createSlice({
  name: "github",
  initialState: {
    connectedRepos: [],
    webhookDetails: null, // Stores the secret/url for the modal
    loading: false,
    error: null,
  },
  reducers: {
    clearWebhookDetails: (state) => {
      state.webhookDetails = null;
    },
    // Allows us to open the modal with existing details
    setWebhookDetails: (state, action) => {
        state.webhookDetails = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch Repos
      .addCase(fetchConnectedRepos.fulfilled, (state, action) => {
        state.connectedRepos = action.payload.data;
      })
      // Connect Repo
      .addCase(connectRepo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(connectRepo.fulfilled, (state, action) => {
        state.loading = false;
        state.connectedRepos.push(action.payload.data.integration);
        state.webhookDetails = {
            url: action.payload.data.webhookUrl,
            secret: action.payload.data.webhookSecret
        };
      })
      .addCase(connectRepo.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearWebhookDetails, setWebhookDetails } = githubSlice.actions;
export default githubSlice.reducer;