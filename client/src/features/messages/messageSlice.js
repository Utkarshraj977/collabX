import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { sendMessageApi, getMessages } from "../../services/api";

export const fetchMessages = createAsyncThunk(
    "message/fetchMessages",
    async ({ channelId, page }, { rejectWithValue }) => {
        try {
            const response = await getMessages(channelId, page);
            return { 
                messages: response.data.data, 
                page: page || 1 
            };
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to fetch messages");
        }
    }
);

export const sendMessages = createAsyncThunk(
    "message/sendMessages",
    async ({ content, channelId, file }, { rejectWithValue }) => {
        try {
            let requestData;

            if (file) {
                const formData = new FormData();
                formData.append("content", content || ""); 
                formData.append("channelId", channelId);
                formData.append("file", file); 
                
                requestData = formData;
            } else {
                requestData = { content, channelId };
            }

            const response = await sendMessageApi(requestData);
            return response.data.data;
        } catch (error) {
            return rejectWithValue(error.response?.data?.message || "Failed to send message");
        }
    }
);

const messageSlice = createSlice({
    name: "message",
    initialState: {
        messages: [],
        loading: false,
        error: null,
    }, 
    reducers: {
        addNewMessage: (state, action) => {
            state.messages.push(action.payload);
        },
        clearMessages: (state) => {
            state.messages = [];
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMessages.pending, (state) => {
                if (state.messages.length === 0) {
                    state.loading = true;
                }
            })
            .addCase(fetchMessages.fulfilled, (state, action) => {
                state.loading = false;
                const { messages, page } = action.payload;

                if (page === 1) {
                    state.messages = messages;
                } else {
                    state.messages = [...messages, ...state.messages];
                }
            })
            .addCase(fetchMessages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(sendMessages.fulfilled, (state, action) => {
                state.messages.push(action.payload);
            });
    },
});

export const { addNewMessage, clearMessages } = messageSlice.actions;
export default messageSlice.reducer;