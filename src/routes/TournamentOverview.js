import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from '../firebase-config';
import { 
  Trophy, 
  CheckCircle, 
  ArrowLeft, 
  AlertCircle, 
  Shield, 
  Swords, 
  Users, 
  Clock, 
  Coins, 
  RefreshCw, 
  Gift, 
  Flame,
  Award
} from 'lucide-react';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import LinkBrawlStarsModal from '../components/LinkBrawlStarsModal';
import axios from 'axios';

const TournamentOverview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');
    const [registeredTeams, setRegisteredTeams] = useState(0);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Auth & Brawl Stars Profile
    const [user, setUser] = useState(null);
    const [discordProfile, setDiscordProfile] = useState(null);
    const [brawlStarsTag, setBrawlStarsTag] = useState('');
    const [brawlStarsName, setBrawlStarsName] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Leaderboard state: raw collections & merged list
    const [rawTeams, setRawTeams] = useState([]);
    const [rawScores, setRawScores] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [teamsMap, setTeamsMap] = useState({});
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    // Personal match history
    const [myMatches, setMyMatches] = useState([]);

    // Real-time 1-second interval timer for countdown
    const [currentTime, setCurrentTime] = useState(Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentTime(Date.now());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Track Authentication & Linked Tag
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async currentUser => {
            setUser(currentUser);
            if (currentUser) {
                const cachedProfile = localStorage.getItem('discordUser');
                if (cachedProfile) setDiscordProfile(JSON.parse(cachedProfile));

                try {
                    const userDoc = await db.collection('users').doc(currentUser.uid).get();
                    if (userDoc.exists && userDoc.data().brawlStarsTag) {
                        setBrawlStarsTag(userDoc.data().brawlStarsTag);
                        setBrawlStarsName(userDoc.data().brawlStarsName || '');
                    }
                } catch (e) {
                    console.error('Error fetching user brawl stars tag:', e);
                }
            } else {
                setDiscordProfile(null);
                setBrawlStarsTag('');
                setBrawlStarsName('');
            }
        });
        return unsubscribe;
    }, []);

    // Fetch Tournament Details & Real-time Listeners for Teams and Leaderboard
    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const doc = await db.collection('tournaments').doc(id).get();
                if (doc.exists) {
                    setTournament({ id: doc.id, ...doc.data() });
                } else {
                    setErrorMessage('Tournament not found');
                }
            } catch (err) {
                setErrorMessage('Failed to load tournament');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchTournament();

        // Real-time listener for ALL registered teams
        const unsubscribeTeams = db.collection('tournaments').doc(id).collection('teams')
            .onSnapshot(snap => {
                setRegisteredTeams(snap.size);
                const list = [];
                const map = {};
                snap.forEach(doc => {
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
            }, err => console.error('Error listening to teams:', err));

        // Real-time listener for leaderboard score documents
        const unsubscribeLeaderboard = db.collection('tournaments').doc(id).collection('leaderboard')
            .onSnapshot(snap => {
                const list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                setRawScores(list);
            }, err => console.error('Error listening to leaderboard:', err));

        return () => {
            unsubscribeTeams();
            unsubscribeLeaderboard();
        };
    }, [id]);

    // Merge registered teams and leaderboard scores: guarantees every registered player appears!
    useEffect(() => {
        const playerMap = new Map();

        // 1. Seed with ALL registered players from teams (ensures every player exists with 0 pts)
        rawTeams.forEach(team => {
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

        // 2. Merge score records from leaderboard collection
        rawScores.forEach(entry => {
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

            // Determine best discordUsername: entry's if valid (not a tag), else existing's
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

    // Check if user is already registered
    useEffect(() => {
        if (!user || !id) {
            setIsAlreadyRegistered(false);
            return;
        }

        const checkReg = async () => {
            try {
                const registrationDoc = await db.collection('tournaments').doc(id)
                                              .collection('teams').doc(user.uid).get();
                setIsAlreadyRegistered(registrationDoc.exists);
            } catch (err) {
                console.error('Registration check error:', err);
            }
        };
        checkReg();
    }, [user, id]);

    // Fetch User's Scored Matches in this Tournament
    useEffect(() => {
        if (!brawlStarsTag || !id) return;

        const unsubscribeMatches = db.collection('tournaments').doc(id).collection('battle_logs')
            .where('playerTag', '==', brawlStarsTag)
            .onSnapshot(snap => {
                const list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                setMyMatches(list);
            }, err => console.error(err));

        return () => unsubscribeMatches();
    }, [brawlStarsTag, id]);

    // Display helper: Discord username on top in bold white, no duplicate player tag
    const getPlayerDiscordName = (row) => {
        if (!row) return 'Player';
        // 1. Direct discordUsername on row
        if (row.discordUsername && !row.discordUsername.startsWith('#')) {
            return row.discordUsername;
        }
        // 2. Lookup in teamsMap by cleanTag
        const cleanTag = (row.playerTag || row.id || row.cleanTag || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        const team = teamsMap[cleanTag];
        if (team?.discordUsername && !team.discordUsername.startsWith('#')) {
            return team.discordUsername;
        }
        // 3. Fallback to Discord ID if present
        if (row.discordId) return row.discordId;
        if (team?.discordId) return team.discordId;

        // 4. Current logged-in user profile if it's the current player
        const isMe = brawlStarsTag && cleanTag === brawlStarsTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
        if (isMe && discordProfile?.username) {
            return discordProfile.username;
        }

        // 5. Team name / in-game name
        if (row.teamName && !row.teamName.startsWith('#')) return row.teamName;
        if (team?.teamName && !team.teamName.startsWith('#')) return team.teamName;
        if (row.brawlStarsName && !row.brawlStarsName.startsWith('#')) return row.brawlStarsName;
        if (row.playerName && !row.playerName.startsWith('#') && row.playerName !== row.playerTag) {
            return row.playerName;
        }

        // 6. Only fallback to playerTag if no Discord data exists
        return row.playerTag || 'Player';
    };

    // Handle Join Tournament
    const handleRegister = async () => {
        if (!user || !discordProfile) {
            setIsLoginModalOpen(true);
            return;
        }

        if (!brawlStarsTag) {
            setIsLinkModalOpen(true);
            return;
        }

        setIsSubmitting(true);
        setErrorMessage('');

        try {
            await db.collection('tournaments').doc(id).collection('teams').doc(user.uid).set({
                teamName: brawlStarsName || discordProfile.username,
                discordUsername: discordProfile.username,
                discordId: discordProfile.discordId || null,
                avatar: discordProfile.avatar || null,
                playerTag: brawlStarsTag,
                brawlStarsName: brawlStarsName || '',
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            await db.collection('tournaments').doc(id).collection('leaderboard').doc(brawlStarsTag).set({
                playerTag: brawlStarsTag,
                playerName: discordProfile.username || brawlStarsName,
                discordUsername: discordProfile.username,
                discordId: discordProfile.discordId || null,
                totalScore: 0,
                matchesPlayed: 0,
                lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            await db.collection('users').doc(user.uid).collection('myTournaments').doc(id).set({
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                tournamentId: id
            });

            setIsAlreadyRegistered(true);
        } catch (err) {
            setErrorMessage(err.message || 'Registration failed. Try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    // Handle Sync My Score
    const handleSync = async () => {
        if (!brawlStarsTag || syncing) return;
        setSyncing(true);
        setSyncMsg('');

        try {
            const res = await axios.post('/api/brawlstars/sync', {
                tournamentId: id,
                playerTag: brawlStarsTag
            });

            if (res.data.newMatchesFound > 0) {
                setSyncMsg(`🎉 Synced ${res.data.newMatchesFound} new matches! (+${res.data.pointsAdded} pts)`);
            } else {
                setSyncMsg('All matches are already tracked & scored!');
            }
        } catch (err) {
            setSyncMsg(err.response?.data?.error || 'Failed to sync. Please try again.');
        } finally {
            setSyncing(false);
            setTimeout(() => setSyncMsg(''), 6000);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
                <RefreshCw size={32} className="animate-spin text-yellow-500" />
            </div>
        );
    }

    if (!tournament) {
        return (
            <div className="min-h-screen bg-slate-950 text-white">
                <Navbar />
                <div className="max-w-4xl mx-auto px-4 mt-12 text-center">
                    <AlertCircle size={56} className="mx-auto text-red-500 mb-4" />
                    <h2 className="text-2xl font-bold">{errorMessage || 'Tournament Not Found'}</h2>
                    <button onClick={() => navigate('/home')} className="mt-6 px-6 py-2.5 bg-blue-600 rounded-xl font-bold">
                        Back to Tournaments
                    </button>
                </div>
            </div>
        );
    }

    const isRanked = tournament.category === 'ranked';

    // Parse tournament start and end dates
    const parseDate = (val) => {
        if (!val) return null;
        if (typeof val.toDate === 'function') return val.toDate();
        if (val.seconds) return new Date(val.seconds * 1000);
        const d = new Date(val);
        return isNaN(d.getTime()) ? null : d;
    };

    const startDate = parseDate(tournament.startsAt);
    const endDate = parseDate(tournament.endsAt);

    let timerPhase = 'open'; // 'upcoming' | 'live' | 'completed' | 'open'
    let targetTime = null;

    if (startDate && currentTime < startDate.getTime()) {
        timerPhase = 'upcoming'; // Tournament Starts In
        targetTime = startDate.getTime();
    } else if (endDate && currentTime > endDate.getTime()) {
        timerPhase = 'completed'; // Tournament Completed
        targetTime = null;
    } else if (endDate) {
        timerPhase = 'live'; // Tournament Live — Ends In
        targetTime = endDate.getTime();
    } else if (startDate && currentTime >= startDate.getTime()) {
        timerPhase = 'live';
        targetTime = null;
    }

    const diff = targetTime ? Math.max(0, targetTime - currentTime) : 0;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 font-poppins">
            <Navbar />

            {/* Back Button */}
            <div className="max-w-6xl mx-auto px-4 pt-4">
                <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                    <ArrowLeft size={16} /> Back to Tournaments
                </button>
            </div>

            {/* HERO HEADER */}
            <div className="max-w-6xl mx-auto px-4 mt-4">
                <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                    <div className="relative h-64 md:h-80 w-full overflow-hidden">
                        <img 
                            src={tournament.thumbnail || 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=1200'} 
                            alt={tournament.name} 
                            className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-transparent" />
                        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-transparent to-transparent" />
                    </div>

                    {/* Hero Content Overlay */}
                    <div className="absolute inset-0 p-6 md:p-10 flex flex-col justify-end">
                        {/* Badges */}
                        <div className="flex items-center gap-2 flex-wrap mb-3">
                            <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                timerPhase === 'live' 
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                                    : timerPhase === 'upcoming'
                                    ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                    : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                    timerPhase === 'live' ? 'bg-emerald-400 animate-pulse' :
                                    timerPhase === 'upcoming' ? 'bg-yellow-400 animate-pulse' : 'bg-red-400'
                                }`} />
                                {timerPhase === 'live' ? 'Live Tournament' : timerPhase === 'upcoming' ? 'Upcoming Tournament' : 'Tournament Completed'}
                            </span>
                            <span className="px-3 py-1 bg-blue-600/30 text-blue-300 border border-blue-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                                Brawl Stars
                            </span>
                            <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${
                                isRanked 
                                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' 
                                    : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                            }`}>
                                {isRanked ? <Swords size={12} /> : <Trophy size={12} />}
                                {isRanked ? 'Ranked Mode' : 'Trophy Ladder'}
                            </span>
                        </div>

                        {/* Title */}
                        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-md">
                            {tournament.name}
                        </h1>

                        {/* Key Stats Bar */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-3xl bg-slate-950/80 backdrop-blur-md p-3.5 rounded-2xl border border-slate-800/80">
                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
                                    <Coins size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Prize Pool</p>
                                    <p className="text-lg font-black text-yellow-400 font-mono">₹{tournament.prizePool || 5000}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
                                    <Users size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Registered</p>
                                    <p className="text-lg font-black text-white font-mono">{registeredTeams} / {tournament.slots || 100}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className="p-2 rounded-xl bg-purple-500/10 text-purple-500">
                                    <Flame size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Scoring</p>
                                    <p className="text-xs font-black text-purple-300 uppercase">Cumulative</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5">
                                <div className={`p-2 rounded-xl ${
                                    timerPhase === 'live' ? 'bg-emerald-500/10 text-emerald-400' :
                                    timerPhase === 'upcoming' ? 'bg-yellow-500/10 text-yellow-400' :
                                    'bg-slate-800 text-slate-400'
                                }`}>
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Status</p>
                                    <p className={`text-xs font-black uppercase ${
                                        timerPhase === 'live' ? 'text-emerald-400' :
                                        timerPhase === 'upcoming' ? 'text-yellow-400' :
                                        timerPhase === 'completed' ? 'text-red-400' : 'text-slate-300'
                                    }`}>
                                        {timerPhase === 'live' ? 'Live Now' :
                                         timerPhase === 'upcoming' ? 'Upcoming' :
                                         timerPhase === 'completed' ? 'Completed' : 'Active'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Registration / Sync Action Ribbon */}
                <div className="mt-4 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {isAlreadyRegistered ? (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
                                <CheckCircle size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white flex items-center gap-2">
                                    You are entered in this tournament!
                                </p>
                                <p className="text-xs font-mono text-slate-400">
                                    Tracking in-game tag: <strong className="text-yellow-400">{brawlStarsTag}</strong>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
                                <Trophy size={22} />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-white">Join the Competition</p>
                                <p className="text-xs text-slate-400">Play Brawl Stars, earn points, and climb the leaderboard!</p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        {isAlreadyRegistered ? (
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-black text-sm rounded-xl transition shadow-lg shadow-blue-600/30"
                            >
                                <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Syncing...' : 'Sync My Score'}
                            </button>
                        ) : !user ? (
                            <button
                                onClick={() => setIsLoginModalOpen(true)}
                                className="w-full sm:w-auto px-6 py-3 bg-[#5865F2] hover:bg-[#4752C4] text-white font-black text-sm rounded-xl transition shadow-lg shadow-indigo-500/30"
                            >
                                Login with Discord to Join
                            </button>
                        ) : !brawlStarsTag ? (
                            <button
                                onClick={() => setIsLinkModalOpen(true)}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-black text-sm rounded-xl transition shadow-lg shadow-yellow-500/30"
                            >
                                <Shield size={16} /> Link Player Tag to Join
                            </button>
                        ) : (
                            <button
                                onClick={handleRegister}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black text-sm rounded-xl transition shadow-lg shadow-blue-600/30"
                            >
                                {isSubmitting ? 'Entering...' : 'Join Tournament (Free)'}
                            </button>
                        )}
                    </div>
                </div>

                {syncMsg && (
                    <div className="mt-3 bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs px-4 py-2.5 rounded-xl text-center font-bold">
                        {syncMsg}
                    </div>
                )}
            </div>

            {/* LIVE COUNTDOWN TIMER (Replacing Repeat.gg Format) */}
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-500/5 rounded-full blur-3xl pointer-events-none" />

                    <div className="relative z-10 max-w-2xl mx-auto text-center">
                        {timerPhase === 'upcoming' && (
                            <>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-xs font-black uppercase tracking-wider mb-4 shadow-lg shadow-yellow-500/10">
                                    <Clock size={14} className="animate-pulse" /> Tournament Starts In
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Get Ready to Compete</h2>
                                <p className="text-xs sm:text-sm text-slate-400 mb-6">
                                    Matches will start tracking automatically once the countdown reaches zero.
                                </p>
                                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-yellow-400">
                                            {String(days).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Days</p>
                                    </div>
                                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-yellow-400">
                                            {String(hours).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Hours</p>
                                    </div>
                                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-yellow-400">
                                            {String(minutes).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Minutes</p>
                                    </div>
                                    <div className="bg-slate-950/90 border border-slate-800/90 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-yellow-400">
                                            {String(seconds).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Seconds</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {timerPhase === 'live' && (
                            <>
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-black uppercase tracking-wider mb-4 shadow-lg shadow-emerald-500/10">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                                    Tournament Live — Time Remaining
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Tournament is Live!</h2>
                                <p className="text-xs sm:text-sm text-slate-400 mb-6">
                                    Play your Brawl Stars matches now and click <strong className="text-white">Sync My Score</strong> to add your points.
                                </p>
                                <div className="grid grid-cols-4 gap-2 sm:gap-4">
                                    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">
                                            {String(days).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Days</p>
                                    </div>
                                    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">
                                            {String(hours).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Hours</p>
                                    </div>
                                    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">
                                            {String(minutes).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Minutes</p>
                                    </div>
                                    <div className="bg-slate-950/90 border border-emerald-500/30 rounded-2xl p-3 sm:p-4 shadow-inner">
                                        <span className="text-2xl sm:text-4xl font-black font-mono text-emerald-400">
                                            {String(seconds).padStart(2, '0')}
                                        </span>
                                        <p className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 mt-1">Seconds</p>
                                    </div>
                                </div>
                            </>
                        )}

                        {timerPhase === 'completed' && (
                            <div className="py-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-black uppercase tracking-wider mb-4 shadow-lg shadow-red-500/10">
                                    <CheckCircle size={14} /> Tournament Completed
                                </div>
                                <h2 className="text-2xl sm:text-4xl font-black text-white mb-2">Tournament Completed</h2>
                                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                                    The tournament window has ended. All match results, final scores, and rankings are recorded and finalized below.
                                </p>
                            </div>
                        )}

                        {timerPhase === 'open' && (
                            <div className="py-2">
                                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-wider mb-4">
                                    <Trophy size={14} /> Open Tournament
                                </div>
                                <h2 className="text-2xl sm:text-3xl font-black text-white mb-2">Tournament In Progress</h2>
                                <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
                                    Play Brawl Stars matches and sync your scores to climb the leaderboard!
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* LEADERBOARD STANDINGS (Guarantees ALL registered players appear!) */}
            <div className="max-w-6xl mx-auto px-4 mt-8 space-y-8">
                <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div>
                            <h3 className="font-black text-xl text-white flex items-center gap-2">
                                <Award size={22} className="text-yellow-500" /> Tournament Leaderboard
                                <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full font-bold ml-2">
                                    {leaderboard.length} Players
                                </span>
                            </h3>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Showing all registered players. Cumulative points from tournament matches.
                            </p>
                        </div>
                        <span className="text-xs text-emerald-400 font-mono flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Standings
                        </span>
                    </div>

                    {leaderboard.length === 0 ? (
                        <div className="p-12 text-center text-slate-500">
                            No players registered yet. Be the first to join!
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase bg-slate-950/50 text-slate-400 font-bold border-b border-slate-800">
                                    <tr>
                                        <th className="py-3.5 px-4 text-center w-16">Rank</th>
                                        <th className="py-3.5 px-4">Player</th>
                                        <th className="py-3.5 px-4 text-center">Matches Tracked</th>
                                        <th className="py-3.5 px-4 text-right">Cumulative Points</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800/60 text-sm">
                                    {leaderboard.map((row, index) => {
                                        const rank = index + 1;
                                        const isMe = brawlStarsTag && row.playerTag?.toUpperCase() === brawlStarsTag.toUpperCase();

                                        return (
                                            <tr 
                                                key={row.id || row.playerTag} 
                                                className={`hover:bg-slate-800/40 transition ${
                                                    isMe ? 'bg-blue-600/10 border-l-4 border-blue-500' : ''
                                                }`}
                                            >
                                                {/* Rank Badge */}
                                                <td className="py-4 px-4 text-center font-black">
                                                    {rank === 1 ? (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-black text-xs font-black shadow-md shadow-yellow-500/30">1</span>
                                                    ) : rank === 2 ? (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black text-xs font-black shadow-md">2</span>
                                                    ) : rank === 3 ? (
                                                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black shadow-md">3</span>
                                                    ) : (
                                                        <span className="text-slate-500 font-mono">#{rank}</span>
                                                    )}
                                                </td>

                                                {/* Player Info: Discord Username on top (bold white), Supercell Tag below (muted grey) */}
                                                <td className="py-4 px-4">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-white">
                                                            {getPlayerDiscordName(row)}
                                                        </span>
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

                                                {/* Matches Tracked */}
                                                <td className="py-4 px-4 text-center font-mono text-slate-300">
                                                    {row.matchesPlayed || 0}
                                                </td>

                                                {/* Cumulative Points */}
                                                <td className="py-4 px-4 text-right">
                                                    <span className="text-lg font-black font-mono text-yellow-400">
                                                        {(row.totalScore || 0).toLocaleString()}
                                                    </span>
                                                    <span className="text-xs text-slate-500 ml-1 font-sans">pts</span>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MY MATCHES SECTION (Personal Match Stream for Registered Players) */}
                {isAlreadyRegistered && (
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                        <div className="p-5 bg-slate-950/70 border-b border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div>
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    <Flame size={20} className="text-blue-400" /> Your Scored Matches ({myMatches.length})
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Matches played in Brawl Stars during the tournament window that contributed points to your score.
                                </p>
                            </div>
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white rounded-xl text-xs font-bold transition shadow-md"
                            >
                                <RefreshCw size={13} className={syncing ? 'animate-spin' : ''} />
                                {syncing ? 'Syncing...' : 'Sync Now'}
                            </button>
                        </div>

                        {myMatches.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                No matches logged yet. Play games in Brawl Stars, then click "Sync My Score"!
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
                                {myMatches.map((m, idx) => (
                                    <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition text-sm">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-white capitalize">{m.mode || 'Battle'}</span>
                                                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-medium">
                                                    {m.result}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1 font-mono">
                                                Match Time: {m.battleTime}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-base font-black font-mono text-emerald-400">
                                                +{m.score}
                                            </span>
                                            <span className="text-xs text-slate-500 ml-1">pts</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* SCORING RULES & GUIDELINES */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Scoring Breakdown Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-lg font-black mb-4 flex items-center gap-2 text-yellow-400">
                            <Flame size={20} /> Scoring System Breakdown
                        </h3>

                        {isRanked ? (
                            <div className="space-y-4">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <h4 className="font-bold text-purple-400 text-sm mb-2">Ranked 3v3 Sets</h4>
                                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                                        <li className="flex justify-between"><span>Match Victory</span><strong className="text-emerald-400">+100 PTS</strong></li>
                                        <li className="flex justify-between"><span>Star Player (MVP) Bonus</span><strong className="text-yellow-400">+40 PTS</strong></li>
                                        <li className="flex justify-between"><span>Fast Set Win (&lt;90s)</span><strong className="text-blue-400">+20 PTS</strong></li>
                                        <li className="flex justify-between"><span>Draw</span><strong className="text-slate-400">+35 PTS</strong></li>
                                        <li className="flex justify-between"><span>Completed Match (Defeat)</span><strong className="text-slate-500">+10 PTS</strong></li>
                                    </ul>
                                </div>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Only competitive Ranked Mode games qualify for this tournament. Trophy ladder matches are automatically filtered out.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <h4 className="font-bold text-yellow-400 text-sm mb-2">3v3 Modes (Brawl Ball, Gem Grab, etc.)</h4>
                                    <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                                        <li className="flex justify-between"><span>Match Victory</span><strong className="text-emerald-400">+100 PTS</strong></li>
                                        <li className="flex justify-between"><span>Star Player MVP</span><strong className="text-yellow-400">+40 PTS</strong></li>
                                        <li className="flex justify-between"><span>Speedrun Win (&lt;90s)</span><strong className="text-blue-400">+20 PTS</strong></li>
                                        <li className="flex justify-between"><span>Draw</span><strong className="text-slate-400">+35 PTS</strong></li>
                                        <li className="flex justify-between"><span>Defeat</span><strong className="text-slate-500">+10 PTS</strong></li>
                                    </ul>
                                </div>
                                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                    <h4 className="font-bold text-yellow-400 text-sm mb-2">Showdown Modes (Solo, Duo)</h4>
                                    <ul className="space-y-1.5 text-xs text-slate-300">
                                        <li className="flex justify-between"><span>1st Place</span><strong className="text-emerald-400">+150 PTS</strong></li>
                                        <li className="flex justify-between"><span>2nd Place</span><strong className="text-emerald-400">+110 PTS</strong></li>
                                        <li className="flex justify-between"><span>3rd Place</span><strong className="text-emerald-400">+80 PTS</strong></li>
                                        <li className="flex justify-between"><span>4th Place</span><strong className="text-slate-300">+55 PTS</strong></li>
                                        <li className="flex justify-between"><span>5th Place</span><strong className="text-slate-400">+35 PTS</strong></li>
                                    </ul>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Prize Pool Distribution Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col justify-between">
                        <div>
                            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                                <h3 className="text-lg font-black text-white flex items-center gap-2">
                                    <Gift className="text-yellow-500" size={20} /> Prize Pool Distribution
                                </h3>
                                <span className="text-xl font-black font-mono text-yellow-400">
                                    ₹{tournament.prizePool || 5000}
                                </span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <div className="bg-gradient-to-b from-yellow-500/20 to-slate-950 border border-yellow-500/40 rounded-xl p-3.5 text-center">
                                    <span className="text-2xl">🥇</span>
                                    <p className="font-black text-yellow-400 text-sm mt-1">1st Place</p>
                                    <p className="text-lg font-black text-white font-mono mt-0.5">₹{Math.round((tournament.prizePool || 5000) * 0.5)}</p>
                                    <p className="text-[10px] text-slate-400">50%</p>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
                                    <span className="text-2xl">🥈</span>
                                    <p className="font-black text-slate-300 text-sm mt-1">2nd Place</p>
                                    <p className="text-lg font-black text-white font-mono mt-0.5">₹{Math.round((tournament.prizePool || 5000) * 0.3)}</p>
                                    <p className="text-[10px] text-slate-400">30%</p>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-center">
                                    <span className="text-2xl">🥉</span>
                                    <p className="font-black text-amber-600 text-sm mt-1">3rd Place</p>
                                    <p className="text-lg font-black text-white font-mono mt-0.5">₹{Math.round((tournament.prizePool || 5000) * 0.2)}</p>
                                    <p className="text-[10px] text-slate-400">20%</p>
                                </div>
                            </div>
                        </div>

                        {tournament.description && (
                            <div className="mt-4 pt-3 border-t border-slate-800 text-xs text-slate-400 leading-relaxed whitespace-pre-wrap">
                                <strong className="text-slate-300 block mb-1">Tournament Rules:</strong>
                                {tournament.description}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
            <LinkBrawlStarsModal 
                isOpen={isLinkModalOpen} 
                onClose={() => setIsLinkModalOpen(false)}
                user={user}
                onLinked={(data) => {
                    setBrawlStarsTag(data.tag);
                    setBrawlStarsName(data.name);
                }}
            />
        </div>
    );
};

export default TournamentOverview;