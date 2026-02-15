import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getAllchannelInWS, getworkspace, getworkspacebyid, createChannel, getChannelById } from "../../services/api";
import { toast } from "react-hot-toast";

export const fetchWorkSpaceByid = createAsyncThunk(
  "workspace/fetchWorkSpaceByid",
  async (workspaceid, { rejectWithValue }) => {
    try {

      const response = await getworkspacebyid(workspaceid);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error");
    }
  }
);

export const fetchMyWorkspace = createAsyncThunk(
  "workspace/fetchMyWorkspace",
  async (_, { rejectWithValue }) => {
    try {
      const res = await getworkspace();
      return res.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Error");
    }
  }
)

export const fetchChannelInWS = createAsyncThunk(
  "workspace/fetchChannelInWS",
  async (workspaceId, { rejectWithValue }) => {
    try {
      const res = await getAllchannelInWS(workspaceId);
      return res.data.data || [];
    } catch (error) {
      rejectWithValue(error.response?.data?.message || "Error");
    }
  }
)

export const addChannel = createAsyncThunk(
  "workspace/addChannel",
  async ({ workspaceId, channelData }, { rejectWithValue }) => {
    try {
      const response = await createChannel(workspaceId, channelData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create channel");
    }
  }
);

export const fetchChannelById = createAsyncThunk(
  "workspace/fetchChannelById",
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await getChannelById(channelId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch channel");
    }
  }
);

const initialState = {
  myWorkspaces: [],
  joinedWorkspaces: [],
  channels: [],
  accessibleChannels: [],
  loading: false,
  currentWorkspace: null,
  currentChannel: null,
  error: null,
};

const workspaceSlice = createSlice({
  name: "workspace",
  initialState,
  reducers: {
    setWorkspaces: (state, action) => {
      state.myWorkspaces = action.payload.created || [];
      state.joinedWorkspaces = action.payload.joined || [];
      state.loading = false;
    },
    addWorkspace: (state, action) => {
      state.myWorkspaces.push(action.payload);
    },
    setCurrentWorkspace: (state, action) => {
      state.currentWorkspace = action.payload;
      state.loading = false;
    },
    setLoading: (state) => {
      state.loading = true;
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.loading = false;
    },
    clearWorkspaces: (state) => {
      state.myWorkspaces = [];
      state.joinedWorkspaces = [];
      state.currentWorkspace = null;
      state.error = null;
    },
    resetAccessibleChannels: (state) => {
      state.accessibleChannels = [];
    },
    addAccessibleChannel: (state, action) => {
      if (!state.accessibleChannels.includes(action.payload)) {
        state.accessibleChannels.push(action.payload);
      }
    },

  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWorkSpaceByid.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkSpaceByid.fulfilled, (state, action) => {
        state.loading = false;
        state.currentWorkspace = action.payload;
      })
      .addCase(fetchWorkSpaceByid.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      .addCase(fetchMyWorkspace.pending, (state) => {
        state.loading = true;
        state.error = null
      })
      .addCase(fetchMyWorkspace.fulfilled, (state, action) => {
        state.loading = false;
        state.myWorkspaces = action.payload.created;
        state.joinedWorkspaces = action.payload.joined;
      })
      .addCase(fetchMyWorkspace.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload
      })
      .addCase(fetchChannelInWS.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannelInWS.fulfilled, (state, action) => {
        state.loading = false;
        state.channels = action.payload;
      })
      .addCase(fetchChannelInWS.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload
      })
      .addCase(addChannel.pending, (state) => {
        state.loading = true;
      })
      .addCase(addChannel.fulfilled, (state, action) => {
        state.loading = false;
        state.channels.push(action.payload);
        toast.success("Channel created successfully!");
      })
      .addCase(addChannel.rejected, (state, action) => {
        state.loading = false;
        toast.error(action.payload);
      })
      .addCase(fetchChannelById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChannelById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentChannel = action.payload;
      })
      .addCase(fetchChannelById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  setWorkspaces,
  addWorkspace,
  setCurrentWorkspace,
  setLoading,
  setError,
  clearWorkspaces,
  resetAccessibleChannels,
  addAccessibleChannel
  
} = workspaceSlice.actions;

export default workspaceSlice.reducer;

