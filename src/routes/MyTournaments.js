import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import Navbar from '../components/Navbar';
import { Trophy } from 'lucide-react';

const MyTournaments = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            if (user) {
                setUser(user);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchMyTournaments = async () => {
            try {
                if (!user) return;

                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    console.log('No such document!');
                    return;
                }

                const userData = userDoc.data();
                const tournamentRefs = userData.registeredTournaments || [];

                const tournamentSnapshots = await Promise.all(
                    tournamentRefs.map((tournamentRef) => tournamentRef.get())
                );

                const tournamentsData = tournamentSnapshots
                    .filter(snapshot => snapshot.exists)
                    .map(snapshot => ({
                        id: snapshot.id,
                        ...snapshot.data(),
                    }));

                setTournaments(tournamentsData);
            } catch (error) {
                console.error('Error fetching user tournaments: ', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) fetchMyTournaments();
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4">Loading your tournaments...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full overflow-auto bg-slate-900">
            <Navbar />
            <div className="p-6 max-w-4xl mx-auto">
                <div className="border border-slate-400 rounded-lg shadow-md bg-slate-900 text-white">
                    <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-blue-400" />
                            <h2 className="text-lg font-semibold">My Tournaments</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        {tournaments.length > 0 ? (
                            tournaments.map((tournament) => (
                                <div key={tournament.id} className="p-4 bg-slate-800 rounded-lg">
                                    <img
                                        src={tournament.thumbnail}
                                        alt={tournament.name}
                                        className="w-full h-48 object-cover rounded-lg mb-4"
                                    />
                                    <h1 className="text-2xl font-bold">{tournament.name}</h1>
                                    <p className="text-lg">{tournament.description}</p>
                                    <p className="mt-2">Slots: {tournament.slots}</p>
                                    <p>Registered Teams: {tournament.registeredTeams}</p>
                                </div>
                            ))
                        ) : (
                            <div className="text-center p-6 bg-slate-800 rounded-lg ">
                                <Trophy className="h-12 w-12 mx-auto text-blue-400" />
                                <p className="mt-4 text-lg font-medium">No tournaments joined yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MyTournaments;
