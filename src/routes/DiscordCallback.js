import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import { Loader2, AlertCircle, CheckCircle } from 'lucide-react';

const DiscordCallback = () => {
  const [status, setStatus] = useState('authenticating'); // authenticating, success, error
  const [errorMessage, setErrorMessage] = useState('');
  const location = useLocation();
  const navigate = useNavigate();
  const hasFetched = useRef(false);

  useEffect(() => {
    if (hasFetched.current) return;
    hasFetched.current = true;

    const handleCallback = async () => {
      // 1. Get the code from the URL
      const searchParams = new URLSearchParams(location.search);
      const code = searchParams.get('code');

      if (!code) {
        setStatus('error');
        setErrorMessage('No authorization code found from Discord.');
        // If there's no code, maybe redirect home after a delay
        setTimeout(() => navigate('/home'), 3000);
        return;
      }

      try {
        // 2. Call our Firebase Function to exchange the code for a custom token
        // Vercel Serverless Function endpoint
        // This relative path works automatically when deployed to Vercel, 
        // as well as locally if using the `vercel dev` command.
        const functionUrl = '/api/discordLogin';  
        
        const redirectUri = `${window.location.origin}/auth/discord/callback`;

        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code, redirectUri }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to authenticate with Discord.');
        }

        const data = await response.json();
        const { token, user } = data;

        // 3. Sign in to Firebase with the Custom Token
        await auth.signInWithCustomToken(token);

        // 4. Update local profile context / state if needed, or rely on snapshot
        // We'll store a quick flag in localStorage just as a helper
        localStorage.setItem('discordUser', JSON.stringify(user));

        setStatus('success');
        
        // Redirect to home after a brief success message
        setTimeout(() => {
          navigate('/home');
        }, 1500);

      } catch (error) {
        console.error('Discord authentication error:', error);
        setStatus('error');
        setErrorMessage(error.message || 'An error occurred during authentication.');
      }
    };

    handleCallback();
  }, [location, navigate]);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white p-4">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
        
        {status === 'authenticating' && (
          <div className="flex flex-col items-center animate-in fade-in duration-500">
            <Loader2 className="h-16 w-16 text-blue-500 animate-spin mb-6" />
            <h2 className="text-2xl font-bold mb-2">Connecting to Discord...</h2>
            <p className="text-slate-400">Please wait while we secure your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center animate-in zoom-in duration-300">
            <CheckCircle className="h-16 w-16 text-green-500 mb-6" />
            <h2 className="text-2xl font-bold mb-2">Login Successful!</h2>
            <p className="text-slate-400">Redirecting you to the dashboard...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center animate-in slide-in-from-bottom-4 duration-300">
            <AlertCircle className="h-16 w-16 text-red-500 mb-6" />
            <h2 className="text-2xl font-bold mb-2 text-red-400">Authentication Failed</h2>
            <p className="text-slate-300 mb-6">{errorMessage}</p>
            <button 
              onClick={() => navigate('/home')}
              className="bg-slate-800 hover:bg-slate-700 text-white px-6 py-3 rounded-lg font-medium transition-colors w-full"
            >
              Return Home
            </button>
          </div>
        )}

      </div>
    </div>
  );
};

export default DiscordCallback;
