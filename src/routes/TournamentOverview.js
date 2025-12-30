import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase-config';
import firebase from 'firebase/compat/app';
import { Trophy, CheckCircle, ArrowLeft, AlertCircle } from 'lucide-react';
import Navbar from '../components/Navbar';

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
    const [userTeamName, setUserTeamName] = useState('');

    // Fetch Tournament Data
    useEffect(() => {
        const fetchTournament = async () => {
            try {
                const doc = await db.collection('tournaments').doc(id).get();
                if (doc.exists) {
                    setTournament({ id: doc.id, ...doc.data() });
                    const localRegs = JSON.parse(localStorage.getItem('myRegistrations') || '[]');
                    setIsAlreadyRegistered(localRegs.includes(doc.id));
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
        e.preventDefault();
        if (!tournament || !userTeamName) return;
        
        setIsSubmitting(true);
        setErrorMessage('');
        
        try {
            await db.collection('tournaments').doc(id).collection('teams').add({
                teamName: userTeamName,
                registeredAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            const localRegs = JSON.parse(localStorage.getItem('myRegistrations') || '[]');
            localStorage.setItem('myRegistrations', JSON.stringify([...localRegs, id]));
            
            setSuccessMessage('Registration Successful!');
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
            <div className="max-w-4xl mx-auto px-4 mt-8">
                <button onClick={() => navigate('/home')} className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors">
                    <ArrowLeft size={20} /> Back to Tournaments
                </button>

                <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
                    <img src={tournament.thumbnail} alt={tournament.name} className="w-full h-64 object-cover" />
                    
                    <div className="p-8">
                        <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
                            <div>
                                <h1 className="text-4xl font-black mb-2 tracking-tight">{tournament.name}</h1>
                                <span className="bg-blue-600 px-4 py-1 rounded-full text-sm font-bold">{tournament.type} Mode</span>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-sm uppercase font-bold tracking-widest">Available Slots</p>
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
                            <section className="border-t border-slate-800 pt-12">
                                <h2 className="text-2xl font-black mb-8 text-center uppercase tracking-tight">Register for Tournament</h2>
                                {isAlreadyRegistered ? (
                                    <div className="bg-blue-500/10 border border-blue-500/20 p-8 rounded-2xl text-center">
                                        <CheckCircle size={48} className="mx-auto text-blue-400 mb-4" />
                                        <p className="text-xl font-bold">Already Registered</p>
                                        <p className="text-slate-400 mt-2">Check your status in "My Tournaments"</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRegister} className="max-w-xl mx-auto space-y-6 bg-slate-800/20 p-8 rounded-2xl border border-slate-800">
                                        <input 
                                            type="text"
                                            placeholder="Enter Your Team/Player Name"
                                            value={userTeamName}
                                            onChange={(e) => setUserTeamName(e.target.value)}
                                            className="w-full bg-slate-700 border-slate-600 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 text-white"
                                            required
                                        />
                                        <button 
                                            type="submit" 
                                            disabled={isSubmitting}
                                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-600 disabled:cursor-not-allowed py-4 rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-blue-500/20">
                                            {isSubmitting ? 'Registering...' : 'Confirm Registration'}
                                        </button>
                                    </form>
                                )}
                            </section>
                        )}

                        {successMessage && (
                            <div className="mt-12 text-center p-12 bg-green-500/10 rounded-2xl border border-green-500/20">
                                {showAd ? (
                                    <div>
                                        <p className="text-xl font-bold">Success! Preparing your link...</p>
                                        <p className="text-slate-400 mt-2">{timeLeft}s remaining</p>
                                    </div>
                                ) : (
                                    <div>
                                        <CheckCircle size={64} className="mx-auto text-green-400 mb-4" />
                                        <h2 className="text-3xl font-black mb-4">Registration Complete!</h2>
                                        <a href={tournament.discordlink} target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 px-10 py-4 rounded-xl font-black text-xl hover:bg-blue-500 transition-all">Join Discord</a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TournamentOverview;