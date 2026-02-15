import { Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';

import Home from '../pages/Home';
import Login from '../pages/Login';
import Register from '../pages/Register';
import Workspace from '../pages/Workspace';
import Dashboard from '../pages/Dashboard';
import WorkspaceLayout from '../components/layout/WorkspaceLayout';
import Channel from '../pages/ChannelPage';

// 🔥 IMPORT MEET COMPONENT
import Meet from '../pages/Meet';

// --- GUARDS ---
const PrivateRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const PublicRoute = () => {
  const { isAuthenticated } = useSelector((state) => state.auth);
  return !isAuthenticated ? <Outlet /> : <Navigate to="/dashboard" replace />;
};

// 🔥 WRAPPER: Extracts 'channelId' from URL and passes it to Meet component
const MeetWrapper = () => {
    const { channelId } = useParams();
    return <Meet channelId={channelId} />;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      <Route element={<PrivateRoute />}>
        
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/workspace" element={<Workspace />} />
        
        {/* Workspace Layout (Sidebar + Channel) */}
        <Route path="/workspace/:workspaceId" element={<WorkspaceLayout />}>
           <Route path="channel/:channelId" element={<Channel />} />
        </Route>

        {/* 🔥 NEW ROUTE: VIDEO CALL LOBBY */}
        {/* We keep this outside WorkspaceLayout so it can take up the full screen */}
        <Route path="/meet/:channelId" element={<MeetWrapper />} />

      </Route>

      <Route path="*" element={<div>404 Not Found</div>} />
    </Routes>
  );
};

export default AppRoutes;