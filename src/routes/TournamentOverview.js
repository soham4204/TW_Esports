import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import { auth, db } from '../firebase-config';
import { Trophy, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';

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
    
    // Auth States
    const [user, setUser] = useState(null);
    const [discordProfile, setDiscordProfile] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    // Track Authentication State
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(currentUser => {
            setUser(currentUser);
            if (currentUser) {
                const cachedProfile = localStorage.getItem('discordUser');
                if (cachedProfile) {
                    setDiscordProfile(JSON.parse(cachedProfile));
                }
            } else {
                setDiscordProfile(null);
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

    // Check if the current user is already registered in this tournament
    useEffect(() => {
        if (!user || !id) {
            setIsAlreadyRegistered(false);
            return;
        }

        const checkRegistration = async () => {
            try {
                // Query teams subcollection where the doc ID or a specific field matches the user
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

        if (!tournament) return;
        
        setIsSubmitting(true);
        setErrorMessage('');
        
        try {
            // Using the user's UID as the document ID to prevent duplicate registrations
            await db.collection('tournaments').doc(id).collection('teams').doc(user.uid).set({
                teamName: discordProfile.username, // Automatically use their Discord Name
                discordId: discordProfile.discordId || null,
                avatar: discordProfile.avatar || null,
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            // Also keep track of the registration globally on the user document (optional ease of access)
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

    return (
        <div className="min-h-screen bg-slate-950 text-white pb-12">
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
                                <span className="bg-blue-600 px-3 py-1 md:px-4 rounded-full text-xs md:text-sm font-bold inline-block">{tournament.type} Mode</span>
                            </div>
                            <div className="md:text-right bg-slate-800/50 md:bg-transparent p-4 md:p-0 rounded-xl border border-slate-700 md:border-none">
                                <p className="text-slate-400 text-xs md:text-sm uppercase font-bold tracking-widest">Available Slots</p>
                                <p className="text-3xl font-black text-blue-500">{Math.max(0, tournament.slots - registeredTeams)} / {tournament.slots}</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
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
                                    <div className="flex justify-between"><span>Status</span><span className="text-green-400 font-bold">Registration Open</span></div>
                                    <div className="flex justify-between"><span>Platform</span><span className="text-white">Brawl Stars</span></div>
                                    <div className="flex justify-between"><span>Region</span><span className="text-white">Global</span></div>
                                </div>
                            </div>
                        </div>

                        {errorMessage && (
                            <div className="mb-8 bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3">
                                <AlertCircle size={20} className="text-red-400 flex-shrink-0" />
                                <p className="text-red-300">{errorMessage}</p>
                            </div>
                        )}

                        {!successMessage && (
                            <section className="border-t border-slate-800 pt-8 md:pt-12">
                                <h2 className="text-xl md:text-2xl font-black mb-6 md:mb-8 text-center uppercase tracking-tight">Register for Tournament</h2>
                                {isAlreadyRegistered ? (
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-6 md:p-8 rounded-2xl text-center">
                                        <CheckCircle size={48} className="mx-auto text-blue-400 mb-4" />
                                        <p className="text-lg md:text-xl font-bold">Already Registered</p>
                                        <p className="text-slate-400 mt-2 text-sm md:text-base">Check your status in "My Tournaments"</p>
                                    </div>
                                ) : !user ? (
                                    <div className="max-w-xl mx-auto space-y-4 md:space-y-6 bg-slate-800/20 p-6 md:p-8 rounded-2xl border border-slate-800 text-center">
                                        <AlertCircle className="mx-auto h-12 w-12 text-indigo-400 mb-4" />
                                        <h3 className="text-xl font-bold mb-2">Login Required</h3>
                                        <p className="text-slate-400 mb-6">You must link your Discord in order to register for tournaments.</p>
                                        <button 
                                            onClick={() => setIsLoginModalOpen(true)}
                                            className="w-full bg-[#5865F2] hover:bg-[#4752C4] text-white py-4 rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-indigo-500/20">
                                            Login with Discord
                                        </button>
                                    </div>
                                ) : (
                                    <div className="max-w-xl mx-auto space-y-6 bg-slate-800/20 p-8 rounded-2xl border border-slate-800">
                                        <div className="flex items-center gap-4 bg-slate-900 p-4 rounded-xl border border-slate-700">
                                            <img src={discordProfile?.avatar} alt="Discord Avatar" className="w-12 h-12 rounded-full border border-indigo-500" />
                                            <div>
                                                <p className="text-sm text-slate-400 uppercase tracking-widest font-bold">Registering As</p>
                                                <p className="text-xl font-bold">{discordProfile?.username}</p>
                                            </div>
                                        </div>
                                        <button 
                                            onClick={handleRegister} 
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed py-4 rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-blue-500/20">
                                            {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                                        </button>
                                    </div>
                                )}
                            </section>
                        )}

                        {successMessage && (
                            <div className="mt-8 md:mt-12 text-center p-8 md:p-12 bg-green-500/10 rounded-2xl border border-green-500/20">
                                {showAd ? (
                                    <div className="py-4">
                                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
                                        <p className="text-lg md:text-xl font-bold text-green-400">Success! Preparing your link...</p>
                                        <p className="text-slate-400 mt-2 font-mono text-sm">{timeLeft}s remaining</p>
                                    </div>
                                ) : (
                                    <div className="animate-in fade-in zoom-in duration-500">
                                        <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
                                        <h2 className="text-2xl md:text-3xl font-black mb-6">Registration Complete!</h2>
                                        <a href={tournament.discordlink} target="_blank" rel="noopener noreferrer" className="inline-block bg-[#5865F2] hover:bg-[#4752C4] shadow-lg shadow-[#5865F2]/20 px-8 py-4 rounded-xl font-black text-lg transition-all w-full md:w-auto">Join Discord to Play</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default TournamentOverview;