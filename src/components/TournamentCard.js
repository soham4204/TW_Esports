import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config'; 
import firebase from 'firebase/compat/app'; 

const TournamentCard = ({ tournament }) => {
    const [teamName, setTeamName] = useState('');
    const [player1Id, setPlayer1Id] = useState('');
    const [player1InGameName, setPlayer1InGameName] = useState('');
    const [player2Id, setPlayer2Id] = useState('');
    const [player2InGameName, setPlayer2InGameName] = useState('');
    const [player3Id, setPlayer3Id] = useState('');
    const [player3InGameName, setPlayer3InGameName] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registeredTeams, setRegisteredTeams] = useState(tournament.registeredTeams);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [justRegistered, setJustRegistered] = useState(false);

    useEffect(() => {
        const unsubscribe = db.collection('tournaments').doc(tournament.id).collection('teams')
            .onSnapshot(snapshot => {
                setRegisteredTeams(snapshot.size);
            });

        return () => unsubscribe();
    }, [tournament.id]);

    useEffect(() => {
        const checkIfRegistered = async () => {
            const user = auth.currentUser;
            if (user) {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                if (userData && userData.registeredTournaments) {
                    const registeredTournaments = userData.registeredTournaments.map(ref => ref.id);
                    setIsAlreadyRegistered(registeredTournaments.includes(tournament.id));
                }
            }
        };

        checkIfRegistered();
    }, [tournament.id]);

    const handleRegister = async (e) => {
        e.preventDefault();
        if (isAlreadyRegistered) {
            setSuccessMessage('You have already registered for this tournament.');
            return;
        }

        try {
            if (tournament.type !== '1v1' && !teamName.trim()) {
                throw new Error('Team Name cannot be empty');
            }

            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }
            const formatPlayerId = (id) => {
                if (!id.startsWith('#')) {
                    id = `#${id}`;
                }
                if (id.length !== 10) {
                    throw new Error('Player ID must be 10 characters long, including #');
                }
                return id;
            };

            const player1IdFormatted = formatPlayerId(player1Id);
            const player2IdFormatted = tournament.type === '2v2' || tournament.type === '3v3' ? formatPlayerId(player2Id) : '';
            const player3IdFormatted = tournament.type === '3v3' ? formatPlayerId(player3Id) : '';

            const newPlayerIds = [player1IdFormatted];
            if (tournament.type === '2v2' || tournament.type === '3v3') newPlayerIds.push(player2IdFormatted);
            if (tournament.type === '3v3') newPlayerIds.push(player3IdFormatted);

            const tournamentCollectionRef = db.collection('tournaments').doc(tournament.id).collection('teams');
            const snapshot = await tournamentCollectionRef.get();
            const existingPlayerIds = [];

            snapshot.forEach(doc => {
                const teamData = doc.data();
                existingPlayerIds.push(teamData.player1Id);
                if (teamData.player2Id) existingPlayerIds.push(teamData.player2Id);
                if (teamData.player3Id) existingPlayerIds.push(teamData.player3Id);
            });

            // Check for duplicates
            const duplicateIds = newPlayerIds.filter(id => existingPlayerIds.includes(id));
            if (duplicateIds.length > 0) {
                throw new Error(`Player ID(s) ${duplicateIds.join(', ')} already registered in this tournament.`);
            }

            await tournamentCollectionRef.add({
                TeamName: teamName,
                player1Id: player1IdFormatted,
                player1InGameName,
                player2Id: player2IdFormatted,
                player2InGameName,
                player3Id: player3IdFormatted,
                player3InGameName,
            });
            const userDocRef = db.collection('users').doc(user.uid);
            await userDocRef.update({
                registeredTournaments: firebase.firestore.FieldValue.arrayUnion(db.doc(`tournaments/${tournament.id}`))
            });

            setTeamName('');
            setPlayer1Id('');
            setPlayer1InGameName('');
            setPlayer2Id('');
            setPlayer2InGameName('');
            setPlayer3Id('');
            setPlayer3InGameName('');
            setSuccessMessage('Team registered successfully');
            setIsAlreadyRegistered(true); // Set the user as registered after successful registration
            setJustRegistered(true); // Set the just registered flag
            setShowRegistrationForm(false);
        } catch (error) {
            console.error('Error registering team: ', error);
            setSuccessMessage(error.message);
        }
    };

    const handleRegisterClick = () => {
        setShowRegistrationForm(!showRegistrationForm);
        setJustRegistered(false); // Reset the just registered flag when user clicks register button
    };

    // Calculate remaining slots and percentage of filled slots
    const remainingSlots = tournament.slots - registeredTeams;
    const filledSlotsPercentage = (registeredTeams / tournament.slots) * 100;

    return (
        <div className="m-4 py-2 px-4 bg-slate-800">
            <img src={tournament.thumbnail} alt="Tournament Thumbnail" className="mt-2 rounded-lg" style={{ maxWidth: '100%' }} />
            <h2 className="text-xl font-semibold">{tournament.description}</h2>
            <p>Slots Remaining: {remainingSlots}</p>
            <div className="relative pt-1">
                <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
                    <div 
                        style={{ width: `${filledSlotsPercentage}%` }} 
                        className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500">
                    </div>
                </div>
            </div>
            {remainingSlots === 0 ? (
                <p className="text-red-500 font-bold">The tournament is full.</p>
            ) : (
                <>
                    <button className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2" onClick={handleRegisterClick}>
                        {showRegistrationForm ? "Close" : "Register"}
                    </button>
                    {showRegistrationForm && (
                        isAlreadyRegistered && !justRegistered ? (
                            <p className="text-yellow-500 font-bold">You have already registered for this tournament.</p>
                        ) : (
                            <form onSubmit={handleRegister} className={showRegistrationForm ? 'block' : 'hidden'}>
                                {tournament.type !== '1v1' && (
                                    <div className="mb-4">
                                        <label htmlFor="TeamName" className="block text-sm font-medium text-gray-300">Team Name</label>
                                        <input
                                            type="text"
                                            id="TeamName"
                                            value={teamName}
                                            onChange={(e) => setTeamName(e.target.value)}
                                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                            required
                                        />
                                    </div>
                                )}
                                <div className="mb-4">
                                    <label htmlFor="player1Id" className="block text-sm font-medium text-gray-300">Player 1 ID</label>
                                    <input
                                        type="text"
                                        id="player1Id"
                                        value={player1Id}
                                        onChange={(e) => setPlayer1Id(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                        required
                                        minLength="9"
                                        maxLength="10"
                                        pattern="#?.{9}"
                                        title="ID must be 9 characters long (excluding # if included)."
                                    />
                                </div>
                                <div className="mb-4">
                                    <label htmlFor="player1InGameName" className="block text-sm font-medium text-gray-300">Player 1 In-Game Name</label>
                                    <input
                                        type="text"
                                        id="player1InGameName"
                                        value={player1InGameName}
                                        onChange={(e) => setPlayer1InGameName(e.target.value)}
                                        className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                        required
                                    />
                                </div>
                                {(tournament.type === '2v2' || tournament.type === '3v3') && (
                                    <>
                                        <div className="mb-4">
                                            <label htmlFor="player2Id" className="block text-sm font-medium text-gray-300">Player 2 ID</label>
                                            <input
                                                type="text"
                                                id="player2Id"
                                                value={player2Id}
                                                onChange={(e) => setPlayer2Id(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                                required
                                                minLength="9"
                                                maxLength="10"
                                                pattern="#?.{9}"
                                                title="ID must be 9 characters long (excluding # if included)."
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="player2InGameName" className="block text-sm font-medium text-gray-300">Player 2 In-Game Name</label>
                                            <input
                                                type="text"
                                                id="player2InGameName"
                                                value={player2InGameName}
                                                onChange={(e) => setPlayer2InGameName(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                {tournament.type === '3v3' && (
                                    <>
                                        <div className="mb-4">
                                            <label htmlFor="player3Id" className="block text-sm font-medium text-gray-300">Player 3 ID</label>
                                            <input
                                                type="text"
                                                id="player3Id"
                                                value={player3Id}
                                                onChange={(e) => setPlayer3Id(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                                required
                                                minLength="9"
                                                maxLength="10"
                                                pattern="#?.{9}"
                                                title="ID must be 9 characters long (excluding # if included)."
                                            />
                                        </div>
                                        <div className="mb-4">
                                            <label htmlFor="player3InGameName" className="block text-sm font-medium text-gray-300">Player 3 In-Game Name</label>
                                            <input
                                                type="text"
                                                id="player3InGameName"
                                                value={player3InGameName}
                                                onChange={(e) => setPlayer3InGameName(e.target.value)}
                                                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500"
                                                required
                                            />
                                        </div>
                                    </>
                                )}
                                <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-lg">Submit</button>
                            </form>
                        )
                    )}
                </>
            )}
            {successMessage && (
                <div className="mt-2">
                    <p className="text-green-500">{successMessage}</p>
                    <p>Join The Discord Server for Match Updates</p>
                    <a href={tournament.discordlink} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-4 py-2 rounded-lg mt-2 inline-block">
                        Join 
                    </a>
                </div>
            )}
        </div>
    );
};

export default TournamentCard;
