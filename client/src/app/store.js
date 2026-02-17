import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import workspaceReducer from '../features/workspace/workspaceSlice'
import messageReducer from '../features/messages/messageSlice'
import taskReducer from '../features/tasks/taskSlice'
import githubReducer from '../features/github/githubSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    workspace: workspaceReducer,
    message:messageReducer,
    tasks: taskReducer, 
    github:githubReducer
  },
});


const rootReducer = (state, action) => {
  if (action.type === 'auth/logout/fulfilled') {
    state = undefined;
  }
  return appReducer(state, action);
};
