import { useState } from "react";
import { useDispatch } from "react-redux"; // 1. Redux hook
import { useNavigate } from "react-router-dom"; // 2. Navigation hook
import { login } from "../services/api"; // API Function
import { loginSuccess } from "../features/auth/authSlice"; // Redux Action



export default function Login() {
  const [email, setEmail] = useState(""); 
  const [password, setPassword] = useState(""); 
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
      e.preventDefault(); 
      
      try {
        const response = await login({ email, password });
  
        dispatch(loginSuccess(response.data.data)); 

        navigate("/dashboard"); 
        
      } catch (error) {
          console.error("Login Failed:", error);
          alert("Invalid Email or Password"); 
      }
  }

  return (
    <div className="flex justify-center items-center h-screen bg-background text-white">
      <div className="bg-surface p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-center text-secondary">Login</h1>
        
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          
          <label className="text-sm text-text-muted block">Email</label>
          <input 
            type="email" 
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-text-muted"
            required
          />

          <label className="text-sm text-text-muted block">Name</label>
          <input 
            type="password" 
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:outline-none focus:border-text-muted"
            required
          />

          <button 
            type="submit" 
            className="bg-secondary hover:bg-text-muted text-white font-bold py-2 px-4 rounded transition"
          >
            Login
          </button>
          <span onClick={() => navigate("/register")} className="text-secondary cursor-pointer hover:underline">register here</span>
        </form>
      </div>
    </div>
  );
}