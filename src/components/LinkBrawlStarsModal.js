import React, { useState } from 'react';
import axios from 'axios';
import { db } from '../firebase-config';
import { X, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export default function LinkBrawlStarsModal({ isOpen, onClose, user, onLinked }) {
  const [tagInput, setTagInput] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [playerData, setPlayerData] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!tagInput.trim()) return;
    setVerifying(true);
    setError('');
    setPlayerData(null);

    try {
      const res = await axios.get(`/api/brawlstars/player?tag=${encodeURIComponent(tagInput.trim())}`);
      setPlayerData(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Account not found. Please check your player tag in-game.');
    } finally {
      setVerifying(false);
    }
  };

  const handleConfirm = async () => {
    if (!playerData || !user) return;
    try {
      await db.collection('users').doc(user.uid).set({
        brawlStarsTag: playerData.tag,
        brawlStarsName: playerData.name,
        trophies: playerData.trophies,
        highestTrophies: playerData.highestTrophies,
        linkedAt: new Date().toISOString()
      }, { merge: true });

      if (onLinked) onLinked(playerData);
      onClose();
    } catch (err) {
      setError('Failed to save to profile. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white relative shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white">
          <X size={20} />
        </button>

        <h3 className="text-xl font-black mb-1 flex items-center gap-2">
          <Shield className="text-yellow-500" size={22} /> Link Brawl Stars Account
        </h3>
        <p className="text-xs text-slate-400 mb-6">
          Enter your in-game Player Tag (found on your profile under your avatar, e.g. #8VQ8V2YVY).
        </p>

        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              placeholder="#8VQ8V2YVY"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 font-mono text-sm uppercase text-white focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={handleVerify}
              disabled={verifying || !tagInput.trim()}
              className="px-5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white font-bold text-sm rounded-xl transition"
            >
              {verifying ? '...' : 'Verify'}
            </button>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-300 text-xs p-3 rounded-xl flex items-center gap-2">
              <AlertCircle size={16} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {playerData && (
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-black text-white">{playerData.name}</p>
                  <p className="text-xs font-mono text-slate-400">{playerData.tag}</p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-bold">
                  Found!
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-300 pt-2 border-t border-slate-800">
                <span>🏆 Trophies: <strong>{playerData.trophies.toLocaleString()}</strong></span>
                <span>⚔️ 3v3 Wins: <strong>{playerData.victories3v3.toLocaleString()}</strong></span>
              </div>

              <button
                onClick={handleConfirm}
                className="w-full mt-4 bg-green-600 hover:bg-green-500 text-white py-3 rounded-xl font-black text-sm transition"
              >
                Confirm & Link Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
