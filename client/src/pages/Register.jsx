import { useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../features/auth/authSlice";
import { register } from "../services/api";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [file, setFile] = useState(null); // File ke liye state

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("password", password);
    if (file) {
      formData.append("avatar", file); 
    }

    try {
      const response = await register(formData);
      navigate('/login'); // Redirect
      
    } catch (error) {
      console.error("Register Failed:", error);
      alert(error.response?.data?.message || "Registration Failed");
    }
  };

  return (
    <div className="h-screen flex justify-center items-center bg-background text-text-main">
      <div className="w-full max-w-md bg-surface p-8 rounded-xl border border-gray-700 shadow-2xl">
        
        <h1 className="text-3xl font-bold text-center mb-6 text-secondary">Create Account</h1>
        
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          
          {/* Name Input */}
          <div>
            <label className="text-sm text-text-muted mb-1 block">Full Name</label>
            <input 
              type="text" 
              placeholder="e.g. Utkarsh Raj" 
              value={name}
              onChange={(e) => setName(e.target.value)} // ✅ Corrected: e.target.value
              className="w-full p-3 rounded bg-background border border-gray-700 focus:border-primary focus:outline-none text-white transition"
              required 
            />
          </div>

          {/* Email Input */}
          <div>
            <label className="text-sm text-text-muted mb-1 block">Email Address</label>
            <input 
              type="email" 
              placeholder="utkarsh@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)} // ✅ Corrected
              className="w-full p-3 rounded bg-background border border-gray-700 focus:border-primary focus:outline-none text-white transition"
              required 
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="text-sm text-text-muted mb-1 block">Password</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={password}
              onChange={(e) => setPassword(e.target.value)} // ✅ Corrected
              className="w-full p-3 rounded bg-background border border-gray-700 focus:border-primary focus:outline-none text-white transition"
              required 
            />
          </div>

          {/* File Input (Simple Style) */}
          <div>
            <label className="text-sm text-text-muted mb-1 block">Profile Picture</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])} // ✅ Corrected: files array hota hai
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-secondary/10 file:text-primary hover:file:bg-secondary/20"
            />
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            className="mt-4 bg-secondary text-background font-bold py-3 px-4 rounded hover:bg-text-muted transition shadow-[0_0_15px_rgba(0,212,255,0.4)]"
          >
            Register Now
          </button>

        </form>
        
        <p className="mt-4 text-center text-text-muted text-sm">
          Already have an account? <span onClick={() => navigate("/login")} className="text-secondary cursor-pointer hover:underline">Login here</span>
        </p>

      </div>
    </div>
  );
}


