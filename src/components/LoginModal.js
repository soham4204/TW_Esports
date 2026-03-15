import React from 'react';
import { X } from 'lucide-react';

const LoginModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const DISCORD_CLIENT_ID = "1482318118649856031";
  
  // Use current origin for redirect rules
  const REDIRECT_URI = `${window.location.origin}/auth/discord/callback`;

  const handleDiscordLogin = () => {
    // Standard OAuth2 Authorization URL
    const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=identify`;
    
    // Redirect user to Discord
    window.location.href = authUrl;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl max-w-sm w-full relative overflow-hidden">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute right-4 top-4 text-slate-400 hover:text-white transition-colors"
        >
          <X className="h-6 w-6" />
        </button>

        <div className="p-8 text-center">
          <div className="mb-6 mx-auto w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
            {/* Simple SVG Discord Logo for aesthetic */}
            <svg 
              className="w-10 h-10 text-indigo-500" 
              fill="currentColor" 
              viewBox="0 0 127.14 96.36"
            >
              <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77.67,77.67,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.31,46,96.12,53,91.08,65.69,84.69,65.69Z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-black text-white mb-2">Welcome Back</h2>
          <p className="text-slate-400 mb-8 text-sm">
            Sign in with Discord to register for tournaments and join the community.
          </p>

          <button 
            onClick={handleDiscordLogin}
            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3 px-6 rounded-xl font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-indigo-500/20"
          >
            Login with Discord
          </button>
        </div>
        
      </div>
    </div>
  );
};

export default LoginModal;
