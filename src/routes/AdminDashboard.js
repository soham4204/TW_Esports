import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import logo from '../assets/Logo.png';
import BackButton from '../components/BackButton';

const AdminDashboard = () => {
    const [tournamentName, setTournamentName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailURL, setThumbnailURL] = useState('');
    const [slots, setSlots] = useState('');
    const [discordlink, setDiscordLink] = useState('');
    const [type, setType] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [showTournamentList, setShowTournamentList] = useState(false);
    const [teams, setTeams] = useState({});

    useEffect(() => {
        const fetchTournaments = async () => {
            try {
                const tournamentsSnapshot = await db.collection('tournaments').get();
                const tournamentsData = tournamentsSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                }));
                setTournaments(tournamentsData);
            } catch (error) {
                console.error('Error fetching tournaments: ', error);
            }
        };

        fetchTournaments();
    }, []);

    const toggleForm = () => {
        setShowForm(!showForm);
    };

    const handleManageTournaments = () => {
        setShowTournamentList(!showTournamentList);
        setSelectedTournament(null);
    };

    const handleTournamentClick = async (tournament) => {
        setSelectedTournament(tournament);
        await fetchTeams(tournament.id);
    };

    const fetchTeams = async (tournamentId) => {
        try {
            const teamsSnapshot = await db.collection('tournaments').doc(tournamentId).collection('teams').get();
            const teamsData = teamsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setTeams(prev => ({ ...prev, [tournamentId]: teamsData }));
        } catch (error) {
            console.error('Error fetching teams: ', error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await db.collection('tournaments').doc(tournamentName).set({
                name: tournamentName,
                description,
                thumbnail: thumbnailURL,
                slots,
                discordlink,
                type,
            });
            setTournamentName('');
            setDescription('');
            setThumbnailURL('');
            setSlots('');
            setDiscordLink('');
            setType('');
            setSuccessMessage('Tournament added successfully');
            setShowForm(false);
        } catch (error) {
            console.error('Error adding tournament: ', error);
            setSuccessMessage('');
        }
    };

    const renderTeamPlayers = (team) => {
        const players = [
            { name: team.player1InGameName, id: team.player1Id },
            { name: team.player2InGameName, id: team.player2Id },
            { name: team.player3InGameName, id: team.player3Id },
        ].filter(player => player.name && player.id); // Filter out empty player slots

        return (
            <ul className="mt-2">
                {players.map((player, index) => (
                    <li key={index} className="ml-4">
                        <p>Player Name: {player.name}</p>
                        <p>Player ID: {player.id}</p>
                    </li>
                ))}
            </ul>
        );
    };

    return (
        <div className="w-full flex flex-col items-center justify-center h-screen overflow-auto bg-gray-900 text-white">
            <div className="w-4/5 text-center h-full">
                <div className="mt-4 flex float-start">
                    <BackButton path="/" />
                </div>
                <div className="w-full flex justify-center mt-6">
                    <img src={logo} alt="TW Esports Logo" className="flex h-24 mb-8" />
                </div>
                <div className="flex flex-row space-x-2 justify-between items-center mb-4 text-center">
                    <button className="flex w-1/2 bg-blue-500 text-white px-2 py-3 rounded-lg text-lg font-semibold text-center" onClick={toggleForm}>
                        {showForm ? "Close" : "Add Tournament"}
                    </button>
                    <button className="flex w-1/2 bg-blue-500 text-white px-2 py-3 rounded-lg text-lg font-semibold text-center" onClick={handleManageTournaments}>
                        {showTournamentList ? "Close" : "Manage Tournaments"}
                    </button>
                </div>
                {showForm && (
                    <form className="mt-4 w-full" onSubmit={handleSubmit}>
                        <input type="text" value={tournamentName} onChange={(e) => setTournamentName(e.target.value)} placeholder="Tournament Name" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" required>
                            <option value="">Select Tournament Type</option>
                            <option value="1v1">1v1</option>
                            <option value="2v2">2v2</option>
                            <option value="3v3">3v3</option>
                        </select>
                        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                        <input type="text" value={thumbnailURL} onChange={(e) => setThumbnailURL(e.target.value)} placeholder="Thumbnail URL" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                        <input type="number" value={slots} onChange={(e) => setSlots(e.target.value)} placeholder="Slots" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                        <input type="text" value={discordlink} onChange={(e) => setDiscordLink(e.target.value)} placeholder="Discord URL" required className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />            
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2">Submit</button>
                    </form>
                )}
                {successMessage && (
                    <p className="mt-4 text-green-500">{successMessage}</p>
                )}
                {showTournamentList && !selectedTournament && (
                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {tournaments.map(tournament => (
                            <div key={tournament.id} className="bg-gray-800 p-4 rounded-lg cursor-pointer" onClick={() => handleTournamentClick(tournament)}>
                                <h2 className="text-xl font-semibold">{tournament.name}</h2>
                                <h3 className="text-xl font-semibold">{tournament.description}</h3>
                                <p>Slots: {tournament.slots}</p>
                                <img src={tournament.thumbnail} alt="Tournament Thumbnail" className="mt-2 rounded-lg" style={{ maxWidth: '100%' }} />
                            </div>
                        ))}
                    </div>
                )}
                {selectedTournament && (
                    <div className="mt-8 bg-gray-800 p-4 rounded-lg">
                        <h3 className="text-xl font-semibold">{selectedTournament.description}</h3>
                        <p>Slots: {selectedTournament.slots}</p>
                        <img src={selectedTournament.thumbnail} alt="Tournament Thumbnail" className="mt-2 rounded-lg" style={{ maxWidth: '100%' }} />
                        <div className="mt-4">
                            {teams[selectedTournament.id]?.map(team => (
                                <details key={team.id} className="mb-4 bg-gray-700 p-4 rounded-lg">
                                    <summary className="cursor-pointer text-lg font-semibold">{team.TeamName}</summary>
                                    {renderTeamPlayers(team)}
                                </details>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;
