import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import TournamentCard from '../components/TournamentCard';
import { db } from '../firebase-config';
import LoadingScreen from '../components/LoadingScreen'; 
import AdComponent from '../components/AdComponent';

const HomeComponent = () => {
    const [tournaments, setTournaments] = useState([]);
    const [loading, setLoading] = useState(true); // Add a loading state

    useEffect(() => {
        const fetchTournaments = () => {
            db.collection('tournaments').onSnapshot(
                (snapshot) => {
                    const tournamentsData = snapshot.docs.map((doc) => ({
                        id: doc.id,
                        ...doc.data(),
                    }));
                    setTournaments(tournamentsData);
                    setLoading(false); // Set loading to false after data is fetched
                },
                (error) => {
                    console.error('Error fetching tournaments: ', error);
                    setLoading(false); // Set loading to false even if there is an error
                }
            );
        };

        fetchTournaments();
    }, []);

    if (loading) {
        return <LoadingScreen />; // Display the LoadingScreen component
    }

    return (
        <div className="flex flex-col h-screen overflow-auto bg-gray-900 text-white">
            <Navbar/>
            <div className="flex-grow p-4 mt-2 md:mt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
                    {tournaments.map((tournament) => (
                        <TournamentCard key={tournament.id} tournament={tournament} />
                    ))}
                </div>
            </div>
            {/* Ad Component */}
            <div className="bg-gray-800 p-4 text-center">
                <AdComponent adSlot={3058069917}/>
            </div>
        </div>
    );
};

export default HomeComponent;
