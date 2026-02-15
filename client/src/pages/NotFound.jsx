import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4 font-sans">
      <div className="text-center">
        {/* Large Greenish 404 */}
        <h1 className="text-9xl font-extrabold text-emerald-600 drop-shadow-sm">404</h1>
        
        <h2 className="text-3xl font-bold mt-4 text-gray-800">
          Lost in CollabX?
        </h2>
        <p className="text-gray-500 mt-2 mb-8 max-w-md">
          The page you are looking for doesn't exist. Let's get you back to your workspace.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          {/* Main Action Button (Emerald/Green) */}
          <button
            onClick={() => navigate('/login')}
            className="px-8 py-3 bg-emerald-600 text-white rounded-md font-semibold hover:bg-emerald-700 transition-colors shadow-lg active:scale-95"
          >
            Back to Login
          </button>
          
          {/* Secondary Action Button */}
          <button
            onClick={() => navigate('/register')}
            className="px-8 py-3 bg-white text-emerald-700 border-2 border-emerald-600 rounded-md font-semibold hover:bg-emerald-50 transition-colors shadow-md active:scale-95"
          >
            Join CollabX
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;