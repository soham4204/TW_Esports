import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { Trophy, RefreshCw, Swords } from 'lucide-react';
import axios from 'axios';

export default function LeaderboardTable({ tournamentId, tournamentCategory, currentPlayerTag }) {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  useEffect(() => {
    if (!tournamentId) return;

    // Real-time Firestore subscription: updates instantly!
    const unsubscribe = db
      .collection('tournaments')
      .doc(tournamentId)
      .collection('leaderboard')
      .orderBy('totalScore', 'desc')
      .onSnapshot((snapshot) => {
        const rows = [];
        snapshot.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
        setLeaderboard(rows);
        setLoading(false);
      }, (err) => {
        console.error('Leaderboard error:', err);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [tournamentId]);

  const handleSync = async () => {
    if (!currentPlayerTag || syncing) return;
    setSyncing(true);
    setSyncMsg('');

    try {
      const res = await axios.post('/api/brawlstars/sync', {
        tournamentId,
        playerTag: currentPlayerTag
      });
      if (res.data.newMatchesFound > 0) {
        setSyncMsg(`Synced ${res.data.newMatchesFound} new matches! (+${res.data.pointsAdded} pts)`);
      } else {
        setSyncMsg('All matches are already up to date!');
      }
    } catch (err) {
      setSyncMsg(err.response?.data?.error || 'Failed to sync. Please try again.');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 5000);
    }
  };

  const isRanked = tournamentCategory === 'ranked';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl text-white mt-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 bg-slate-950/70 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <Trophy className="text-yellow-500" size={26} /> Live Tournament Leaderboard
            </h2>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1 ${
              isRanked ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
            }`}>
              {isRanked ? <Swords size={12} /> : <Trophy size={12} />}
              {isRanked ? 'Ranked Mode' : 'Trophy Ladder'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Full cumulative tracking: Every match played during tournament window adds points!
          </p>
        </div>

        {currentPlayerTag && (
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black text-sm rounded-xl transition shadow-lg shadow-blue-600/20"
          >
            <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing Battles...' : 'Sync My Score'}
          </button>
        )}
      </div>

      {syncMsg && (
        <div className="bg-blue-500/10 border-b border-blue-500/20 text-blue-300 text-xs px-6 py-2 text-center font-medium">
          {syncMsg}
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="p-12 text-center text-slate-500">Loading live standings...</div>
      ) : leaderboard.length === 0 ? (
        <div className="p-12 text-center text-slate-500">
          No matches recorded yet. Play games in Brawl Stars and click "Sync My Score"!
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase bg-slate-950/40 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center w-16">Rank</th>
                <th className="py-3 px-4">Player Tag</th>
                <th className="py-3 px-4 text-center">Matches Tracked</th>
                <th className="py-3 px-4 text-right">Cumulative Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {leaderboard.map((row, index) => {
                const rank = index + 1;
                const isMe = currentPlayerTag && row.playerTag.toUpperCase() === currentPlayerTag.toUpperCase();

                return (
                  <tr
                    key={row.id}
                    className={`hover:bg-slate-800/40 transition ${
                      isMe ? 'bg-blue-600/10 border-l-4 border-blue-500' : ''
                    }`}
                  >
                    <td className="py-4 px-4 text-center font-black">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-black text-xs font-black shadow-md shadow-yellow-500/30">
                          1
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black text-xs font-black">
                          2
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black">
                          3
                        </span>
                      ) : (
                        <span className="text-slate-500">#{rank}</span>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      <div className="font-bold flex items-center gap-2">
                        <span className="font-mono text-slate-200">{row.playerTag}</span>
                        {isMe && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-center font-mono text-slate-300">
                      {row.matchesPlayed || 0}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-lg font-black font-mono text-yellow-500">
                        {(row.totalScore || 0).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 ml-1">pts</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
