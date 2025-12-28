import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase-config';
import logo from '../assets/Logo.png';
import { 
    Trash2, 
    Edit, 
    Plus, 
    X, 
    Users, 
    Calendar, 
    Link as LinkIcon, 
    ChevronDown,
    AlertCircle,
    Check,
    Upload,
    Loader2
} from 'lucide-react';
import BackButton from '../components/BackButton';

const AdminDashboard = () => {
    // Authorization State
    const location = useLocation();
    const navigate = useNavigate();
    const [isAuthorized, setIsAuthorized] = useState(false);

    // Tournament Management State
    const [tournamentName, setTournamentName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailURL, setThumbnailURL] = useState('');
    const [isUploading, setIsUploading] = useState(false); // Added missing state
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

    const CLOUDINARY_UPLOAD_PRESET = "R7Esports"; 
    const CLOUDINARY_CLOUD_NAME = "dihawgvdz";

    useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const secretKey = queryParams.get('key');

    if (secretKey === 'R7Esports') {
        // Perform a silent login so Firestore recognizes your permissions
        // You must have already created this user in the Firebase Auth console
        auth.signInWithEmailAndPassword('twesports29@gmail.com', '12345678')
            .then(() => {
                setIsAuthorized(true);
                fetchTournaments();
            })
            .catch((err) => {
                console.error("Admin Auth Failed:", err.message);
                navigate('/home');
            });
    } else {
        console.error('Unauthorized access attempt');
        navigate('/home');
    }
}, [location, navigate]);

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

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);

        try {
            const response = await fetch(
                `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
                { method: 'POST', body: formData }
            );
            const data = await response.json();
            setThumbnailURL(data.secure_url); 
            setIsUploading(false);
        } catch (error) {
            console.error('Upload failed:', error);
            setIsUploading(false);
            alert("Image upload failed. Please try again.");
        }
    };

    const toggleForm = () => {
        setShowForm(!showForm);
        if (!showForm) resetForm();
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
                await db.collection('tournaments').doc(tournamentId).delete();
                setSuccessMessage('Tournament deleted successfully');
                fetchTournaments();
                setSelectedTournament(null);
            } catch (error) {
                console.error('Error deleting tournament: ', error);
            }
        }
    };    

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!thumbnailURL) {
            alert("Please upload a thumbnail first.");
            return;
        }
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
            console.error('Error saving tournament: ', error);
        }
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

    if (!isAuthorized) {
        return null; 
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 text-white">
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="flex justify-between items-center mb-8">
                    <BackButton path="/home" />
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
                    <div className="mb-8 bg-gray-800 border border-gray-700 rounded-lg p-6 shadow-xl">
                        <h2 className="text-2xl font-bold mb-6">
                            {isEditing ? 'Edit Tournament' : 'Create New Tournament'}
                        </h2>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name Input */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tournament Name</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={tournamentName}
                                            onChange={(e) => setTournamentName(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Enter tournament name"
                                            disabled={isEditing}
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Type Selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tournament Type</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 appearance-none focus:ring-2 focus:ring-blue-500"
                                            required
                                        >
                                            <option value="">Select Type</option>
                                            <option value="1v1">1v1</option>
                                            <option value="2v2">2v2</option>
                                            <option value="3v3">3v3</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Image Upload logic replaces old Thumbnail URL input */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Tournament Thumbnail</label>
                                    <div className="relative border-2 border-dashed border-gray-600 rounded-lg p-4 bg-gray-700/50 hover:bg-gray-700 transition-all text-center">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2 py-4">
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                <p className="text-sm text-gray-400">Uploading to Cloudinary...</p>
                                            </div>
                                        ) : thumbnailURL ? (
                                            <div className="relative inline-block">
                                                <img src={thumbnailURL} alt="Preview" className="h-32 rounded-lg object-cover mx-auto shadow-lg" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setThumbnailURL('')}
                                                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-1 hover:bg-red-600"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-2 py-4">
                                                <Upload className="h-8 w-8 text-gray-400" />
                                                <span className="text-sm text-gray-400">Click to upload image</span>
                                                <input 
                                                    type="file" 
                                                    className="hidden" 
                                                    accept="image/*" 
                                                    onChange={handleImageUpload} 
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Description</label>
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Tournament description"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Slots & Discord */}
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Slots</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={slots}
                                            onChange={(e) => setSlots(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Available slots"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-medium">Discord Link</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={discordlink}
                                            onChange={(e) => setDiscordLink(e.target.value)}
                                            className="w-full bg-gray-700 border-gray-600 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-blue-500"
                                            placeholder="Discord server URL"
                                            required
                                        />
                                    </div>
                                </div>
                            </div>
                            <button
                                type="submit"
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-4 rounded-lg font-bold transition-all mt-6 flex items-center justify-center gap-2 shadow-lg"
                            >
                                {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {isEditing ? 'Update Tournament' : 'Create Tournament'}
                            </button>
                        </form>
                    </div>
                )}

                {/* --- TOURNAMENT LIST --- */}
                {showTournamentList && !selectedTournament && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tournaments.map(tournament => (
                            <div key={tournament.id} className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden hover:border-blue-500 transition-all shadow-md">
                                <div className="p-4">
                                    <div className="flex justify-end gap-2 mb-4">
                                        <button onClick={() => handleEditTournament(tournament)} className="p-2 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"><Edit size={16} /></button>
                                        <button onClick={() => handleDeleteTournament(tournament.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"><Trash2 size={16} /></button>
                                    </div>
                                    <div className="cursor-pointer" onClick={() => handleTournamentClick(tournament)}>
                                        <img src={tournament.thumbnail} alt={tournament.name} className="w-full h-48 object-cover rounded-lg mb-4" />
                                        <h3 className="text-xl font-bold mb-2">{tournament.name}</h3>
                                        <p className="text-gray-400 mb-2 line-clamp-2">{tournament.description}</p>
                                        <div className="flex items-center gap-2 text-blue-400 font-medium"><Users size={16} /><span>Slots: {tournament.slots}</span></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* --- SELECTED TOURNAMENT TEAMS --- */}
                {selectedTournament && (
                    <div className="bg-gray-800 border border-gray-700 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-8 border-b border-gray-700 pb-4">
                                <h2 className="text-3xl font-bold">{selectedTournament.name}</h2>
                                <button onClick={() => setSelectedTournament(null)} className="p-2 hover:bg-gray-700 rounded-full transition-colors"><X size={24} /></button>
                            </div>
                            <div className="space-y-4">
                                {teams[selectedTournament.id]?.length > 0 ? (
                                    teams[selectedTournament.id].map(team => (
                                        <details key={team.id} className="bg-gray-700/50 rounded-lg transition-all group border border-gray-600">
                                            <summary className="p-4 cursor-pointer font-bold hover:bg-gray-600/50 rounded-lg transition-colors flex items-center justify-between">
                                                <span>{team.teamName}</span>
                                                <ChevronDown className="h-5 w-5 transform group-open:rotate-180 transition-transform" />
                                            </summary>
                                            <div className="p-4 space-y-4 border-t border-gray-600 bg-gray-800/50">
                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                                    <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                                        <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Player 1</p>
                                                        <p className="font-semibold">{team.player1InGameName}</p>
                                                        <p className="text-sm text-gray-400">{team.player1Id}</p>
                                                    </div>
                                                    {team.player2Id && (
                                                        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                                            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Player 2</p>
                                                            <p className="font-semibold">{team.player2InGameName}</p>
                                                            <p className="text-sm text-gray-400">{team.player2Id}</p>
                                                        </div>
                                                    )}
                                                    {team.player3Id && (
                                                        <div className="p-3 bg-gray-900/50 rounded-lg border border-gray-700">
                                                            <p className="text-xs text-blue-400 font-bold uppercase tracking-wider mb-1">Player 3</p>
                                                            <p className="font-semibold">{team.player3InGameName}</p>
                                                            <p className="text-sm text-gray-400">{team.player3Id}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </details>
                                    ))
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Users className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                        <p>No teams registered for this tournament yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminDashboard;