import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import Navbar from '../components/Navbar';
import { Trophy, LogIn, ChevronRight } from 'lucide-react';
import LoginModal from '../components/LoginModal';
import { useNavigate } from 'react-router-dom';

const MyTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const [user, setUser] = useState(null);
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(currentUser => {
            setUser(currentUser);
            if (!currentUser) {
                setLoading(false);
            }
        });
        return unsubscribe;
    }, []);

    useEffect(() => {
        if (!user) return;

        const fetchMyTournaments = async () => {
            try {
                // Fetch user's registered tournaments from Firestore
                const registrationsSnapshot = await db.collection('users').doc(user.uid).collection('myTournaments').get();
                
                if (registrationsSnapshot.empty) {
                    setTournaments([]);
                    setLoading(false);
                    return;
                }

                // Fetch each tournament document by ID
                const tournamentPromises = registrationsSnapshot.docs.map(doc => 
                    db.collection('tournaments').doc(doc.data().tournamentId).get()
                );

                const snapshots = await Promise.all(tournamentPromises);
                const tournamentsData = snapshots
                    .filter(snapshot => snapshot.exists)
                    .map(snapshot => ({
                        id: snapshot.id,
                        ...snapshot.data(),
                    }));

                setTournaments(tournamentsData);
            } catch (error) {
                console.error('Error fetching tournaments from Firestore:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTournaments();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="text-center">
                    <div className="animate-spin h-10 w-10 border-t-2 border-blue-500 rounded-full mx-auto mb-4"></div>
                    <p>Loading your tournaments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-auto bg-slate-900">
            <Navbar />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="border border-slate-400 rounded-lg shadow-md bg-slate-900 text-white">
                    <div className="p-4 border-b border-slate-700 flex items-center gap-2">
                        <Trophy className="h-6 w-6 text-blue-400" />
                        <h2 className="text-lg font-semibold">My Joined Tournaments</h2>
                    </div>
                    <div className="p-4 md:p-6 grid gap-4 grid-cols-1 md:grid-cols-2">
                        {!user ? (
                            <div className="col-span-1 md:col-span-2 text-center p-8 bg-slate-800 rounded-lg border border-slate-700">
                                <LogIn className="h-12 w-12 mx-auto text-indigo-400 mb-4" />
                                <h3 className="text-xl font-bold mb-2">Login Required</h3>
                                <p className="text-slate-400 mb-6">Please log in with Discord to view your registered tournaments.</p>
                                <button 
                                    onClick={() => setIsLoginModalOpen(true)}
                                    className="bg-[#5865F2] hover:bg-[#4752C4] text-white px-6 py-3 rounded-lg font-bold transition-all shadow-lg"
                                >
                                    Login with Discord
                                </button>
                            </div>
                        ) : tournaments.length > 0 ? (
                            tournaments.map((t) => (
                                <div 
                                    key={t.id} 
                                    onClick={() => navigate(`/tournament/${t.id}`)}
                                    className="p-4 bg-slate-800 rounded-xl flex items-center justify-between border border-slate-700 cursor-pointer hover:border-blue-500 hover:scale-[1.02] transition-all group shadow-lg"
                                >
                                    <div className="flex items-center gap-4">
                                        <img src={t.thumbnail} alt="" className="w-20 h-20 md:w-24 md:h-24 object-cover rounded-lg flex-shrink-0" />
                                        <div>
                                            <h3 className="text-lg md:text-xl font-bold mb-1 text-white group-hover:text-blue-400 transition-colors">{t.name || t.id}</h3>
                                            <span className="bg-blue-600/20 text-blue-400 px-2 py-0.5 rounded text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 inline-block">
                                                {t.type} Mode
                                            </span>
                                            <p className="text-slate-400 text-xs md:text-sm line-clamp-1 md:line-clamp-2">{t.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="text-slate-500 group-hover:text-blue-400 transition-colors hidden sm:block" size={24} />
                                </div>
                            ))
                        ) : (
                            <div className="col-span-1 md:col-span-2 text-center p-8 bg-slate-800 rounded-lg border border-slate-700">
                                <Trophy className="h-12 w-12 mx-auto text-slate-500 mb-4" />
                                <h3 className="text-xl font-bold mb-2">No Tournaments Yet</h3>
                                <p className="text-slate-400">You haven't joined any tournaments. Head over to the home page to find your next match!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            <LoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
        </div>
    );
};

export default MyTournaments;