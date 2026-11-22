import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import { Trophy, RefreshCw, Swords } from 'lucide-react';
import axios from 'axios';

export default function LeaderboardTable({ tournamentId, tournamentCategory, currentPlayerTag }) {
  const [rawTeams, setRawTeams] = useState([]);
  const [rawScores, setRawScores] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [teamsMap, setTeamsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState('');

  // Real-time listener for ALL registered teams
  useEffect(() => {
    if (!tournamentId) return;

    const unsubscribeTeams = db
      .collection('tournaments')
      .doc(tournamentId)
      .collection('teams')
      .onSnapshot((snapshot) => {
        const list = [];
        const map = {};
        snapshot.forEach((doc) => {
          const data = doc.data();
          list.push({ id: doc.id, ...data });
          const rawTag = data.playerTag || data.player1Id || '';
          if (rawTag) {
            const clean = rawTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
            map[clean] = data;
          }
        });
        setTeamsMap(map);
        setRawTeams(list);
      }, (err) => console.error('Teams map error:', err));

    // Real-time listener for leaderboard score documents
    const unsubscribeLeaderboard = db
      .collection('tournaments')
      .doc(tournamentId)
      .collection('leaderboard')
      .onSnapshot((snapshot) => {
        const rows = [];
        snapshot.forEach((doc) => rows.push({ id: doc.id, ...doc.data() }));
        setRawScores(rows);
        setLoading(false);
      }, (err) => {
        console.error('Leaderboard error:', err);
        setLoading(false);
      });

    return () => {
      unsubscribeTeams();
      unsubscribeLeaderboard();
    };
  }, [tournamentId]);

  // Merge registered teams with leaderboard scores: ensures EVERY registered player appears!
  useEffect(() => {
    const playerMap = new Map();

    // 1. Seed with ALL registered players from teams (0 points by default)
    rawTeams.forEach((team) => {
      const rawTag = team.playerTag || team.player1Id || '';
      const cleanTag = rawTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (!cleanTag) return;

      const formattedTag = '#' + cleanTag;
      playerMap.set(cleanTag, {
        id: team.id || cleanTag,
        cleanTag,
        playerTag: formattedTag,
        discordUsername: team.discordUsername || null,
        discordId: team.discordId || null,
        teamName: team.teamName || null,
        brawlStarsName: team.brawlStarsName || null,
        playerName: team.discordUsername || team.teamName || team.brawlStarsName || formattedTag,
        totalScore: 0,
        matchesPlayed: 0,
        registeredAt: team.registeredAt || null
      });
    });

    // 2. Merge score documents from leaderboard
    rawScores.forEach((entry) => {
      const rawTag = entry.playerTag || entry.id || '';
      const cleanTag = rawTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
      if (!cleanTag) return;

      const existing = playerMap.get(cleanTag) || {
        id: entry.id || cleanTag,
        cleanTag,
        playerTag: '#' + cleanTag,
        discordUsername: null,
        discordId: null,
        teamName: null,
        brawlStarsName: null,
        playerName: '#' + cleanTag,
        totalScore: 0,
        matchesPlayed: 0,
        registeredAt: null
      };

      const score = typeof entry.totalScore === 'number' 
        ? entry.totalScore 
        : parseInt(entry.totalScore || 0, 10);
      const matches = typeof entry.matchesPlayed === 'number' 
        ? entry.matchesPlayed 
        : parseInt(entry.matchesPlayed || 0, 10);

      const discordName = (entry.discordUsername && !entry.discordUsername.startsWith('#'))
        ? entry.discordUsername
        : existing.discordUsername;

      playerMap.set(cleanTag, {
        ...existing,
        ...entry,
        cleanTag,
        playerTag: '#' + cleanTag,
        discordUsername: discordName,
        discordId: entry.discordId || existing.discordId,
        teamName: entry.teamName || existing.teamName,
        brawlStarsName: entry.brawlStarsName || existing.brawlStarsName,
        totalScore: isNaN(score) ? 0 : score,
        matchesPlayed: isNaN(matches) ? 0 : matches,
        lastSyncedAt: entry.lastSyncedAt || existing.lastSyncedAt || null
      });
    });

    // 3. Sort by totalScore desc, then matchesPlayed desc, then tag asc
    const sorted = Array.from(playerMap.values()).sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      if (b.matchesPlayed !== a.matchesPlayed) return b.matchesPlayed - a.matchesPlayed;
      return (a.cleanTag || '').localeCompare(b.cleanTag || '');
    });

    setLeaderboard(sorted);
  }, [rawTeams, rawScores]);

  // Helper: Display Discord username on top in bold white, no duplicate player tag
  const getPlayerDisplayName = (row) => {
    if (!row) return 'Player';
    // 1. Direct discordUsername on row
    if (row.discordUsername && !row.discordUsername.startsWith('#')) {
      return row.discordUsername;
    }
    // 2. Lookup in teams map by clean player tag
    const cleanTag = (row.playerTag || row.id || row.cleanTag || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
    const team = teamsMap[cleanTag];
    if (team?.discordUsername && !team.discordUsername.startsWith('#')) {
      return team.discordUsername;
    }
    // 3. Fallback to Discord ID
    if (row.discordId) return row.discordId;
    if (team?.discordId) return team.discordId;

    // 4. Current logged-in user profile if it's the current player
    const isMe = currentPlayerTag && cleanTag === currentPlayerTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
    if (isMe) {
      try {
        const cached = localStorage.getItem('discordUser');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.username) return parsed.username;
        }
      } catch (e) {}
    }

    // 5. Team name / in-game name (if not a tag)
    if (row.teamName && !row.teamName.startsWith('#')) return row.teamName;
    if (team?.teamName && !team.teamName.startsWith('#')) return team.teamName;
    if (row.brawlStarsName && !row.brawlStarsName.startsWith('#')) return row.brawlStarsName;
    if (row.playerName && !row.playerName.startsWith('#') && row.playerName !== row.playerTag) {
      return row.playerName;
    }

    // 6. Only fallback to playerTag if no other info exists
    return row.playerTag || 'Player';
  };

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
            Showing all registered players. Cumulative points from tournament matches.
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
          No players registered yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs uppercase bg-slate-950/40 text-slate-400 font-bold border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center w-16">Rank</th>
                <th className="py-3 px-4">Player</th>
                <th className="py-3 px-4 text-center">Matches Tracked</th>
                <th className="py-3 px-4 text-right">Cumulative Points</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-sm">
              {leaderboard.map((row, index) => {
                const rank = index + 1;
                const isMe = currentPlayerTag && row.playerTag?.toUpperCase() === currentPlayerTag.toUpperCase();

                return (
                  <tr
                    key={row.id || row.playerTag}
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
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">{getPlayerDisplayName(row)}</span>
                        {isMe && (
                          <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-mono text-slate-400 mt-0.5">
                        {row.playerTag}
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
