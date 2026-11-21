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
  ScrollText, 
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
    
    // Active Tab: 'leaderboard' | 'matches' | 'rules' | 'prizes'
    const [activeTab, setActiveTab] = useState('leaderboard');

    // Auth & Brawl Stars Profile
    const [user, setUser] = useState(null);
    const [discordProfile, setDiscordProfile] = useState(null);
    const [brawlStarsTag, setBrawlStarsTag] = useState('');
    const [brawlStarsName, setBrawlStarsName] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Leaderboard state
    const [leaderboard, setLeaderboard] = useState([]);
    const [teamsMap, setTeamsMap] = useState({});
    const [syncing, setSyncing] = useState(false);
    const [syncMsg, setSyncMsg] = useState('');

    // Personal match history
    const [myMatches, setMyMatches] = useState([]);

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

    // Fetch Tournament Details
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

        const unsubscribeTeams = db.collection('tournaments').doc(id).collection('teams')
            .onSnapshot(snap => {
                setRegisteredTeams(snap.size);
                const map = {};
                snap.forEach(doc => {
                    const data = doc.data();
                    if (data.playerTag) {
                        const clean = data.playerTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
                        map[clean] = data.discordUsername || data.discordId || data.teamName || data.brawlStarsName;
                    }
                });
                setTeamsMap(map);
            }, err => console.error(err));

        // Real-time Leaderboard Listener
        const unsubscribeLeaderboard = db.collection('tournaments').doc(id).collection('leaderboard')
            .orderBy('totalScore', 'desc')
            .onSnapshot(snap => {
                const list = [];
                snap.forEach(d => list.push({ id: d.id, ...d.data() }));
                setLeaderboard(list);
            }, err => console.error(err));

        return () => {
            unsubscribeTeams();
            unsubscribeLeaderboard();
        };
    }, [id]);

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

    // Get formatted display name: Discord username on top, not Supercell tag
    const getPlayerDisplayName = (row) => {
        if (!row) return 'Player';
        if (row.discordUsername && !row.discordUsername.startsWith('#')) {
            return row.discordUsername;
        }
        const cleanTag = (row.playerTag || row.id || '').toUpperCase().replace(/[^0-9A-Z]/g, '');
        if (cleanTag && teamsMap[cleanTag] && !teamsMap[cleanTag].startsWith('#')) {
            return teamsMap[cleanTag];
        }
        const isMe = brawlStarsTag && cleanTag === brawlStarsTag.toUpperCase().replace(/[^0-9A-Z]/g, '');
        if (isMe && discordProfile?.username) {
            return discordProfile.username;
        }
        if (row.playerName && row.playerName !== row.playerTag && !row.playerName.startsWith('#')) {
            return row.playerName;
        }
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
    const top1 = leaderboard[0];
    const top2 = leaderboard[1];
    const top3 = leaderboard[2];

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-24 font-poppins">
            <Navbar />

            {/* Back Button */}
            <div className="max-w-6xl mx-auto px-4 pt-4">
                <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-400 hover:text-white transition text-sm">
                    <ArrowLeft size={16} /> Back to Tournaments
                </button>
            </div>

            {/* 1. REPEAT.GG STYLE HERO HEADER */}
            <div className="max-w-6xl mx-auto px-4 mt-4">
                <div className="relative rounded-3xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
                    {/* Background Banner with Gradient */}
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
                            <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-black uppercase tracking-wider">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Live Tournament
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
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Players</p>
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
                                <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
                                    <Clock size={20} />
                                </div>
                                <div>
                                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">Format</p>
                                    <p className="text-xs font-black text-emerald-400 uppercase">Repeat.gg</p>
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

            {/* 2. REPEAT.GG STYLE TABS */}
            <div className="max-w-6xl mx-auto px-4 mt-8">
                <div className="flex items-center gap-2 border-b border-slate-800 overflow-x-auto pb-1 no-scrollbar">
                    <button
                        onClick={() => setActiveTab('leaderboard')}
                        className={`flex items-center gap-2 px-5 py-3 font-black text-sm rounded-t-xl transition whitespace-nowrap ${
                            activeTab === 'leaderboard'
                                ? 'bg-slate-900 text-yellow-400 border-t-2 border-x border-slate-800 border-t-yellow-400 shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                    >
                        <Trophy size={16} /> Leaderboard
                    </button>

                    {isAlreadyRegistered && (
                        <button
                            onClick={() => setActiveTab('matches')}
                            className={`flex items-center gap-2 px-5 py-3 font-black text-sm rounded-t-xl transition whitespace-nowrap ${
                                activeTab === 'matches'
                                    ? 'bg-slate-900 text-blue-400 border-t-2 border-x border-slate-800 border-t-blue-400 shadow-lg'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                            }`}
                        >
                            <Flame size={16} /> My Matches ({myMatches.length})
                        </button>
                    )}

                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`flex items-center gap-2 px-5 py-3 font-black text-sm rounded-t-xl transition whitespace-nowrap ${
                            activeTab === 'rules'
                                ? 'bg-slate-900 text-white border-t-2 border-x border-slate-800 border-t-blue-500 shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                    >
                        <ScrollText size={16} /> Scoring & Rules
                    </button>

                    <button
                        onClick={() => setActiveTab('prizes')}
                        className={`flex items-center gap-2 px-5 py-3 font-black text-sm rounded-t-xl transition whitespace-nowrap ${
                            activeTab === 'prizes'
                                ? 'bg-slate-900 text-yellow-400 border-t-2 border-x border-slate-800 border-t-yellow-400 shadow-lg'
                                : 'text-slate-400 hover:text-white hover:bg-slate-900/50'
                        }`}
                    >
                        <Gift size={16} /> Prizes
                    </button>
                </div>

                {/* TAB 1: LEADERBOARD WITH PODIUM */}
                {activeTab === 'leaderboard' && (
                    <div className="mt-6 space-y-8 animate-in fade-in">
                        {/* REPEAT.GG SIGNATURE TOP 3 PODIUM */}
                        {leaderboard.length >= 2 && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end max-w-4xl mx-auto pt-4">
                                {/* 2nd Place Podium */}
                                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 text-center order-2 md:order-1 shadow-lg">
                                    <div className="w-12 h-12 rounded-full bg-slate-300 text-slate-950 font-black text-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                                        2
                                    </div>
                                    <p className="text-xs uppercase font-bold text-slate-400 tracking-wider">2nd Place</p>
                                    <p className="text-lg font-black text-white truncate mt-1">{top2 ? getPlayerDisplayName(top2) : '-'}</p>
                                    <p className="text-xs font-mono text-slate-400">{top2?.playerTag}</p>
                                    <div className="mt-3 bg-slate-950 py-2 px-3 rounded-xl border border-slate-800">
                                        <span className="text-xl font-black font-mono text-slate-200">{(top2?.totalScore || 0).toLocaleString()}</span>
                                        <span className="text-xs text-slate-400 ml-1">pts</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 font-bold">Prize: ₹{Math.round((tournament.prizePool || 5000) * 0.3)}</p>
                                </div>

                                {/* 1st Place Champion Podium (Elevated) */}
                                <div className="bg-gradient-to-b from-yellow-500/20 via-slate-900 to-slate-900 border-2 border-yellow-500/60 rounded-2xl p-6 text-center order-1 md:order-2 shadow-2xl shadow-yellow-500/10 md:-translate-y-4">
                                    <div className="w-16 h-16 rounded-full bg-yellow-400 text-black font-black text-2xl flex items-center justify-center mx-auto mb-2 shadow-xl shadow-yellow-500/40 border-2 border-yellow-300">
                                        👑
                                    </div>
                                    <p className="text-xs uppercase font-black text-yellow-400 tracking-widest">1st Champion</p>
                                    <p className="text-xl font-black text-white truncate mt-1">{top1 ? getPlayerDisplayName(top1) : 'Leader'}</p>
                                    <p className="text-xs font-mono text-yellow-400/80">{top1?.playerTag}</p>
                                    <div className="mt-3 bg-slate-950 py-2.5 px-3 rounded-xl border border-yellow-500/30">
                                        <span className="text-2xl font-black font-mono text-yellow-400">{(top1?.totalScore || 0).toLocaleString()}</span>
                                        <span className="text-xs text-yellow-500 ml-1 font-bold">pts</span>
                                    </div>
                                    <p className="text-sm font-black text-yellow-400 mt-2">Prize: ₹{Math.round((tournament.prizePool || 5000) * 0.5)}</p>
                                </div>

                                {/* 3rd Place Podium */}
                                <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-5 text-center order-3 shadow-lg">
                                    <div className="w-12 h-12 rounded-full bg-amber-700 text-white font-black text-lg flex items-center justify-center mx-auto mb-2 shadow-md">
                                        3
                                    </div>
                                    <p className="text-xs uppercase font-bold text-amber-500 tracking-wider">3rd Place</p>
                                    <p className="text-lg font-black text-white truncate mt-1">{top3 ? getPlayerDisplayName(top3) : '-'}</p>
                                    <p className="text-xs font-mono text-slate-400">{top3?.playerTag}</p>
                                    <div className="mt-3 bg-slate-950 py-2 px-3 rounded-xl border border-slate-800">
                                        <span className="text-xl font-black font-mono text-amber-500">{(top3?.totalScore || 0).toLocaleString()}</span>
                                        <span className="text-xs text-slate-400 ml-1">pts</span>
                                    </div>
                                    <p className="text-xs text-slate-400 mt-2 font-bold">Prize: ₹{Math.round((tournament.prizePool || 5000) * 0.2)}</p>
                                </div>
                            </div>
                        )}

                        {/* Full Standings Table */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-4 bg-slate-950/60 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-black text-lg text-white flex items-center gap-2">
                                    <Award size={20} className="text-yellow-500" /> Full Standings ({leaderboard.length})
                                </h3>
                                <span className="text-xs text-slate-400 font-mono">Live Firestore Updates</span>
                            </div>

                            {leaderboard.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    No matches logged yet. Play games in Brawl Stars and click "Sync My Score"!
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
                                                const isMe = brawlStarsTag && row.playerTag?.toUpperCase() === brawlStarsTag.toUpperCase();

                                                return (
                                                    <tr 
                                                        key={row.id} 
                                                        className={`hover:bg-slate-800/40 transition ${
                                                            isMe ? 'bg-blue-600/10 border-l-4 border-blue-500' : ''
                                                        }`}
                                                    >
                                                        <td className="py-4 px-4 text-center font-black">
                                                            {rank === 1 ? (
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500 text-black text-xs font-black">1</span>
                                                            ) : rank === 2 ? (
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-300 text-black text-xs font-black">2</span>
                                                            ) : rank === 3 ? (
                                                                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700 text-white text-xs font-black">3</span>
                                                            ) : (
                                                                <span className="text-slate-500">#{rank}</span>
                                                            )}
                                                        </td>
                                                        <td className="py-4 px-4">
                                                            <div className="font-bold flex items-center gap-2">
                                                                <span className="font-bold text-white">{getPlayerDisplayName(row)}</span>
                                                                {isMe && (
                                                                    <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded font-mono font-bold">YOU</span>
                                                                )}
                                                            </div>
                                                            <div className="text-xs font-mono text-slate-400">{row.playerTag}</div>
                                                        </td>
                                                        <td className="py-4 px-4 text-center font-mono text-slate-300">
                                                            {row.matchesPlayed || 0}
                                                        </td>
                                                        <td className="py-4 px-4 text-right">
                                                            <span className="text-lg font-black font-mono text-yellow-400">
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
                    </div>
                )}

                {/* TAB 2: MY MATCHES (PERSONAL STREAM) */}
                {activeTab === 'matches' && isAlreadyRegistered && (
                    <div className="mt-6 space-y-6 animate-in fade-in">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                                <p className="text-xs uppercase text-slate-400 font-bold">My Rank</p>
                                <p className="text-2xl font-black text-yellow-400 mt-1 font-mono">
                                    #{leaderboard.findIndex(r => r.playerTag?.toUpperCase() === brawlStarsTag.toUpperCase()) + 1 || '-'}
                                </p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                                <p className="text-xs uppercase text-slate-400 font-bold">Total Points</p>
                                <p className="text-2xl font-black text-white mt-1 font-mono">
                                    {(leaderboard.find(r => r.playerTag?.toUpperCase() === brawlStarsTag.toUpperCase())?.totalScore || 0).toLocaleString()}
                                </p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                                <p className="text-xs uppercase text-slate-400 font-bold">Matches Logged</p>
                                <p className="text-2xl font-black text-blue-400 mt-1 font-mono">
                                    {myMatches.length}
                                </p>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl text-center">
                                <p className="text-xs uppercase text-slate-400 font-bold">Action</p>
                                <button
                                    onClick={handleSync}
                                    disabled={syncing}
                                    className="mt-1 w-full py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                                >
                                    <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
                                    {syncing ? 'Syncing...' : 'Sync Now'}
                                </button>
                            </div>
                        </div>

                        {/* Scored Matches Stream */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
                            <div className="p-4 bg-slate-950/60 border-b border-slate-800">
                                <h3 className="font-black text-lg text-white">Your Tournament Matches</h3>
                                <p className="text-xs text-slate-400">All games played during the tournament window that added points to your score</p>
                            </div>

                            {myMatches.length === 0 ? (
                                <div className="p-12 text-center text-slate-500">
                                    No matches logged yet. Play games in Brawl Stars, then click "Sync My Score"!
                                </div>
                            ) : (
                                <div className="divide-y divide-slate-800/60">
                                    {myMatches.map((m, idx) => (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-800/30 transition">
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
                                                <span className="text-lg font-black font-mono text-emerald-400">
                                                    +{m.score}
                                                </span>
                                                <span className="text-xs text-slate-500 ml-1">pts</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* TAB 3: SCORING & RULES */}
                {activeTab === 'rules' && (
                    <div className="mt-6 space-y-6 animate-in fade-in">
                        {/* Repeat.gg Scoring Card */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-xl font-black mb-4 flex items-center gap-2 text-yellow-400">
                                <Flame size={22} /> Repeat.gg Style Scoring Breakdown
                            </h3>

                            {isRanked ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <h4 className="font-bold text-purple-400 mb-2">Ranked 3v3 Sets</h4>
                                        <ul className="space-y-2 text-sm text-slate-300">
                                            <li className="flex justify-between"><span>Match Victory</span><strong className="text-emerald-400">+100 PTS</strong></li>
                                            <li className="flex justify-between"><span>Star Player (MVP) Bonus</span><strong className="text-yellow-400">+40 PTS</strong></li>
                                            <li className="flex justify-between"><span>Fast Set Win (&lt;90s)</span><strong className="text-blue-400">+20 PTS</strong></li>
                                            <li className="flex justify-between"><span>Draw</span><strong className="text-slate-400">+35 PTS</strong></li>
                                            <li className="flex justify-between"><span>Completed Match (Defeat)</span><strong className="text-slate-500">+10 PTS</strong></li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <h4 className="font-bold text-purple-400 mb-2">Ranked Eligibility</h4>
                                        <p className="text-xs text-slate-400 leading-relaxed">
                                            Only competitive Ranked Mode games (Draft / Solo Ranked / Team Ranked) qualify for this tournament. Trophy ladder matches are automatically filtered out.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <h4 className="font-bold text-yellow-400 mb-2">3v3 Modes (Brawl Ball, Gem Grab, etc.)</h4>
                                        <ul className="space-y-2 text-sm text-slate-300">
                                            <li className="flex justify-between"><span>Match Victory</span><strong className="text-emerald-400">+100 PTS</strong></li>
                                            <li className="flex justify-between"><span>Star Player MVP</span><strong className="text-yellow-400">+40 PTS</strong></li>
                                            <li className="flex justify-between"><span>Speedrun Win (&lt;90s)</span><strong className="text-blue-400">+20 PTS</strong></li>
                                            <li className="flex justify-between"><span>Draw</span><strong className="text-slate-400">+35 PTS</strong></li>
                                            <li className="flex justify-between"><span>Defeat</span><strong className="text-slate-500">+10 PTS</strong></li>
                                        </ul>
                                    </div>
                                    <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                                        <h4 className="font-bold text-yellow-400 mb-2">Showdown Modes (Solo, Duo)</h4>
                                        <ul className="space-y-2 text-sm text-slate-300">
                                            <li className="flex justify-between"><span>1st Place</span><strong className="text-emerald-400">+150 PTS</strong></li>
                                            <li className="flex justify-between"><span>2nd Place</span><strong className="text-emerald-400">+110 PTS</strong></li>
                                            <li className="flex justify-between"><span>3rd Place</span><strong className="text-emerald-400">+80 PTS</strong></li>
                                            <li className="flex justify-between"><span>4th Place</span><strong className="text-slate-300">+55 PTS</strong></li>
                                            <li className="flex justify-between"><span>5th Place</span><strong className="text-slate-400">+35 PTS</strong></li>
                                            <li className="flex justify-between"><span>Trophies Gained</span><strong className="text-yellow-400">+1 PT per trophy</strong></li>
                                        </ul>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Tournament Description & Rules */}
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                            <h3 className="text-xl font-black mb-3 text-white">General Rules & Guidelines</h3>
                            <div className="text-sm text-slate-300 leading-relaxed space-y-3 whitespace-pre-wrap">
                                {tournament.description}
                            </div>
                        </div>
                    </div>
                )}

                {/* TAB 4: PRIZES */}
                {activeTab === 'prizes' && (
                    <div className="mt-6 space-y-6 animate-in fade-in">
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                                <div>
                                    <h3 className="text-2xl font-black text-white flex items-center gap-2">
                                        <Gift className="text-yellow-500" size={26} /> Prize Pool Distribution
                                    </h3>
                                    <p className="text-xs text-slate-400 mt-1">Total Pool: ₹{tournament.prizePool || 5000} INR</p>
                                </div>
                                <span className="text-2xl font-black font-mono text-yellow-400">
                                    ₹{tournament.prizePool || 5000}
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                                <div className="bg-gradient-to-b from-yellow-500/20 to-slate-950 border border-yellow-500/40 rounded-2xl p-5 text-center">
                                    <span className="text-3xl">🥇</span>
                                    <p className="font-black text-yellow-400 text-lg mt-2">1st Place</p>
                                    <p className="text-2xl font-black text-white font-mono mt-1">₹{Math.round((tournament.prizePool || 5000) * 0.5)}</p>
                                    <p className="text-xs text-slate-400 mt-1">50% of Prize Pool</p>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center">
                                    <span className="text-3xl">🥈</span>
                                    <p className="font-black text-slate-300 text-lg mt-2">2nd Place</p>
                                    <p className="text-2xl font-black text-white font-mono mt-1">₹{Math.round((tournament.prizePool || 5000) * 0.3)}</p>
                                    <p className="text-xs text-slate-400 mt-1">30% of Prize Pool</p>
                                </div>

                                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 text-center">
                                    <span className="text-3xl">🥉</span>
                                    <p className="font-black text-amber-600 text-lg mt-2">3rd Place</p>
                                    <p className="text-2xl font-black text-white font-mono mt-1">₹{Math.round((tournament.prizePool || 5000) * 0.2)}</p>
                                    <p className="text-xs text-slate-400 mt-1">20% of Prize Pool</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
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
