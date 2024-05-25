import React, { useState, useEffect } from 'react';
import logo from '../assets/Logo.png';
import { auth, db } from '../firebase-config';
import BackButton from '../components/BackButton';

const ProfileComponent = () => {
    const [userData, setUserData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (userAuth) => {
            console.log('User Auth:', userAuth);
            if (userAuth) {
                const userRef = db.collection('users').doc(userAuth.uid);
                const snapshot = await userRef.get();
                if (snapshot.exists) {
                    setUserData(snapshot.data());
                } else {
                    console.log('User data not found');
                }
                setLoading(false);
            } else {
                console.log('User not logged in');
                setLoading(false);
            }
        });

        return unsubscribe;
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
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
        <div className="flex flex-col overflow-auto items-center justify-center h-screen w-full bg-gray-900 text-white">
            <div className="text-center h-full w-4/5">
                <div className="mt-4 flex float-start">
                    <BackButton path="/home"/>
                </div>
                <div className="w-full flex justify-center mt-6">
                    <img src={logo} alt="TW Esports Logo" className="flex h-24 mb-8" />
                </div>
                <h1 className="mt-2 text-3xl font-bold">Profile</h1>
                {userData && (
                    <div className="mt-8 flex flex-col justify-center">
                        <p><strong>Email:</strong> {userData.email}</p>
                        <p><strong>Username:</strong> {userData.username}</p>
                        <p><strong>Brawl Stars ID:</strong> {userData.brawlstarsId}</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProfileComponent;
