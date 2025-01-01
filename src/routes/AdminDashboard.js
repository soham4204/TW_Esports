import React, { useState, useEffect } from 'react';
import { db } from '../firebase-config';
import logo from '../assets/Logo.png';
import { 
    Trash2, 
    Edit, 
    Plus, 
    X, 
    Users, 
    Calendar, 
    Link as LinkIcon, 
    Image,
    ChevronDown,
    AlertCircle,
    Check
} from 'lucide-react';
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
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    useEffect(() => {
        fetchTournaments();
    }, []);

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

    const toggleForm = () => {
        setShowForm(!showForm);
        if (!showForm) {
            resetForm();
        }
    };

    const resetForm = () => {
        setTournamentName('');
        setDescription('');
        setThumbnailURL('');
        setSlots('');
        setDiscordLink('');
        setType('');
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEditTournament = (tournament) => {
        setTournamentName(tournament.name);
        setDescription(tournament.description);
        setThumbnailURL(tournament.thumbnail);
        setSlots(tournament.slots);
        setDiscordLink(tournament.discordlink);
        setType(tournament.type);
        setIsEditing(true);
        setEditingId(tournament.id);
        setShowForm(true);
        setSelectedTournament(null);
    };

    const handleDeleteTournament = async (tournamentId) => {
        if (window.confirm('Are you sure you want to delete this tournament?')) {
            try {
                // Delete the tournament document
                await db.collection('tournaments').doc(tournamentId).delete();
    
                // Delete all teams associated with the tournament
                const teamsSnapshot = await db
                    .collection('teams')
                    .where('tournamentId', '==', tournamentId)
                    .get();
    
                const deleteTeamPromises = teamsSnapshot.docs.map((doc) => doc.ref.delete());
                await Promise.all(deleteTeamPromises);
    
                // Optional: Delete the tournament ID from any other references
                const referenceSnapshot = await db
                    .collection('references')
                    .where('tournamentId', '==', tournamentId)
                    .get();
    
                const deleteReferencePromises = referenceSnapshot.docs.map((doc) => doc.ref.delete());
                await Promise.all(deleteReferencePromises);
    
                setSuccessMessage('Tournament and associated data deleted successfully');
                fetchTournaments();
                setSelectedTournament(null);
            } catch (error) {
                console.error('Error deleting tournament and associated data: ', error);
                setSuccessMessage('Error deleting tournament and associated data');
            }
        }
    };    

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const tournamentData = {
                name: tournamentName,
                description,
                thumbnail: thumbnailURL,
                slots,
                discordlink,
                type,
            };

            if (isEditing) {
                await db.collection('tournaments').doc(editingId).update(tournamentData);
                setSuccessMessage('Tournament updated successfully');
            } else {
                await db.collection('tournaments').doc(tournamentName).set(tournamentData);
                setSuccessMessage('Tournament added successfully');
            }

            resetForm();
            setShowForm(false);
            fetchTournaments();
        } catch (error) {
            console.error('Error adding/updating tournament: ', error);
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

    const handleManageTournaments = () => {
        setShowTournamentList(!showTournamentList);
        setSelectedTournament(null);
    };

    const handleTournamentClick = async (tournament) => {
        setSelectedTournament(tournament);
        await fetchTeams(tournament.id);
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-8">
                    <BackButton path="/" />
                    <img src={logo} alt="TW Esports Logo" className="h-16" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={toggleForm}
                        className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 transition-colors p-4 rounded-lg text-lg font-medium"
                    >
                        {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {showForm ? "Close Form" : "Add Tournament"}
                    </button>
                    <button 
                        onClick={handleManageTournaments}
                        className="flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 transition-colors p-4 rounded-lg text-lg font-medium"
                    >
                        <Users className="h-5 w-5" />
                        {showTournamentList ? "Close Manager" : "Manage Tournaments"}
                    </button>
                </div>

                {successMessage && (
                    <div className="mb-6 bg-green-600 text-white p-4 rounded-lg flex items-center gap-2">
                        <Check className="h-5 w-5" />
                        <p>{successMessage}</p>
                    </div>
                )}

                {showForm && (
                    <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6">
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold">
                                {isEditing ? 'Edit Tournament' : 'Create New Tournament'}
                            </h2>
                        </div>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tournament Name</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={tournamentName}
                                            onChange={(e) => setTournamentName(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Enter tournament name"
                                            disabled={isEditing}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tournament Type</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
                                        >
                                            <option value="">Select Type</option>
                                            <option value="1v1">1v1</option>
                                            <option value="2v2">2v2</option>
                                            <option value="3v3">3v3</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Tournament description"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Thumbnail URL</label>
                                    <div className="relative">
                                        <Image className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={thumbnailURL}
                                            onChange={(e) => setThumbnailURL(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Image URL"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slots</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={slots}
                                            onChange={(e) => setSlots(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Available slots"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Discord Link</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={discordlink}
                                            onChange={(e) => setDiscordLink(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Discord server URL"
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mt-6 flex items-center justify-center gap-2"
                            >
                                {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {isEditing ? 'Update Tournament' : 'Create Tournament'}
                            </button>
                        </form>
                    </div>
                )}

                {showTournamentList && !selectedTournament && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map(tournament => (
                            <div key={tournament.id} className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden hover:border-blue-500 transition-all">
                                <div className="p-4">
                                    <div className="flex justify-end gap-2 mb-4">
                                        <button
                                            onClick={() => handleEditTournament(tournament)}
                                            className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                                        >
                                            <Edit size={16} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteTournament(tournament.id)}
                                            className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div 
                                        className="cursor-pointer" 
                                        onClick={() => handleTournamentClick(tournament)}
                                    >
                                        <img 
                                            src={tournament.thumbnail} 
                                            alt={tournament.name}
                                            className="w-full h-48 object-cover rounded-lg mb-4"
                                        />
                                        <h3 className="text-xl font-semibold mb-2">{tournament.name}</h3>
                                        <p className="text-gray-300 mb-2">{tournament.description}</p>
                                        <div className="flex items-center gap-2 text-gray-400">
                                            <Users size={16} />
                                            <span>Slots: {tournament.slots}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {selectedTournament && (
                    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-2xl font-bold">{selectedTournament.name}</h2>
                                <button 
                                    onClick={() => setSelectedTournament(null)}
                                    className="p-2 hover:bg-gray-700 rounded-full transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            <img 
                                src={selectedTournament.thumbnail} 
                                alt={selectedTournament.name}
                                className="w-full h-64 object-cover rounded-lg mb-6"
                            />
                            <div className="space-y-4">
                                {teams[selectedTournament.id]?.map(team => (
                                    <details 
                                        key={team.id} 
                                        className="bg-gray-700 rounded-lg transition-all group"
                                    >
                                        <summary className="p-4 cursor-pointer font-medium hover:bg-gray-600 rounded-lg transition-colors flex items-center justify-between">
                                            <span>{team.TeamName}</span>
                                            <ChevronDown className="h-5 w-5 transform group-open:rotate-180 transition-transform" />
                                        </summary>
                                        <div className="p-4 space-y-3 border-t border-gray-600">
                                            {renderTeamPlayers(team)}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;