import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase-config';
import firebase from 'firebase/compat/app';
import { Trophy, Users, X, CheckCircle, AlertCircle } from 'lucide-react';

const TournamentCard = ({ tournament }) => {
    const [formData, setFormData] = useState({
        teamName: '',
        player1: { id: '', inGameName: '' },
        player2: { id: '', inGameName: '' },
        player3: { id: '', inGameName: '' }
    });
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [showRegistrationForm, setShowRegistrationForm] = useState(false);
    const [registeredTeams, setRegisteredTeams] = useState(tournament?.registeredTeams || 0);
    const [isAlreadyRegistered, setIsAlreadyRegistered] = useState(false);
    const [justRegistered, setJustRegistered] = useState(false);
    const [showAd, setShowAd] = useState(false);
    const [timeLeft, setTimeLeft] = useState(5);

    useEffect(() => {
        if (!tournament?.id) return;

        const unsubscribe = db.collection('tournaments')
            .doc(tournament.id)
            .collection('teams')
            .onSnapshot(
                snapshot => {
                    setRegisteredTeams(snapshot.size);
                },
                error => {
                    console.error('Error fetching teams:', error);
                    setErrorMessage('Error loading tournament data');
                }
            );

        return () => unsubscribe();
    }, [tournament?.id]);

    useEffect(() => {
        const checkRegistration = async () => {
            const user = auth.currentUser;
            if (!user || !tournament?.id) return;

            try {
                const userDoc = await db.collection('users').doc(user.uid).get();
                const userData = userDoc.data();
                if (userData?.registeredTournaments) {
                    const registeredTournaments = userData.registeredTournaments.map(ref => ref.id);
                    setIsAlreadyRegistered(registeredTournaments.includes(tournament.id));
                }
            } catch (error) {
                console.error('Error checking registration:', error);
                setErrorMessage('Error checking registration status');
            }
        };

        checkRegistration();
    }, [tournament?.id]);

    useEffect(() => {
        if (showAd && timeLeft > 0) {
            const timer = setInterval(() => {
                setTimeLeft((prevTime) => prevTime - 1);
            }, 1000);

            return () => clearInterval(timer);
        }
        
        if (timeLeft === 0) {
            setShowAd(false);
            setTimeLeft(5); // Reset timer for next use
        }
    }, [showAd, timeLeft]);

    const handleInputChange = (field, value, playerNum = null) => {
        if (playerNum) {
            setFormData(prev => ({
                ...prev,
                [`player${playerNum}`]: {
                    ...prev[`player${playerNum}`],
                    [field]: value
                }
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const validatePlayerIds = (ids) => {
        return ids.every(id => {
            if (!id) return true; // Skip empty optional fields
            const formattedId = id.startsWith('#') ? id : `#${id}`;
            return formattedId.length === 10;
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setErrorMessage('');
        setSuccessMessage('');

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('Please sign in to register');
            }

            if (isAlreadyRegistered) {
                throw new Error('You have already registered for this tournament');
            }

            // Validate team name for team tournaments
            if (tournament.type !== '1v1' && !formData.teamName.trim()) {
                throw new Error('Team name is required');
            }

            // Format and validate player IDs
            const playerIds = [
                formData.player1.id,
                tournament.type !== '1v1' ? formData.player2.id : null,
                tournament.type === '3v3' ? formData.player3.id : null
            ].filter(Boolean);

            if (!validatePlayerIds(playerIds)) {
                throw new Error('Invalid player ID format. Must be 9 characters with optional #');
            }

            // Check for duplicate registrations
            const teamsSnapshot = await db.collection('tournaments')
                .doc(tournament.id)
                .collection('teams')
                .get();

            const existingIds = new Set();
            teamsSnapshot.forEach(doc => {
                const team = doc.data();
                Object.keys(team).forEach(key => {
                    if (key.includes('Id')) existingIds.add(team[key]);
                });
            });

            const duplicateId = playerIds.find(id => existingIds.has(id.startsWith('#') ? id : `#${id}`));
            if (duplicateId) {
                throw new Error(`Player ID ${duplicateId} is already registered`);
            }

            // Create team registration
            await db.collection('tournaments')
                .doc(tournament.id)
                .collection('teams')
                .add({
                    teamName: formData.teamName,
                    player1Id: formData.player1.id.startsWith('#') ? formData.player1.id : `#${formData.player1.id}`,
                    player1InGameName: formData.player1.inGameName,
                    ...(tournament.type !== '1v1' && {
                        player2Id: formData.player2.id.startsWith('#') ? formData.player2.id : `#${formData.player2.id}`,
                        player2InGameName: formData.player2.inGameName,
                    }),
                    ...(tournament.type === '3v3' && {
                        player3Id: formData.player3.id.startsWith('#') ? formData.player3.id : `#${formData.player3.id}`,
                        player3InGameName: formData.player3.inGameName,
                    }),
                    userId: user.uid,
                    registeredAt: firebase.firestore.FieldValue.serverTimestamp()
                });

            // Update user's registered tournaments
            await db.collection('users').doc(user.uid).update({
                registeredTournaments: firebase.firestore.FieldValue.arrayUnion(db.doc(`tournaments/${tournament.id}`))
            });

            setSuccessMessage('Team registered successfully');
            setIsAlreadyRegistered(true);
            setJustRegistered(true);
            setShowRegistrationForm(false);
            setShowAd(true);
            setTimeLeft(5);
            setFormData({
                teamName: '',
                player1: { id: '', inGameName: '' },
                player2: { id: '', inGameName: '' },
                player3: { id: '', inGameName: '' }
            });

        } catch (error) {
            console.error('Registration error:', error);
            setErrorMessage(error.message);
        }
    };

    const remainingSlots = tournament?.slots ? tournament.slots - registeredTeams : 0;
    const filledSlotsPercentage = tournament?.slots ? (registeredTeams / tournament.slots) * 100 : 0;

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

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                            <AlertCircle className="w-6 h-6 text-red-400 mx-auto mb-2" />
                            <p className="text-red-400">{errorMessage}</p>
                        </div>
                    )}

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
                                    // Show "already registered" message if user is registered but didn't just register
                                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                                        <AlertCircle className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                                        <p className="text-blue-400 font-semibold">
                                            You have already registered for this tournament.
                                        </p>
                                    </div>
                                ) : (
                                <form onSubmit={handleRegister} className="space-y-4">
                                    {tournament.type !== '1v1' && (
                                        <div>
                                            <label className="block text-sm font-medium text-slate-300 mb-1">Team Name</label>
                                            <input
                                                type="text"
                                                value={formData.teamName}
                                                onChange={(e) => handleInputChange('teamName', e.target.value)}
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
                                                value={formData.player1.id}
                                                onChange={(e) => handleInputChange('id', e.target.value, 1)}
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
                                                value={formData.player1.inGameName}
                                                onChange={(e) => handleInputChange('inGameName', e.target.value, 1)}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                required
                                            />
                                        </div>
                                    </div>

                                    {/* Player 2 Fields */}
                                    {(tournament.type === '2v2' || tournament.type === '3v3') && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Player 2 ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.player2.id}
                                                    onChange={(e) => handleInputChange('id', e.target.value, 2)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                    minLength="9"
                                                    maxLength="10"
                                                    pattern="#?.{9}"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Player 2 In-Game Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.player2.inGameName}
                                                    onChange={(e) => handleInputChange('inGameName', e.target.value, 2)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Player 3 Fields */}
                                    {tournament.type === '3v3' && (
                                        <div className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Player 3 ID</label>
                                                <input
                                                    type="text"
                                                    value={formData.player3.id}
                                                    onChange={(e) => handleInputChange('id', e.target.value, 3)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                    minLength="9"
                                                    maxLength="10"
                                                    pattern="#?.{9}"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-slate-300 mb-1">Player 3 In-Game Name</label>
                                                <input
                                                    type="text"
                                                    value={formData.player3.inGameName}
                                                    onChange={(e) => handleInputChange('inGameName', e.target.value, 3)}
                                                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <button 
                                        type="submit"
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