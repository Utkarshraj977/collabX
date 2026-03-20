import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loadUser } from "./features/auth/authSlice";
import AppRoutes from "./routes/AppRoutes";
import { Toaster } from 'react-hot-toast';
import { connectSocket, disconnectSocket } from "./services/socket"; // Import fix

import { VideoProvider } from "./components/VideoContext1";
import CallOverlay1 from "./components/CallOverlay1";

export default function App() {
  const [isSocketReady, setIsSocketReady] = useState(false);
  const dispatch = useDispatch();
  const { loading, user } = useSelector((state) => state.auth);

  // 1. User Load
  useEffect(() => {
    dispatch(loadUser());
  }, [dispatch]);

  // 2. Socket Logic (OPTIMIZED)
  // 2. Socket Logic (OPTIMIZED & SAFE)
  useEffect(() => {
    // 🛡️ GUARD 1: Agar loading chal rahi hai, toh kuch mat karo. Wait karo.
    if (loading) return;

    // 🛡️ GUARD 2: Sirf tab connect karo jab user ID exist karti ho
    if (user?._id) {
      const s = connectSocket(); 

      // ✅ FIX: Kabhi kabhi socket turant connect ho jata hai event listener lagne se pehle.
      // Isliye manual check zaroori hai.
      if (s.connected) {
         setIsSocketReady(true);
      }

      const onConnect = () => {
        setIsSocketReady(true);
      };

      const onDisconnect = () => setIsSocketReady(false);
      
      const onConnectError = (err) => {
        console.error("Socket Error:", err.message);
        setIsSocketReady(false);
        // Agar auth error ho, toh disconnect kar do
        if (err.message === "Invalid Token" || err.message === "Authentication error") {
            disconnectSocket();
        }
      };

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("connect_error", onConnectError);

      // Cleanup
      return () => {
        s.off("connect", onConnect);
        s.off("disconnect", onDisconnect);
        s.off("connect_error", onConnectError);
        disconnectSocket(); 
      };
    } else {
        // Agar user nahi hai (logout), to disconnect karo
        disconnectSocket();
        setIsSocketReady(false);
    }
    
    // ⚠️ DEPENDENCY: 'loading' add karna zaroori hai
  }, [user?._id, loading]);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#333', color: '#fff' },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      {loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-[#15171c] text-white">
             {/* Loading Spinner Code same as yours */}
             <p>Loading...</p> 
        </div>
      ) : (
        <>
          <div style={{
            position: 'fixed', bottom: 10, right: 10, zIndex: 9999,
            padding: '5px 10px', borderRadius: '20px', fontSize: '12px',
            background: isSocketReady ? '#059669' : '#dc2626', color: 'white'
          }}>
            Socket: {isSocketReady ? "Connected ✅" : "Disconnected ❌"}
          </div>
          
          <VideoProvider isSocketReady={isSocketReady}>
            <CallOverlay1 />
            <AppRoutes />
          </VideoProvider>
        </>
      )}
    </>
  );
}
