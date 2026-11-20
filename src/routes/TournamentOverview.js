import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from '../firebase-config';
import { Trophy, CheckCircle, ArrowLeft, AlertCircle, Shield, Swords } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import LeaderboardTable from '../components/LeaderboardTable';
import LinkBrawlStarsModal from '../components/LinkBrawlStarsModal';

const TournamentOverview = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [tournament, setTournament] = useState(null);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [registeredTeams, setRegisteredTeams] = useState(0);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [showAd, setShowAd] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Auth & Brawl Stars Profile States
    const [user, setUser] = useState(null);
    const [discordProfile, setDiscordProfile] = useState(null);
    const [brawlStarsTag, setBrawlStarsTag] = useState('');
    const [brawlStarsName, setBrawlStarsName] = useState('');
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

    // Track Authentication & Linked Brawl Stars Tag
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async currentUser => {
            setUser(currentUser);
            if (currentUser) {
                const cachedProfile = localStorage.getItem('discordUser');
                if (cachedProfile) {
                    setDiscordProfile(JSON.parse(cachedProfile));
                }

                // Fetch linked Brawl Stars tag from Firestore
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

    // Fetch Tournament Data
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

        const unsubscribe = db.collection('tournaments').doc(id).collection('teams')
            .onSnapshot(snap => setRegisteredTeams(snap.size), err => console.error(err));
        return () => unsubscribe();
    }, [id]);

    // Check if current user is already registered
    useEffect(() => {
        if (!user || !id) {
            setIsAlreadyRegistered(false);
            return;
        }

        const checkRegistration = async () => {
            try {
                const registrationDoc = await db.collection('tournaments').doc(id)
                                              .collection('teams').doc(user.uid).get();
                setIsAlreadyRegistered(registrationDoc.exists);
            } catch (err) {
                console.error("Error checking registration status:", err);
            }
        };

        checkRegistration();
    }, [user, id]);

    // Ad Timer Logic
    useEffect(() => {
        if (!showAd) return;
        if (timeLeft > 0) {
            const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
            return () => clearInterval(timer);
        } else {
            setShowAd(false);
            setTimeLeft(5);
        }
    }, [showAd, timeLeft]);

    const handleRegister = async (e) => {
        if (e) e.preventDefault();
        
        if (!user || !discordProfile) {
            setIsLoginModalOpen(true);
            return;
        }

        if (!brawlStarsTag) {
            setIsLinkModalOpen(true);
            return;
        }

        if (!tournament) return;
        
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

            // Initialize on leaderboard
            await db.collection('tournaments').doc(id).collection('leaderboard').doc(brawlStarsTag).set({
                playerTag: brawlStarsTag,
                playerName: brawlStarsName || discordProfile.username,
                totalScore: 0,
                matchesPlayed: 0,
                lastSyncedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            await db.collection('users').doc(user.uid).collection('myTournaments').doc(id).set({
                joinedAt: firebase.firestore.FieldValue.serverTimestamp(),
                tournamentId: id
            });
            
            setSuccessMessage('Registration Successful!');
            setIsAlreadyRegistered(true);
            setShowAd(true);
            setTimeLeft(5);
        } catch (err) {
            setErrorMessage(err.message || 'Registration failed. Please try again.');
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
            Loading...
        </div>
    );

    if (!tournament) return (
        <div className="min-h-screen bg-slate-950 text-white">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 mt-8">
                <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6">
                    <ArrowLeft size={20} /> Back to Tournaments
                </button>
                <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-2xl text-center">
                    <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
                    <p className="text-xl font-bold">{errorMessage || 'Tournament not found'}</p>
                </div>
            </div>
        </div>
    );

    const isRankedCategory = tournament.category === 'ranked';

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-16">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 mt-4 md:mt-8">
                <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-4 md:mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Tournaments
                </button>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                    <img src={tournament.thumbnail} alt={tournament.name} className="w-full h-48 md:h-64 object-cover" />
                    
                    <div className="p-4 md:p-8">
                        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4 mb-8">
                            <div>
                                <h1 className="text-3xl md:text-4xl font-black mb-2 tracking-tight">{tournament.name}</h1>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="bg-blue-600 px-3 py-1 rounded-full text-xs font-bold inline-block">
                                        {tournament.type} Mode
                                    </span>
                                    <span className={`text-xs px-3 py-1 rounded-full font-bold flex items-center gap-1 ${
                                        isRankedCategory 
                                            ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40' 
                                            : 'bg-yellow-600/30 text-yellow-300 border border-yellow-500/40'
                                    }`}>
                                        {isRankedCategory ? <Swords size={12} /> : <Trophy size={12} />}
                                        {isRankedCategory ? 'Ranked Mode Tournament' : 'Trophy Ladder Tournament'}
                                    </span>
                                </div>
                            </div>
                            <div className="md:text-right bg-slate-800/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-slate-700 md:border-none">
                                <p className="text-slate-400 text-xs md:text-sm uppercase font-bold tracking-widest">Available Slots</p>
                                <p className="text-3xl font-black text-blue-500">{Math.max(0, tournament.slots - registeredTeams)} / {tournament.slots}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                            <div className="md:col-span-2">
                                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                                    <Trophy size={24} className="text-yellow-500" /> Tournament Description
                                </h3>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800/50 p-6 rounded-xl border border-slate-800">
                                    {tournament.description}
                                </p>
                            </div>
                            
                            <div className="bg-slate-800/30 p-6 rounded-xl border border-slate-800">
                                <h3 className="font-bold mb-4 text-slate-400 uppercase text-xs tracking-widest">Tournament Info</h3>
                                <div className="space-y-4 text-sm">
                                    <div className="flex justify-between">
                                        <span>Status</span>
                                        <span className="text-green-400 font-bold">Registration Open</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Game Mode</span>
                                        <span className="text-yellow-400 font-bold capitalize">
                                            {isRankedCategory ? 'Competitive Ranked' : 'Trophy Ladder'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Platform</span>
                                        <span className="text-white">Brawl Stars</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Scoring</span>
                                        <span className="text-blue-400 font-bold">Full Cumulative</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                                <p className="text-red-300">{errorMessage}</p>
                            </div>
                        )}

                        {/* Registration Section */}
                        {!successMessage && (
                            <section className="border-t border-slate-800 pt-8 mb-8">
                                <h2 className="text-xl md:text-2xl font-black mb-6 text-center uppercase tracking-tight">Register for Tournament</h2>
                                {isAlreadyRegistered ? (
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 rounded-2xl text-center">
                                        <CheckCircle size={44} className="mx-auto text-blue-400 mb-3" />
                                        <p className="text-lg font-bold">You are Registered!</p>
                                        <p className="text-slate-400 mt-1 text-sm font-mono">
                                            Tracking Tag: <strong className="text-yellow-400">{brawlStarsTag}</strong>
                                        </p>
                                    </div>
                                ) : !user ? (
                                    <div className="max-w-xl mx-auto space-y-4 bg-slate-800/20 p-6 rounded-2xl border border-slate-800 text-center">
                                        <AlertCircle className="mx-auto h-12 w-12 text-indigo-400 mb-3" />
                                        <h3 className="text-xl font-bold mb-1">Login Required</h3>
                                        <p className="text-slate-400 text-sm mb-4">You must link your Discord in order to register for tournaments.</p>
                                        <button 
                                            onClick={() => setIsLoginModalOpen(true)}
                                            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-3.5 rounded-xl font-black text-lg transition shadow-lg shadow-indigo-500/20">
                                            Login with Discord
                                        </button>
                                    </div>
                                ) : !brawlStarsTag ? (
                                    <div className="max-w-xl mx-auto space-y-4 bg-yellow-500/10 p-6 rounded-2xl border border-yellow-500/30 text-center">
                                        <Shield className="mx-auto h-12 w-12 text-yellow-400 mb-2" />
                                        <h3 className="text-xl font-bold mb-1 text-yellow-300">Link Brawl Stars Tag Required</h3>
                                        <p className="text-slate-300 text-sm mb-4">
                                            To track your match points automatically, link your in-game Player Tag.
                                        </p>
                                        <button
                                            onClick={() => setIsLinkModalOpen(true)}
                                            className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-3.5 rounded-xl font-black text-lg transition shadow-lg shadow-yellow-500/20"
                                        >
                                            Link My Player Tag (#TAG)
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto space-y-5 bg-slate-800/20 p-6 rounded-2xl border border-slate-800">
                                        <div className="flex items-center justify-between bg-slate-900 p-4 rounded-xl border border-slate-700">
                                            <div>
                                                <p className="text-xs text-slate-400 uppercase tracking-widest font-bold">Registering With</p>
                                                <p className="text-lg font-black text-white">{brawlStarsName || discordProfile?.username}</p>
                                                <p className="text-xs font-mono text-yellow-400 font-bold">{brawlStarsTag}</p>
                                            </div>
                                            <button 
                                                onClick={() => setIsLinkModalOpen(true)}
                                                className="text-xs text-blue-400 hover:underline font-bold"
                                            >
                                                Change Tag
                                            </button>
                                        </div>
                                        <button 
                                            onClick={handleRegister} 
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 py-3.5 rounded-xl font-black text-lg transition shadow-lg shadow-blue-500/20">
                                            {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {successMessage && (
                            <div className="mt-8 text-center p-8 bg-green-500/10 rounded-2xl border border-green-500/20">
                                <CheckCircle size={48} className="mx-auto text-green-400 mb-3" />
                                <h2 className="text-2xl font-black mb-2">Registration Complete!</h2>
                                <p className="text-slate-300 text-sm mb-4">
                                    Play your matches in Brawl Stars. Every match during the tournament will automatically add points!
                                </p>
                            </div>
                        )}

                        {/* LIVE LEADERBOARD */}
                        <LeaderboardTable
                            tournamentId={id}
                            tournamentCategory={tournament.category || 'trophy'}
                            currentPlayerTag={brawlStarsTag}
                        />
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
