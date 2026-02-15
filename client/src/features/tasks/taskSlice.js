import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { createTaskApi, getTaskApi, deleteTaskApi, updateTaskApi, getAllChannelMemberApi } from "../../services/api";

export const fetchTasks = createAsyncThunk(
  "tasks/fetchTasks",
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await getTaskApi(channelId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch tasks");
    }
  }
);

export const fetchChannelMembers = createAsyncThunk(
  "tasks/fetchChannelMembers",
  async (channelId, { rejectWithValue }) => {
    try {
      const response = await getAllChannelMemberApi(channelId);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to fetch members");
    }
  }
);

export const createTask = createAsyncThunk(
  "tasks/createTask",
  async (taskData, { rejectWithValue }) => {
    try {
      const response = await createTaskApi(taskData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to create task");
    }
  }
);

export const updateTaskStatus = createAsyncThunk(
  "tasks/updateStatus",
  async ({ taskId, status }, { rejectWithValue }) => {
    try {
      const response = await updateTaskApi(taskId, status);

      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to update status");
    }
  }
);

export const deleteTask = createAsyncThunk(
  "tasks/deleteTask",
  async (taskId, { rejectWithValue }) => {
    try {
      await deleteTaskApi(taskId);
      return taskId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || "Failed to delete task");
    }
  }
);



const taskSlice = createSlice({
  name: "tasks",
  initialState: {
    tasks: [],
    channelMembers: [],
    loading: false,
    error: null,
  },

  reducers: {
    addNewTask: (state, action) => {
      const exists = state.tasks.find((t) => t._id === action.payload._id);
      if (!exists) {
        state.tasks.unshift(action.payload); // Add to top
      }
    },

    // 2. Update Task (via Socket)
    updateTaskRealtime: (state, action) => {
      const index = state.tasks.findIndex((t) => t._id === action.payload._id);
      if (index !== -1) {
        state.tasks[index] = action.payload; // Replace old task with new data
      }
    },

    // 3. Delete Task (via Socket)
    removeTaskRealtime: (state, action) => {
      state.tasks = state.tasks.filter((t) => t._id !== action.payload);
    },

    // 4. Cleanup (Switching Channels)
    clearTasks: (state) => {
      state.tasks = [];
      state.loading = false;
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // --- Fetch Tasks ---
      .addCase(fetchTasks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload;
      })
      .addCase(fetchTasks.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // --- Create Task ---
      .addCase(createTask.fulfilled, (state, action) => {
        if (!exists) {
          state.tasks.unshift(action.payload);
        }
      })
      .addCase(fetchChannelMembers.fulfilled, (state, action) => {
        state.channelMembers = action.payload;
      })
      // --- Update Status ---
      .addCase(updateTaskStatus.fulfilled, (state, action) => {
        const index = state.tasks.findIndex((t) => t._id === action.payload._id);
        if (index !== -1) {
          state.tasks[index] = action.payload;
        }
      })

      // --- Delete Task ---
      .addCase(deleteTask.fulfilled, (state, action) => {
        state.tasks = state.tasks.filter((t) => t._id !== action.payload);
      });
  },
});

export const { addNewTask, updateTaskRealtime, removeTaskRealtime, clearTasks } = taskSlice.actions;
export default taskSlice.reducer;
