import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
  withCredentials: true,
});


//---------------Auth-----------------

export const register = async (data) => {
  return api.post("/users/register", data);
}

export const login = async (data) => {
  return api.post("/users/login", data);
};

export const loadUserProfile = async () => {
  return api.get('/users/getmyprofile');
}

export const logout = async () => {
  return api.post('/users/logout');
}

//---------------WorkSpace------------------

export const createworkspace = async (data) => {
  return api.post('/workspace/createworkspace', data);
}

export const getworkspace = async () => {
  return api.get('/workspace/getuserworkspace');
}

export const getworkspacebyid = async (id) => {
  return api.get(`/workspace/getworkspace/${id}`);
}

export const getAllWorkspaceMembers = async (workspaceId) => {
  return api.get(`/workspace/${workspaceId}/getAlluserworkspace`);
};

//----------------Channel-----------------------

export const getAllchannelInWS = async (workspaceId) => {
  return api.get(`/channel/${workspaceId}/getworkspacechannel`)
}

export const createChannel = async (workspaceId, data) => {
  return api.post(`/channel/${workspaceId}/createchannel`, data);
}

export const getChannelById = async (channelId) => {
  return api.get(`/channel/${channelId}/getchannelbyid`);
};

export const getAllChannelMemberApi = async (channelId) => {
  return api.get(`/channel/${channelId}/getchannelmember`);
};

export const verifyChannelAccess = async (channelId) => {
  return api.get(`/channel/check-membership/${channelId}`);
};


export const addMemberToChannel = async (channelId, memberId) => {
  return api.post(`/channel/${channelId}/addchannelmember`, { memberIds: [memberId] });
};


//---------------Message----------------

export const getMessages = async (channelId, page) => {
    return api.get(`/message/${channelId}/getmessage`, { params: { page } });
}

export const sendMessageApi = async (data) => {
  return api.post('/message/createmessage', data);
}

//----------Task---------------------

export const createTaskApi = async (data) => {
  return api.post('/tasks/createtask', data);
}

export const getTaskApi = async (id) => {
  return api.get(`/tasks/gettask/${id}`);
}

export const deleteTaskApi = async (id) => {
  return api.delete(`/tasks/${id}/deletetask`);
}

export const updateTaskApi = async (id, status) => {
  return api.patch(`/tasks/${id}/updatetask`, { status });
}

//-----------------GitHub-------------------------

export const connectGitHubRepoApi = async (data) => {
  return api.post(`/github/connect`, data);
};

export const getConnectedReposApi = async (channelId) => {
  return api.get(`/github/${channelId}/repos`);
};

//------------------Invite-------------------

export const createWorkspaceInvite = async (workspaceId, role = 'member') => {
  return api.post(`/invite/create/${workspaceId}`, { role });
};

export const joininvite = async (token) => {
  return api.post(`/invite/join/${token}`);
}

//------------AI-------------------
export const triggerManualSummary= async (channelId,limit=10)=>{
  return api.post("/ai/summarize/chat",{channelId,limit});
}

export default api;

