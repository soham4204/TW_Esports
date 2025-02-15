import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase-config';
import { User, Mail, GamepadIcon, Save } from 'lucide-react';
import Navbar from '../components/Navbar';

const ProfileComponent = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [editedUsername, setEditedUsername] = useState('');
    const [editedBrawlstarsId, setEditedBrawlstarsId] = useState('');

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
            if (userAuth) {
                const userRef = db.collection('users').doc(userAuth.uid);
                const snapshot = await userRef.get();
                if (snapshot.exists) {
                    setUserData(snapshot.data());
                    setEditedUsername(snapshot.data().username);
                    setEditedBrawlstarsId(snapshot.data().brawlstarsId);
                }
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const handleSave = async () => {
        const userAuth = auth.currentUser;
        if (userAuth) {
            const userRef = db.collection('users').doc(userAuth.uid);
            await userRef.update({
                username: editedUsername,
                brawlstarsId: editedBrawlstarsId
            });
            setUserData({ ...userData, username: editedUsername, brawlstarsId: editedBrawlstarsId });
            setEditMode(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-900 text-white">
                <div className="text-center">
                    <svg className="animate-spin h-10 w-10 text-blue-500 mx-auto" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="mt-4">Loading your Profile...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen w-full bg-slate-900">
            <Navbar />
            <div className="p-6 max-w-2xl mx-auto">
                <div className="border rounded-lg border-slate-400 shadow-md bg-slate-900 text-white">
                    <div className="p-4 border-b border-slate-700">
                        <div className="flex items-center gap-2">
                            <User className="h-6 w-6 text-blue-300" />
                            <h2 className="text-lg font-semibold">Profile Information</h2>
                        </div>
                    </div>
                    <div className="p-4 space-y-4">
                        {userData && (
                            <>
                                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                                    <Mail className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-sm text-blue-400">Email</p>
                                        <p className="font-medium">{userData.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                                    <User className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-sm text-blue-400">Username</p>
                                        {editMode ? (
                                            <input
                                                className="bg-slate-700 p-2 rounded w-full"
                                                value={editedUsername}
                                                onChange={(e) => setEditedUsername(e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-medium">{userData.username}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 bg-slate-800 rounded-lg">
                                    <GamepadIcon className="h-5 w-5 text-blue-400" />
                                    <div>
                                        <p className="text-sm text-blue-400">Brawl Stars ID</p>
                                        {editMode ? (
                                            <input
                                                className="bg-slate-700 p-2 rounded w-full"
                                                value={editedBrawlstarsId}
                                                onChange={(e) => setEditedBrawlstarsId(e.target.value)}
                                            />
                                        ) : (
                                            <p className="font-medium">{userData.brawlstarsId}</p>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 mt-4">
                                    {editMode ? (
                                        <button
                                            onClick={handleSave}
                                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg"
                                        >
                                            <Save className="h-5 w-5" /> Save
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setEditMode(true)}
                                            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg"
                                        >
                                            Edit
                                        </button>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfileComponent;
