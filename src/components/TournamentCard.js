import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import firebase from 'firebase/compat/app';
import { Trophy, Users, X, CheckCircle, AlertCircle } from 'lucide-react';

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
    const [showAd, setShowAd] = useState(true);
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        const unsubscribe = db.collection('tournaments').doc(tournament.id).collection('teams')
            .onSnapshot(snapshot => {
                setRegisteredTeams(snapshot.size);
            });

        return () => unsubscribe();
    }, [tournament.id]);

    useEffect(() => {
        if (showAd && timeLeft > 0) {
            const timer = setTimeout(() => {
                setTimeLeft((prev) => prev - 1);
            }, 1000);

            return () => clearTimeout(timer); // Clear the timeout when the component unmounts or timeLeft changes
        }

        if (timeLeft === 0) {
            setShowAd(false); // Hide the ad after 5 seconds
        }
    }, [showAd, timeLeft]);

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
            setJustRegistered(true);
            setShowRegistrationForm(false);
        } catch (error) {
            console.error('Error registering team: ', error);
            setSuccessMessage(error.message);
        }
    };

    const handleRegisterClick = () => {
        setShowRegistrationForm(!showRegistrationForm);
        setJustRegistered(false); 
    };

    const remainingSlots = tournament.slots - registeredTeams;
    const filledSlotsPercentage = (registeredTeams / tournament.slots) * 100;

    return (
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-lg border border-slate-400 overflow-hidden shadow-xl">
            <div className="relative">
                <img 
                    src={tournament.thumbnail} 
                    alt="Tournament Banner" 
                    className="w-full h-48 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{tournament.description}</h2>
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                            {tournament.type} Tournament
                        </span>
                    </div>
                    <span className="px-3 py-1 bg-slate-800 text-slate-200 rounded-full text-sm border border-slate-700">
                        {remainingSlots} slots left
                    </span>
                </div>
            </div>

            <div className="p-6">
                <div className="space-y-6">
                    {/* Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-slate-400">
                            <span>Registration Progress</span>
                            <span>{Math.round(filledSlotsPercentage)}%</span>
                        </div>
                        <div className="w-full bg-slate-700 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${filledSlotsPercentage}%` }}
                            />
                        </div>
                    </div>

                    {/* Registration Section */}
                    {remainingSlots === 0 ? (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-red-400 font-semibold">The tournament is full</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button 
                                onClick={() => setShowRegistrationForm(!showRegistrationForm)}
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                            >
                                {showRegistrationForm ? (
                                    <>
                                        <X className="w-5 h-5" />
                                        Close Registration
                                    </>
                                ) : (
                                    <>
                                        <Trophy className="w-5 h-5" />
                                        Register Now
                                    </>
                                )}
                            </button>

                            {showRegistrationForm && (
                                isAlreadyRegistered && !justRegistered ? (
                                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                                        <AlertCircle className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
                                        <p className="text-yellow-400 font-semibold">You have already registered for this tournament.</p>
                                    </div>
                                ) : (
                                    <form onSubmit={handleRegister} className="space-y-4">
                                        {tournament.type !== '1v1' && (
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
                                                <input
                                                    type="text"
                                                    value={teamName}
                                                    onChange={(e) => setTeamName(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                        )}

                                        {/* Player 1 Fields */}
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Player 1 ID</label>
                                                <input
                                                    type="text"
                                                    value={player1Id}
                                                    onChange={(e) => setPlayer1Id(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                    minLength="9"
                                                    maxLength="10"
                                                    pattern="#?.{9}"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Player 1 In-Game Name</label>
                                                <input
                                                    type="text"
                                                    value={player1InGameName}
                                                    onChange={(e) => setPlayer1InGameName(e.target.value)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
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

                                        <button 
                                            type="submit"
                                            onClick={handleRegisterClick}
                                            className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors flex items-center justify-center gap-2"
                                        >
                                            <CheckCircle className="w-5 h-5" />
                                            Submit Registration
                                        </button>
                                    </form>
                                )
                            )}
                        </div>
                    )}

                    {/* Success Message Section */}
                    {successMessage && (
                        <div className="mt-4">
                            {showAd ? (
                                <div className="bg-slate-800 rounded-lg p-6 text-center">
                                    <h2 className="text-xl font-bold text-white mb-2">Wait for the Discord Link</h2>
                                    <p className="text-slate-400 mb-4">The link will appear in {timeLeft} seconds...</p>
                                    <div className="my-4">
                                        <ins
                                            className="adsbygoogle"
                                            style={{ display: 'block' }}
                                            data-ad-client="ca-pub-7312937286473322"
                                            data-ad-slot="3058069917"
                                            data-ad-format="auto"
                                            data-full-width-responsive="true"
                                        ></ins>
                                    </div>
                                    <button
                                        onClick={() => setShowAd(false)}
                                        className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                    >
                                        Skip Ad
                                    </button>
                                </div>
                            ) : (
                                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 text-center">
                                    <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-2" />
                                    <p className="text-green-400 font-semibold mb-4">{successMessage}</p>
                                    <p className="text-slate-300 mb-4">Join The Discord Server for Match Updates</p>
                                    <a
                                        href={tournament.discordlink}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                                    >
                                        <Users className="w-5 h-5" />
                                        Join Discord
                                    </a>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default TournamentCard;