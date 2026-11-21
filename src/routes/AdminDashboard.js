import React, { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
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
    Loader2, 
    Trophy, 
    Clock, 
    RefreshCw, 
    Zap, 
    IndianRupee, 
    Swords, 
    Sparkles, 
    Lock, 
    Key, 
    Mail, 
    Eye, 
    EyeOff, 
    LogOut,
    ShieldCheck,
    KeyRound
} from 'lucide-react';
import BackButton from '../components/BackButton';
import axios from 'axios';

const AdminDashboard = () => {
    const location = useLocation();
    const navigate = useNavigate();

    // Authorization & Gate State
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [authChecking, setAuthChecking] = useState(true);
    const [authMethod, setAuthMethod] = useState('passcode'); // 'passcode' | 'credentials'
    const [passcodeKey, setPasscodeKey] = useState('');
    const [adminEmail, setAdminEmail] = useState('r7esports@gmail.com');
    const [adminPassword, setAdminPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [authSubmitting, setAuthSubmitting] = useState(false);
    const [authErrorMessage, setAuthErrorMessage] = useState('');
    const [resetSending, setResetSending] = useState(false);
    const [resetMessage, setResetMessage] = useState('');

    // In-App Change Password Modal State
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordModalSubmitting, setPasswordModalSubmitting] = useState(false);
    const [passwordModalError, setPasswordModalError] = useState('');
    const [passwordModalSuccess, setPasswordModalSuccess] = useState('');

    // Tournament Management State
    const [tournamentName, setTournamentName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailURL, setThumbnailURL] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [slots, setSlots] = useState('');
    const [discordlink, setDiscordLink] = useState('');
    const [type, setType] = useState('1v1');
    const [category, setCategory] = useState('trophy'); // 'trophy' | 'ranked'
    const [prizePool, setPrizePool] = useState('');
    const [startsAt, setStartsAt] = useState('');
    const [endsAt, setEndsAt] = useState('');

    const [showForm, setShowForm] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [tournaments, setTournaments] = useState([]);
    const [selectedTournament, setSelectedTournament] = useState(null);
    const [showTournamentList, setShowTournamentList] = useState(false);
    const [teams, setTeams] = useState({});
    const [leaderboards, setLeaderboards] = useState({});
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Syncing State
    const [syncingPlayer, setSyncingPlayer] = useState(null);
    const [syncStatusMsg, setSyncStatusMsg] = useState('');

    const CLOUDINARY_UPLOAD_PRESET = "R7Esports"; 
    const CLOUDINARY_CLOUD_NAME = "dihawgvdz";

    const fetchTournaments = useCallback(async () => {
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
    }, []);

    // Helper: scrub sensitive URL params from history
    const scrubUrlParams = () => {
        if (window.history.replaceState) {
            const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
        }
    };

    // Server-verified Passcode Login
    const handlePasscodeLogin = useCallback(async (keyToVerify) => {
        const key = keyToVerify || passcodeKey;
        if (!key || !key.trim()) {
            setAuthErrorMessage('Please enter the Admin Passcode Key');
            return;
        }

        setAuthSubmitting(true);
        setAuthErrorMessage('');

        try {
            const res = await axios.post('/api/admin/auth', { secretKey: key.trim() });
            if (res.data && res.data.success) {
                // Securely sign in to Firebase Auth using server-provided auth credential
                if (res.data.authPayload) {
                    const rawPassword = window.atob(res.data.authPayload);
                    await auth.signInWithEmailAndPassword(res.data.email, rawPassword);
                }
                sessionStorage.setItem('r7_admin_token', res.data.sessionToken);
                scrubUrlParams();
                setIsAuthorized(true);
                fetchTournaments();
            } else {
                setAuthErrorMessage('Invalid Admin Passcode Key.');
            }
        } catch (err) {
            console.error('Server Passcode Verification Failed:', err);
            setAuthErrorMessage(err.response?.data?.error || 'Invalid Admin Passcode Key. Access denied.');
        } finally {
            setAuthSubmitting(false);
            setAuthChecking(false);
        }
    }, [passcodeKey, fetchTournaments]);

    // Initial Auth Verification Check
    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const urlKey = queryParams.get('key');

        const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
            if (currentUser && currentUser.email && currentUser.email.toLowerCase() === 'r7esports@gmail.com') {
                setIsAuthorized(true);
                setAuthChecking(false);
                fetchTournaments();
                return;
            }

            if (urlKey) {
                await handlePasscodeLogin(urlKey);
            } else {
                const savedToken = sessionStorage.getItem('r7_admin_token');
                if (savedToken) {
                    try {
                        const verifyRes = await axios.post('/api/admin/auth', { 
                            action: 'verify_token', 
                            token: savedToken 
                        });
                        if (verifyRes.data?.valid) {
                            setIsAuthorized(true);
                            fetchTournaments();
                        } else {
                            sessionStorage.removeItem('r7_admin_token');
                        }
                    } catch {
                        sessionStorage.removeItem('r7_admin_token');
                    }
                }
                setAuthChecking(false);
            }
        });

        return () => unsubscribe();
    }, [location.search, handlePasscodeLogin, fetchTournaments]);

    // Email & Password Login Handler
    const handleCredentialsLogin = async (e) => {
        e.preventDefault();
        if (!adminEmail || !adminPassword) {
            setAuthErrorMessage('Please enter both admin email and password');
            return;
        }

        setAuthSubmitting(true);
        setAuthErrorMessage('');

        try {
            const userCred = await auth.signInWithEmailAndPassword(adminEmail.trim(), adminPassword);
            if (userCred.user && userCred.user.email?.toLowerCase() === 'r7esports@gmail.com') {
                setIsAuthorized(true);
                scrubUrlParams();
                fetchTournaments();
            } else {
                await auth.signOut();
                setAuthErrorMessage('This account is not authorized as an R7 Admin.');
            }
        } catch (err) {
            console.error('Firebase Auth Failed:', err);
            setAuthErrorMessage(err.message || 'Authentication failed. Please verify credentials.');
        } finally {
            setAuthSubmitting(false);
        }
    };

    // Send Password Reset Email Trigger
    const handleSendPasswordReset = async () => {
        if (!adminEmail) {
            setAuthErrorMessage('Please enter your admin email first.');
            return;
        }
        setResetSending(true);
        setResetMessage('');
        setAuthErrorMessage('');
        try {
            await auth.sendPasswordResetEmail(adminEmail.trim());
            setResetMessage(`Reset link successfully sent to ${adminEmail}! Check your inbox.`);
        } catch (err) {
            setAuthErrorMessage(err.message || 'Failed to send password reset email.');
        } finally {
            setResetSending(false);
        }
    };

    // In-App Change Password Handler
    const handleChangePasswordSubmit = async (e) => {
        e.preventDefault();
        if (!newPassword || newPassword.length < 8) {
            setPasswordModalError('New password must be at least 8 characters long.');
            return;
        }
        if (newPassword !== confirmNewPassword) {
            setPasswordModalError('New passwords do not match. Please verify.');
            return;
        }

        setPasswordModalSubmitting(true);
        setPasswordModalError('');
        setPasswordModalSuccess('');

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('No active admin session found. Please sign in again.');
            }

            // Re-authenticate if current password is provided (prevents auth/requires-recent-login)
            if (currentPassword) {
                const cred = firebase.auth.EmailAuthProvider.credential(user.email, currentPassword);
                await user.reauthenticateWithCredential(cred);
            }

            await user.updatePassword(newPassword);
            setPasswordModalSuccess('🎉 Admin password successfully changed!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmNewPassword('');
            setTimeout(() => {
                setShowPasswordModal(false);
                setPasswordModalSuccess('');
            }, 3000);
        } catch (err) {
            console.error('Change password failed:', err);
            if (err.code === 'auth/requires-recent-login') {
                setPasswordModalError('Security confirmation required: Please enter your current password above.');
            } else {
                setPasswordModalError(err.message || 'Failed to update password.');
            }
        } finally {
            setPasswordModalSubmitting(false);
        }
    };

    // Admin Logout Handler
    const handleSignOut = async () => {
        try {
            await auth.signOut();
            sessionStorage.removeItem('r7_admin_token');
            setIsAuthorized(false);
            setPasscodeKey('');
            setAdminPassword('');
            setSelectedTournament(null);
            setShowForm(false);
            scrubUrlParams();
        } catch (e) {
            console.error('Logout error:', e);
        }
    };

    // Date formatting helper for <input type="datetime-local" />
    const formatDateForInput = (val) => {
        if (!val) return '';
        try {
            const d = val.toDate ? val.toDate() : new Date(val);
            if (isNaN(d.getTime())) return '';
            const pad = (n) => String(n).padStart(2, '0');
            return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
        } catch {
            return '';
        }
    };

    // Date display helper
    const formatDisplayDate = (val) => {
        if (!val) return 'Schedule not set';
        try {
            const d = val.toDate ? val.toDate() : new Date(val);
            if (isNaN(d.getTime())) return 'Schedule not set';
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Schedule not set';
        }
    };

    // Helper: Determine tournament status
    const getTournamentStatus = (startVal, endVal) => {
        if (!startVal && !endVal) {
            return { label: 'No Schedule', color: 'bg-gray-700/60 text-gray-300 border-gray-600', dot: 'bg-gray-400' };
        }
        const now = new Date();
        const start = startVal ? (startVal.toDate ? startVal.toDate() : new Date(startVal)) : null;
        const end = endVal ? (endVal.toDate ? endVal.toDate() : new Date(endVal)) : null;

        if (start && now < start) {
            return { label: 'Upcoming', color: 'bg-amber-500/20 text-amber-300 border-amber-500/40', dot: 'bg-amber-400' };
        }
        if (end && now > end) {
            return { label: 'Ended', color: 'bg-rose-500/20 text-rose-300 border-rose-500/40', dot: 'bg-rose-400' };
        }
        return { label: 'Live Now', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40', dot: 'bg-emerald-400 animate-pulse' };
    };

    // Quick duration preset applicator
    const applyDurationPreset = (hours) => {
        const now = new Date();
        const start = startsAt ? new Date(startsAt) : now;
        const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
        if (!startsAt) {
            setStartsAt(formatDateForInput(start));
        }
        setEndsAt(formatDateForInput(end));
    };

    const setStartToNow = () => {
        setStartsAt(formatDateForInput(new Date()));
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
        setType('1v1');
        setCategory('trophy');
        setPrizePool('');
        setStartsAt('');
        setEndsAt('');
        setIsEditing(false);
        setEditingId(null);
    };

    const handleEditTournament = (tournament) => {
        setTournamentName(tournament.name || '');
        setDescription(tournament.description || '');
        setThumbnailURL(tournament.thumbnail || '');
        setSlots(tournament.slots || '');
        setDiscordLink(tournament.discordlink || '');
        setType(tournament.type || '1v1');
        setCategory(tournament.category || 'trophy');
        setPrizePool(tournament.prizePool !== undefined ? tournament.prizePool : '');
        setStartsAt(formatDateForInput(tournament.startsAt));
        setEndsAt(formatDateForInput(tournament.endsAt));
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
                slots: Number(slots) || 0,
                discordlink,
                type,
                category: category || 'trophy',
                prizePool: Number(prizePool) || 0,
                startsAt: startsAt ? new Date(startsAt).toISOString() : null,
                endsAt: endsAt ? new Date(endsAt).toISOString() : null,
                updatedAt: new Date(),
                ...(isEditing ? {} : { createdAt: new Date() })
            };

            if (isEditing) {
                await db.collection('tournaments').doc(editingId).update(tournamentData);
                setSuccessMessage('Tournament updated successfully');
            } else {
                await db.collection('tournaments').add(tournamentData); 
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

    const fetchLeaderboard = async (tournamentId) => {
        try {
            const lbSnapshot = await db.collection('tournaments').doc(tournamentId).collection('leaderboard').orderBy('totalScore', 'desc').get();
            const lbData = lbSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
            }));
            setLeaderboards(prev => ({ ...prev, [tournamentId]: lbData }));
        } catch (error) {
            console.error('Error fetching leaderboard: ', error);
        }
    };

    const handleManageTournaments = () => {
        setShowTournamentList(!showTournamentList);
        setSelectedTournament(null);
    };

    const handleTournamentClick = async (tournament) => {
        setSelectedTournament(tournament);
        await Promise.all([
            fetchTeams(tournament.id),
            fetchLeaderboard(tournament.id)
        ]);
    };

    // Force Sync an Individual Player's Matches
    const handleForceSyncPlayer = async (tournamentId, playerTag) => {
        if (!tournamentId || !playerTag) return;
        setSyncingPlayer(playerTag);
        setSyncStatusMsg(`Syncing ${playerTag}...`);

        try {
            const res = await axios.post('/api/brawlstars/sync', {
                tournamentId,
                playerTag
            });
            const pts = res.data.pointsAdded || 0;
            const newM = res.data.newMatchesFound || 0;
            setSuccessMessage(`Synced ${playerTag}: +${pts} pts from ${newM} new matches!`);
            await fetchLeaderboard(tournamentId);
        } catch (err) {
            console.error('Sync failed:', err);
            alert(`Failed to sync ${playerTag}: ${err.response?.data?.error || err.message}`);
        } finally {
            setSyncingPlayer(null);
            setSyncStatusMsg('');
            setTimeout(() => setSuccessMessage(''), 5000);
        }
    };

    // Force Sync All Registered Players
    const handleForceSyncAll = async (tournamentId) => {
        const currentLb = leaderboards[tournamentId] || [];
        if (currentLb.length === 0) {
            alert('No registered players found in the tournament leaderboard to sync.');
            return;
        }

        setSyncingPlayer('ALL');
        let totalNewMatches = 0;
        let totalPtsAdded = 0;

        for (let i = 0; i < currentLb.length; i++) {
            const p = currentLb[i];
            const tag = p.playerTag || p.id;
            setSyncStatusMsg(`Syncing player ${i + 1} of ${currentLb.length} (${tag})...`);
            try {
                const res = await axios.post('/api/brawlstars/sync', {
                    tournamentId,
                    playerTag: tag
                });
                if (res.data?.newMatchesFound > 0) {
                    totalNewMatches += res.data.newMatchesFound;
                    totalPtsAdded += (res.data.pointsAdded || 0);
                }
            } catch (err) {
                console.error(`Sync error for ${tag}:`, err);
            }
        }

        await fetchLeaderboard(tournamentId);
        setSyncingPlayer(null);
        setSyncStatusMsg('');
        setSuccessMessage(`✅ Force sync complete! ${currentLb.length} players updated (+${totalPtsAdded} pts, ${totalNewMatches} new matches)`);
        setTimeout(() => setSuccessMessage(''), 6000);
    };

    // =========================================================================
    // RENDER: Loading State
    // =========================================================================
    if (authChecking) {
        return (
            <div className="min-h-screen bg-gray-950 flex flex-col items-center justify-center text-white px-4">
                <Loader2 size={40} className="animate-spin text-yellow-500 mb-4" />
                <p className="text-gray-400 font-semibold text-sm">Verifying Admin Authorization...</p>
            </div>
        );
    }

    // =========================================================================
    // RENDER: Dual-Method Admin Authentication Gateway (If Not Authorized)
    // =========================================================================
    if (!isAuthorized) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white flex flex-col justify-center items-center px-4 py-12">
                <div className="w-full max-w-md">
                    {/* Header with Logo */}
                    <div className="text-center mb-8">
                        <img src={logo} alt="R7 Esports" className="h-16 mx-auto mb-3" />
                        <h1 className="text-2xl font-black uppercase tracking-wider text-white flex items-center justify-center gap-2">
                            <Lock size={20} className="text-yellow-500" />
                            <span>R7 Admin Gateway</span>
                        </h1>
                        <p className="text-xs text-gray-400 mt-1">Authorized tournament management access only</p>
                    </div>

                    {/* Dual Auth Container */}
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden p-6 sm:p-8">
                        {/* Tab Switcher */}
                        <div className="grid grid-cols-2 gap-2 bg-gray-950/80 p-1.5 rounded-xl border border-gray-800 mb-6">
                            <button
                                type="button"
                                onClick={() => { setAuthMethod('passcode'); setAuthErrorMessage(''); setResetMessage(''); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                    authMethod === 'passcode'
                                        ? 'bg-yellow-500 text-black shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Key size={14} />
                                <span>Passcode Key</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setAuthMethod('credentials'); setAuthErrorMessage(''); setResetMessage(''); }}
                                className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-xs font-bold transition-all ${
                                    authMethod === 'credentials'
                                        ? 'bg-yellow-500 text-black shadow-md'
                                        : 'text-gray-400 hover:text-white'
                                }`}
                            >
                                <Mail size={14} />
                                <span>Email & Password</span>
                            </button>
                        </div>

                        {/* Error Alert */}
                        {authErrorMessage && (
                            <div className="mb-5 bg-rose-500/10 border border-rose-500/40 text-rose-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                                <span>{authErrorMessage}</span>
                            </div>
                        )}

                        {/* Reset Email Success Alert */}
                        {resetMessage && (
                            <div className="mb-5 bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 p-3.5 rounded-xl text-xs font-semibold flex items-center gap-2.5">
                                <Check size={16} className="shrink-0 text-emerald-400" />
                                <span>{resetMessage}</span>
                            </div>
                        )}

                        {/* METHOD 1: Server-Verified Passcode Key Form */}
                        {authMethod === 'passcode' && (
                            <form 
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handlePasscodeLogin();
                                }} 
                                className="space-y-4"
                            >
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Admin Passcode Key
                                    </label>
                                    <div className="relative">
                                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={passcodeKey}
                                            onChange={(e) => setPasscodeKey(e.target.value)}
                                            placeholder="Enter secret admin key"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                    <p className="text-[11px] text-gray-500 mt-1">
                                        Verified securely against server environment credentials.
                                    </p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={authSubmitting}
                                    className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black font-black py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                >
                                    {authSubmitting ? <Loader2 size={16} className="animate-spin" /> : <ShieldCheck size={16} />}
                                    <span>{authSubmitting ? 'Verifying Key...' : 'Unlock Admin Portal'}</span>
                                </button>
                            </form>
                        )}

                        {/* METHOD 2: Firebase Email & Password Form */}
                        {authMethod === 'credentials' && (
                            <form onSubmit={handleCredentialsLogin} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Admin Email
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <input
                                            type="email"
                                            value={adminEmail}
                                            onChange={(e) => setAdminEmail(e.target.value)}
                                            placeholder="r7esports@gmail.com"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-4 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-500" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            value={adminPassword}
                                            onChange={(e) => setAdminPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-gray-950 border border-gray-700 rounded-xl pl-10 pr-10 py-3 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={authSubmitting}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-blue-500/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                                >
                                    {authSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                                    <span>{authSubmitting ? 'Authenticating...' : 'Sign In with Firebase'}</span>
                                </button>

                                {/* System in Code: Password Reset Email Trigger */}
                                <div className="pt-2 text-center border-t border-gray-800">
                                    <button
                                        type="button"
                                        onClick={handleSendPasswordReset}
                                        disabled={resetSending}
                                        className="text-xs text-yellow-500 hover:text-yellow-400 font-semibold underline disabled:opacity-50 transition-colors"
                                    >
                                        {resetSending ? 'Sending reset link...' : 'Forgot or want to reset password via email?'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>

                    <div className="text-center mt-6">
                        <button
                            onClick={() => navigate('/home')}
                            className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                        >
                            ← Return to R7 Esports Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const currentFormStatus = getTournamentStatus(startsAt, endsAt);

    // =========================================================================
    // RENDER: Full Authorized Admin Dashboard
    // =========================================================================
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-950 via-gray-900 to-gray-950 text-white pb-16">
            <div className="max-w-7xl mx-auto px-4 py-6">
                {/* Header with Admin Actions: Change Password & Sign Out */}
                <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
                    <BackButton path="/home" />
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-3 mr-2">
                            <img src={logo} alt="R7 Esports" className="h-12" />
                            <div>
                                <h1 className="text-xl font-black tracking-wider uppercase text-yellow-500">R7 Admin Hub</h1>
                                <p className="text-xs text-gray-400">Tournament Control & Brawl Stars Engine</p>
                            </div>
                        </div>

                        {/* In-Code System: Change Password Button */}
                        <button
                            onClick={() => {
                                setShowPasswordModal(true);
                                setPasswordModalError('');
                                setPasswordModalSuccess('');
                            }}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-yellow-500/20 text-gray-300 hover:text-yellow-400 rounded-xl text-xs font-bold border border-gray-700 hover:border-yellow-500/40 transition-all shadow-sm"
                            title="Change Admin Password"
                        >
                            <KeyRound size={14} className="text-yellow-500" />
                            <span>Change Password</span>
                        </button>

                        <button
                            onClick={handleSignOut}
                            className="flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-rose-900/40 text-gray-400 hover:text-rose-300 rounded-xl text-xs font-bold border border-gray-700 hover:border-rose-700/50 transition-all"
                            title="Sign out of admin"
                        >
                            <LogOut size={14} />
                            <span>Sign Out</span>
                        </button>
                    </div>
                </div>

                {/* Primary Action Buttons */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                    <button 
                        onClick={toggleForm}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all p-4 rounded-xl text-lg font-bold shadow-lg shadow-blue-500/20"
                    >
                        {showForm ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                        {showForm ? "Close Form" : "Create New Tournament"}
                    </button>
                    <button 
                        onClick={handleManageTournaments}
                        className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 transition-all p-4 rounded-xl text-lg font-bold shadow-lg shadow-purple-500/20"
                    >
                        <Users className="h-5 w-5" />
                        {showTournamentList ? "Close Manager" : "Manage Tournaments"}
                    </button>
                </div>

                {/* Status Messages */}
                {successMessage && (
                    <div className="mb-6 bg-emerald-600/90 text-white p-4 rounded-xl flex items-center gap-3 border border-emerald-500 shadow-lg">
                        <Check className="h-6 w-6 shrink-0" />
                        <p className="font-semibold">{successMessage}</p>
                    </div>
                )}

                {/* --- TOURNAMENT CREATION / EDIT FORM --- */}
                {showForm && (
                    <div className="mb-10 bg-gray-900 border border-gray-700/80 rounded-2xl p-6 sm:p-8 shadow-2xl">
                        <div className="flex items-center justify-between border-b border-gray-800 pb-4 mb-6">
                            <div>
                                <h2 className="text-2xl font-black tracking-wide text-white flex items-center gap-2">
                                    {isEditing ? <Edit className="h-6 w-6 text-yellow-500" /> : <Plus className="h-6 w-6 text-blue-500" />}
                                    {isEditing ? 'Edit Tournament' : 'Create New Tournament'}
                                </h2>
                                <p className="text-sm text-gray-400 mt-1">Configure modes, scheduling, cumulative scoring window, and prize pools.</p>
                            </div>
                            <button onClick={toggleForm} className="p-2 hover:bg-gray-800 rounded-lg text-gray-400 hover:text-white">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Tournament Name */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300">Tournament Name</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={tournamentName}
                                            onChange={(e) => setTournamentName(e.target.value)}
                                            className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="e.g. Brawl Masters Weekly Cup"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Tournament Type (Team Size) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300">Format / Team Size</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <select
                                            value={type}
                                            onChange={(e) => setType(e.target.value)}
                                            className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-10 pr-4 py-3 appearance-none focus:ring-2 focus:ring-blue-500 focus:outline-none font-medium"
                                            required
                                        >
                                            <option value="1v1">Solo (1v1) - Solo Showdown & Ranked</option>
                                            <option value="2v2">Duo (2v2) - Duo Showdown</option>
                                            <option value="3v3">Squad (3v3) - Gem Grab, Brawl Ball, Bounty</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                    </div>
                                </div>

                                {/* Tournament Category: Trophy vs Ranked */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300 flex items-center justify-between">
                                        <span>Brawl Stars Mode Category</span>
                                        <span className="text-xs text-yellow-500 font-bold uppercase tracking-wider">Scoring Filter</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setCategory('trophy')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                                                category === 'trophy' 
                                                    ? 'bg-amber-500/20 border-amber-500 text-amber-300 ring-2 ring-amber-500/50 shadow-lg shadow-amber-500/10' 
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                            }`}
                                        >
                                            <Trophy size={18} className={category === 'trophy' ? 'text-amber-400' : ''} />
                                            <span>Trophy Ladder</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setCategory('ranked')}
                                            className={`p-3 rounded-xl border flex items-center justify-center gap-2 font-bold text-sm transition-all ${
                                                category === 'ranked' 
                                                    ? 'bg-purple-500/20 border-purple-500 text-purple-300 ring-2 ring-purple-500/50 shadow-lg shadow-purple-500/10' 
                                                    : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                                            }`}
                                        >
                                            <Swords size={18} className={category === 'ranked' ? 'text-purple-400' : ''} />
                                            <span>Ranked Mode</span>
                                        </button>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {category === 'trophy' 
                                            ? '🏆 Filters & tracks standard trophy ladder matches only (Ranked battles excluded).' 
                                            : '⚔️ Filters & tracks soloRanked / teamRanked competitive battles only.'}
                                    </p>
                                </div>

                                {/* Prize Pool (INR) */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300">Prize Pool (INR ₹)</label>
                                    <div className="relative">
                                        <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                                        <input
                                            type="number"
                                            value={prizePool}
                                            onChange={(e) => setPrizePool(e.target.value)}
                                            className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="5000"
                                            min="0"
                                        />
                                    </div>
                                    <div className="flex gap-2 pt-1">
                                        {[1000, 2500, 5000, 10000].map(amt => (
                                            <button
                                                key={amt}
                                                type="button"
                                                onClick={() => setPrizePool(amt)}
                                                className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2.5 py-1 rounded-lg text-emerald-400 font-bold transition-all"
                                            >
                                                ₹{amt.toLocaleString()}
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            onClick={() => setPrizePool(0)}
                                            className="text-xs bg-gray-800 hover:bg-gray-700 border border-gray-700 px-2.5 py-1 rounded-lg text-gray-400 font-medium"
                                        >
                                            Free
                                        </button>
                                    </div>
                                </div>

                                {/* DEDICATED TIME SECTION */}
                                <div className="md:col-span-2 bg-gray-800/60 border border-indigo-500/30 rounded-2xl p-5 space-y-4">
                                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-700/60 pb-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-indigo-400" />
                                            <h3 className="font-bold text-base text-white">Tournament Time & Scheduling</h3>
                                            <span className="text-xs text-gray-400">(Cumulative matches outside this window are ignored)</span>
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-2 ${currentFormStatus.color}`}>
                                            <span className={`w-2 h-2 rounded-full ${currentFormStatus.dot}`} />
                                            <span>{currentFormStatus.label}</span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center justify-between">
                                                <label className="text-xs font-bold uppercase tracking-wider text-gray-300">Start Time</label>
                                                <button
                                                    type="button"
                                                    onClick={setStartToNow}
                                                    className="text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                                                >
                                                    Set to Now
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="datetime-local"
                                                    value={startsAt}
                                                    onChange={(e) => setStartsAt(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <label className="text-xs font-bold uppercase tracking-wider text-gray-300">End Time</label>
                                            <div className="relative">
                                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                                                <input
                                                    type="datetime-local"
                                                    value={endsAt}
                                                    onChange={(e) => setEndsAt(e.target.value)}
                                                    className="w-full bg-gray-900 border border-gray-700 rounded-xl pl-10 pr-3 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="pt-2 border-t border-gray-700/50">
                                        <p className="text-xs text-gray-400 font-semibold mb-2 flex items-center gap-1.5">
                                            <Sparkles size={14} className="text-indigo-400" />
                                            <span>Quick Duration Presets (Auto-calculates End Time from Start):</span>
                                        </p>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                onClick={() => applyDurationPreset(1)}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs font-bold text-gray-200 transition-all hover:scale-105"
                                            >
                                                ⚡ 1 Hour Blitz
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyDurationPreset(12)}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs font-bold text-gray-200 transition-all hover:scale-105"
                                            >
                                                ⏱️ 12 Hours Mini
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyDurationPreset(24)}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs font-bold text-gray-200 transition-all hover:scale-105"
                                            >
                                                📅 24 Hours (1 Day)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyDurationPreset(48)}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs font-bold text-gray-200 transition-all hover:scale-105"
                                            >
                                                🏆 Weekend 48h
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyDurationPreset(168)}
                                                className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded-lg text-xs font-bold text-gray-200 transition-all hover:scale-105"
                                            >
                                                🌟 7 Days Week
                                            </button>
                                            {(startsAt || endsAt) && (
                                                <button
                                                    type="button"
                                                    onClick={() => { setStartsAt(''); setEndsAt(''); }}
                                                    className="px-3 py-1.5 bg-red-900/30 hover:bg-red-900/50 border border-red-700/60 rounded-lg text-xs font-bold text-red-300 transition-all"
                                                >
                                                    Clear Time
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Thumbnail Upload */}
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-300">Tournament Thumbnail Banner</label>
                                    <div className="relative border-2 border-dashed border-gray-700 rounded-2xl p-4 bg-gray-800/40 hover:bg-gray-800/70 transition-all text-center">
                                        {isUploading ? (
                                            <div className="flex flex-col items-center gap-2 py-6">
                                                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                                                <p className="text-sm text-gray-400">Uploading to Cloudinary CDN...</p>
                                            </div>
                                        ) : thumbnailURL ? (
                                            <div className="relative inline-block">
                                                <img src={thumbnailURL} alt="Preview" className="h-40 rounded-xl object-cover mx-auto shadow-2xl border border-gray-700" />
                                                <button 
                                                    type="button"
                                                    onClick={() => setThumbnailURL('')}
                                                    className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1.5 hover:bg-red-500 shadow-lg"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <label className="cursor-pointer flex flex-col items-center gap-2 py-6">
                                                <Upload className="h-9 w-9 text-gray-400" />
                                                <span className="text-sm font-medium text-gray-300">Click to upload tournament cover image</span>
                                                <span className="text-xs text-gray-500">PNG, JPG, or WEBP (16:9 recommended)</span>
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
                                <div className="space-y-2 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-300">Description / Rules</label>
                                    <div className="relative">
                                        <AlertCircle className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                        <textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            rows={3}
                                            className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="Cumulative points tournament rules, guidelines, eligibility..."
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Slots */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300">Available Slots</label>
                                    <div className="relative">
                                        <Users className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="number"
                                            value={slots}
                                            onChange={(e) => setSlots(e.target.value)}
                                            className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="e.g. 50 or 100"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Discord Link */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-300">Discord Server Link</label>
                                    <div className="relative">
                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                        <input
                                            type="text"
                                            value={discordlink}
                                            onChange={(e) => setDiscordLink(e.target.value)}
                                            className="w-full bg-gray-800/90 border border-gray-700 rounded-xl pl-10 pr-4 py-3 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                            placeholder="https://discord.gg/..."
                                            required
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white px-6 py-4 rounded-xl font-black text-lg transition-all shadow-xl shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {isEditing ? <Edit className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                                {isEditing ? 'Save Tournament Changes' : 'Publish Tournament'}
                            </button>
                        </form>
                    </div>
                )}

                {/* --- TOURNAMENT CARDS LIST VIEW --- */}
                {showTournamentList && !selectedTournament && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-2xl font-black tracking-wide">All Tournaments ({tournaments.length})</h2>
                            <p className="text-sm text-gray-400">Click any tournament to view registered players & trigger score sync</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {tournaments.map(tournament => {
                                const status = getTournamentStatus(tournament.startsAt, tournament.endsAt);
                                return (
                                    <div 
                                        key={tournament.id} 
                                        className="bg-gray-900 border border-gray-800 hover:border-indigo-500/80 rounded-2xl overflow-hidden transition-all duration-300 shadow-xl flex flex-col group"
                                    >
                                        <div className="relative h-48 overflow-hidden bg-gray-800">
                                            <img 
                                                src={tournament.thumbnail} 
                                                alt={tournament.name} 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-gray-950/40 to-transparent" />
                                            
                                            <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-md ${status.color}`}>
                                                <span className={`w-2 h-2 rounded-full ${status.dot}`} />
                                                <span>{status.label}</span>
                                            </div>

                                            <div className="absolute top-3 right-3 flex items-center gap-1">
                                                {tournament.category === 'ranked' ? (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-900/80 text-purple-200 border border-purple-500/40 backdrop-blur-md flex items-center gap-1">
                                                        <Swords size={12} /> Ranked
                                                    </span>
                                                ) : (
                                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-900/80 text-amber-200 border border-amber-500/40 backdrop-blur-md flex items-center gap-1">
                                                        <Trophy size={12} /> Trophy
                                                    </span>
                                                )}
                                            </div>

                                            {tournament.prizePool > 0 && (
                                                <div className="absolute bottom-3 left-3 px-3 py-1 rounded-lg text-xs font-black bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 backdrop-blur-md flex items-center gap-1">
                                                    <IndianRupee size={12} />
                                                    <span>₹{Number(tournament.prizePool).toLocaleString()}</span>
                                                </div>
                                            )}

                                            <div className="absolute bottom-3 right-3 flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleEditTournament(tournament)} 
                                                    className="p-2 bg-blue-600/90 hover:bg-blue-500 text-white rounded-lg transition-colors backdrop-blur-md"
                                                    title="Edit Tournament"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                                <button 
                                                    onClick={() => handleDeleteTournament(tournament.id)} 
                                                    className="p-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg transition-colors backdrop-blur-md"
                                                    title="Delete Tournament"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div 
                                            className="p-5 flex-1 flex flex-col justify-between cursor-pointer"
                                            onClick={() => handleTournamentClick(tournament)}
                                        >
                                            <div>
                                                <h3 className="text-lg font-black text-white group-hover:text-indigo-400 transition-colors line-clamp-1 mb-1.5">
                                                    {tournament.name}
                                                </h3>
                                                <p className="text-gray-400 text-xs line-clamp-2 mb-4">
                                                    {tournament.description}
                                                </p>
                                            </div>

                                            <div className="border-t border-gray-800/80 pt-3 space-y-2 text-xs text-gray-400">
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5"><Users size={14} className="text-blue-400" /> Slots: {tournament.slots}</span>
                                                    <span className="font-semibold text-gray-300 uppercase">{tournament.type}</span>
                                                </div>
                                                <div className="flex items-center justify-between">
                                                    <span className="flex items-center gap-1.5"><Clock size={14} className="text-indigo-400" /> Window:</span>
                                                    <span className="text-gray-300 font-medium">
                                                        {tournament.startsAt ? formatDisplayDate(tournament.startsAt) : 'Anytime'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* --- SELECTED TOURNAMENT PARTICIPANTS & SYNC MANAGER --- */}
                {selectedTournament && (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in duration-300">
                        <div className="p-6 border-b border-gray-800 bg-gray-900/80 flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Tournament Details & Management</span>
                                    {selectedTournament.category === 'ranked' ? (
                                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-purple-900/60 text-purple-300 border border-purple-500/30 flex items-center gap-1">
                                            <Swords size={10} /> Ranked Mode
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-[11px] font-black bg-amber-900/60 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                                            <Trophy size={10} /> Trophy Ladder
                                        </span>
                                    )}
                                </div>
                                <h2 className="text-3xl font-black text-white">{selectedTournament.name}</h2>
                                <p className="text-sm text-gray-400 mt-1 flex items-center gap-3">
                                    <span>Time: {formatDisplayDate(selectedTournament.startsAt)} - {formatDisplayDate(selectedTournament.endsAt)}</span>
                                    {selectedTournament.prizePool > 0 && (
                                        <span className="text-emerald-400 font-bold">Prize Pool: ₹{Number(selectedTournament.prizePool).toLocaleString()}</span>
                                    )}
                                </p>
                            </div>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => handleForceSyncAll(selectedTournament.id)}
                                    disabled={syncingPlayer !== null}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-black font-black text-sm rounded-xl shadow-lg transition-all disabled:opacity-50"
                                >
                                    {syncingPlayer === 'ALL' ? (
                                        <RefreshCw size={16} className="animate-spin" />
                                    ) : (
                                        <Zap size={16} />
                                    )}
                                    <span>{syncingPlayer === 'ALL' ? 'Syncing All...' : 'Force Sync All Players'}</span>
                                </button>
                                <button 
                                    onClick={() => handleEditTournament(selectedTournament)} 
                                    className="p-2.5 bg-gray-800 hover:bg-gray-700 text-gray-200 rounded-xl transition-colors"
                                    title="Edit Tournament Settings"
                                >
                                    <Edit size={18} />
                                </button>
                                <button 
                                    onClick={() => setSelectedTournament(null)} 
                                    className="p-2.5 hover:bg-gray-800 rounded-xl text-gray-400 hover:text-white transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>

                        {syncStatusMsg && (
                            <div className="bg-indigo-900/70 border-y border-indigo-700/60 px-6 py-3 flex items-center gap-3 text-indigo-200 text-sm">
                                <RefreshCw size={16} className="animate-spin text-indigo-400 shrink-0" />
                                <span>{syncStatusMsg}</span>
                            </div>
                        )}

                        <div className="p-6 space-y-8">
                            <div>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-yellow-500" />
                                        <h3 className="text-xl font-bold text-white">Live Leaderboard & Scored Players</h3>
                                        <span className="text-xs bg-gray-800 px-2.5 py-1 rounded-full text-gray-400 font-bold">
                                            {leaderboards[selectedTournament.id]?.length || 0} Registered
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">Cumulative points from start till end</p>
                                </div>

                                {leaderboards[selectedTournament.id]?.length > 0 ? (
                                    <div className="border border-gray-800 rounded-xl overflow-hidden bg-gray-950/60">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-gray-800/80 text-gray-400 text-xs uppercase tracking-wider border-b border-gray-800">
                                                <tr>
                                                    <th className="py-3 px-4">Rank</th>
                                                    <th className="py-3 px-4">Player / Tag</th>
                                                    <th className="py-3 px-4 text-center">Matches</th>
                                                    <th className="py-3 px-4 text-right">Total Points</th>
                                                    <th className="py-3 px-4 text-center">Admin Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-800/60">
                                                {leaderboards[selectedTournament.id].map((player, idx) => {
                                                    const tag = player.playerTag || player.id;
                                                    const isPlayerSyncing = syncingPlayer === tag;
                                                    return (
                                                        <tr key={tag} className="hover:bg-gray-850/50 transition-colors">
                                                            <td className="py-3 px-4 font-black text-gray-300">
                                                                #{idx + 1}
                                                            </td>
                                                            <td className="py-3 px-4">
                                                                <div className="font-bold text-white">{player.playerName || 'Player'}</div>
                                                                <div className="text-xs font-mono text-yellow-500">{tag}</div>
                                                            </td>
                                                            <td className="py-3 px-4 text-center font-semibold text-gray-300">
                                                                {player.matchesPlayed || 0}
                                                            </td>
                                                            <td className="py-3 px-4 text-right">
                                                                <span className="text-base font-black text-yellow-400">
                                                                    {(player.totalScore || 0).toLocaleString()}
                                                                </span>
                                                                <span className="text-xs text-gray-500 ml-1">pts</span>
                                                            </td>
                                                            <td className="py-3 px-4 text-center">
                                                                <button
                                                                    onClick={() => handleForceSyncPlayer(selectedTournament.id, tag)}
                                                                    disabled={syncingPlayer !== null}
                                                                    className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-xs font-bold text-indigo-300 rounded-lg border border-gray-700 transition-all flex items-center justify-center gap-1.5 mx-auto disabled:opacity-50"
                                                                >
                                                                    <RefreshCw size={12} className={isPlayerSyncing ? 'animate-spin' : ''} />
                                                                    <span>{isPlayerSyncing ? 'Syncing...' : 'Sync Score'}</span>
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                ) : (
                                    <div className="text-center py-10 bg-gray-950/40 border border-dashed border-gray-800 rounded-xl text-gray-400">
                                        <Trophy className="h-10 w-10 mx-auto mb-2 opacity-30 text-yellow-500" />
                                        <p className="font-medium">No Brawl Stars players on this leaderboard yet.</p>
                                        <p className="text-xs text-gray-500 mt-1">Players will appear here once they register or sync on the tournament page.</p>
                                    </div>
                                )}
                            </div>

                            {teams[selectedTournament.id]?.length > 0 && (
                                <div className="border-t border-gray-800 pt-6">
                                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                        <Users className="h-5 w-5 text-blue-400" />
                                        <span>Registered Teams & Rosters ({teams[selectedTournament.id].length})</span>
                                    </h3>
                                    <div className="space-y-3">
                                        {teams[selectedTournament.id].map(team => (
                                            <details key={team.id} className="bg-gray-800/40 rounded-xl border border-gray-800 group transition-all">
                                                <summary className="p-4 cursor-pointer font-bold hover:bg-gray-800/80 rounded-xl transition-colors flex items-center justify-between">
                                                    <span className="flex items-center gap-2 text-white">
                                                        <Users size={16} className="text-indigo-400" />
                                                        {team.teamName || team.discordUsername || 'Team Entry'}
                                                    </span>
                                                    <ChevronDown className="h-5 w-5 text-gray-400 transform group-open:rotate-180 transition-transform" />
                                                </summary>
                                                <div className="p-4 border-t border-gray-800 bg-gray-900/60 space-y-3 text-sm">
                                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                                        <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                                                            <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Player 1</p>
                                                            <p className="font-semibold text-white">{team.player1InGameName || team.brawlStarsName || team.discordUsername || 'Player'}</p>
                                                            <p className="text-xs font-mono text-gray-400">{team.player1Id || team.playerTag || 'N/A'}</p>
                                                        </div>
                                                        {team.player2Id && (
                                                            <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                                                                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Player 2</p>
                                                                <p className="font-semibold text-white">{team.player2InGameName}</p>
                                                                <p className="text-xs font-mono text-gray-400">{team.player2Id}</p>
                                                            </div>
                                                        )}
                                                        {team.player3Id && (
                                                            <div className="p-3 bg-gray-950/60 rounded-lg border border-gray-800">
                                                                <p className="text-xs text-indigo-400 font-bold uppercase tracking-wider mb-1">Player 3</p>
                                                                <p className="font-semibold text-white">{team.player3InGameName}</p>
                                                                <p className="text-xs font-mono text-gray-400">{team.player3Id}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </details>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* ========================================================================= */}
            {/* IN-CODE SYSTEM: Change Admin Password Modal */}
            {/* ========================================================================= */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
                        <button 
                            onClick={() => setShowPasswordModal(false)}
                            className="absolute top-5 right-5 text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-500">
                                <KeyRound size={22} />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-white">Change Admin Password</h3>
                                <p className="text-xs text-gray-400">Update the Firebase authentication password</p>
                            </div>
                        </div>

                        {passwordModalError && (
                            <div className="mb-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 p-3 rounded-xl text-xs flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0 text-rose-400" />
                                <span>{passwordModalError}</span>
                            </div>
                        )}

                        {passwordModalSuccess && (
                            <div className="mb-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 p-3 rounded-xl text-xs flex items-center gap-2">
                                <Check size={16} className="shrink-0 text-emerald-400" />
                                <span>{passwordModalSuccess}</span>
                            </div>
                        )}

                        <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                    Current Password (Optional if recent)
                                </label>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Enter current password if prompted"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                />
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                        New Password
                                    </label>
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="text-xs text-gray-400 hover:text-white flex items-center gap-1"
                                    >
                                        {showNewPassword ? <EyeOff size={12} /> : <Eye size={12} />}
                                        <span>{showNewPassword ? 'Hide' : 'Show'}</span>
                                    </button>
                                </div>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Minimum 8 characters"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                                    Confirm New Password
                                </label>
                                <input
                                    type={showNewPassword ? 'text' : 'password'}
                                    value={confirmNewPassword}
                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                    placeholder="Re-enter new password"
                                    className="w-full bg-gray-950 border border-gray-700 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-yellow-500 focus:outline-none"
                                    required
                                />
                            </div>

                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="flex-1 px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-bold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={passwordModalSubmitting}
                                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-yellow-500 to-amber-500 hover:from-yellow-400 hover:to-amber-400 text-black text-sm font-black rounded-xl transition-all shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {passwordModalSubmitting ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                                    <span>{passwordModalSubmitting ? 'Updating...' : 'Update Password'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
