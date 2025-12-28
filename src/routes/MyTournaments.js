import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config'; // Removed auth
import Navbar from '../components/Navbar';
import { Trophy } from 'lucide-react';

const MyTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyTournaments = async () => {
            try {
                // Read from LocalStorage instead of Auth
                const localRegs = JSON.parse(localStorage.getItem('myRegistrations') || '[]');
                
                if (localRegs.length === 0) {
                    setTournaments([]);
                    setLoading(false);
                    return;
                }

                // Fetch each tournament document by ID
                const tournamentPromises = localRegs.map(id => 
                    db.collection('tournaments').doc(id).get()
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
                console.error('Error fetching tournaments from local storage:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTournaments();
    }, []);

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
                    <div className="p-4 space-y-4">
                        {tournaments.length > 0 ? (
                            tournaments.map((t) => (
                                <div key={t.id} className="p-4 bg-slate-800 rounded-lg">
                                    <img src={t.thumbnail} alt="" className="w-full h-40 object-cover rounded-lg mb-4" />
                                    <h3 className="text-xl font-bold">{t.name || t.id}</h3>
                                    <p className="text-slate-400">{t.description}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 bg-slate-800 rounded-lg">
                                <Trophy className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                                <p>You haven't joined any tournaments on this browser yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyTournaments;