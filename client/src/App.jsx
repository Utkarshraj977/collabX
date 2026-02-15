import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from 'react-hot-toast';
import { connectSocket, disconnectSocket } from "./services/socket";

import { VideoProvider } from "./components/VideoContext";
import CallOverlay from "./components/CallOverlay";
 
export default function App() {
  const dispatch = useDispatch();
  const { loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  useEffect(() => {
    const userToken = user?.token || user?.refreshtoken;

    if (userToken) {
      connectSocket(userToken);
    } else {
      disconnectSocket();
    }

    return () => disconnectSocket();
  }, [user]); 

  return (
    <>
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            border: '1px solid #4B5563',
          },
          success: {
            iconTheme: { primary: '#22c55e', secondary: '#fff' },
          },
          error: {
            iconTheme: { primary: '#ef4444', secondary: '#fff' },
          },
        }}
      />

      {loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-[#15171c] text-white">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 text-sm animate-pulse">Initializing CollabX...</p>
          </div>
        </div>
      ) : (
        <VideoProvider>
            <CallOverlay />
            <AppRoutes />
        </VideoProvider>
      )}
    </>
  );
}
