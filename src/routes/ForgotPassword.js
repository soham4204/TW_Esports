import React, { useState } from 'react';
import logo from '../assets/Logo.png';
import { auth } from '../firebase-config';

const ForgotPasswordComponent = () => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState(null);
    const [message, setMessage] = useState(null);
    const [loading, setLoading] = useState(false);

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await auth.sendPasswordResetEmail(email);
            setMessage('Password reset email sent. Please check your inbox.');
            setError(null);
        } catch (error) {
            setError(error.message);
            setMessage(null);
        }
        setLoading(false);
    };

    return (
        <div className="flex flex-col overflow-auto items-center justify-center h-screen bg-gray-900 text-white">
            <div className="text-center h-full">
                <div className="w-full flex justify-center mt-6">
                    <img src={logo} alt="TW Esports Logo" className="flex h-24 mb-8" />
                </div>
                <h1 className="mt-2 text-3xl font-bold">Forgot Password</h1>
                <form className="mt-8 flex flex-col justify-center" onSubmit={handleResetPassword}>
                    <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 mb-4 focus:outline-none focus:border-blue-500" />
                    <button type="submit" disabled={loading} className="ml-4 bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold m-4">
                        {loading ? 'Sending...' : 'Reset Password'}
                    </button>
                    {error && <p className="text-red-500">{error}</p>}
                    {message && <p className="text-green-500">{message}</p>}
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordComponent;
