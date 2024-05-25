import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import Navbar from '../components/Navbar';

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
                if (!user) {
                    throw new Error('User not authenticated');
                }

                const userDoc = await db.collection('users').doc(user.uid).get();
                if (!userDoc.exists) {
                    console.log('No such document!');
                    return;
                }

                const userData = userDoc.data();
                const tournamentRefs = userData.registeredTournaments || [];

                const tournamentPromises = tournamentRefs.map(tournamentRef => tournamentRef.get());
                const tournamentSnapshots = await Promise.all(tournamentPromises);

                const tournamentsData = tournamentSnapshots.map(snapshot => ({
                    id: snapshot.id,
                    ...snapshot.data(),
                }));

                setTournaments(tournamentsData);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching user tournaments: ', error);
                setLoading(false);
            }
        };

        if (user) {
            fetchMyTournaments();
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
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
        <div className="flex flex-col h-screen overflow-auto bg-gray-900 text-white">
            <Navbar />
            <div className="flex flex-col justify-center p-4">
                <h1 className="text-2xl font-bold text-center mb-4">My Tournaments</h1>
                {tournaments.length > 0 ? (
                    tournaments.map(tournament => (
                        <div key={tournament.id} className="w-full px-4 py-2 bg-slate-800 mb-4 rounded-lg">
                            <img src={tournament.thumbnail} alt={tournament.name} className="w-full h-48 object-cover rounded-lg" />
                            <h1 className="text-2xl font-bold">{tournament.name}</h1>
                            <h2 className="text-xl font-semibold">{tournament.description}</h2>
                            <p>Slots: {tournament.slots}</p>
                            <p>Registered Teams: {tournament.registeredTeams}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-center">You have not registered for any tournaments yet.</p>
                )}
            </div>
        </div>
    );
};

export default MyTournaments;
