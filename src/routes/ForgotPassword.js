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
        <div className="h-screen w-full bg-slate-900 text-white">
            <div className="p-6 max-w-3xl mx-auto">
                <div className="border rounded-lg shadow-md bg-slate-900">
                    <div className="p-8 text-center">
                        <img src={logo} alt="TW Esports Logo" className="h-32 mx-auto mb-6" />
                        <h1 className="text-3xl font-bold mb-6">Forgot Password</h1>
                        <form onSubmit={handleResetPassword} className="space-y-6">
                            <input 
                                type="email" 
                                placeholder="Email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required 
                                className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 w-full focus:outline-none focus:border-blue-500"
                            />
                            <button 
                                type="submit" 
                                disabled={loading} 
                                className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg text-lg font-semibold"
                            >
                                {loading ? 'Sending...' : 'Reset Password'}
                            </button>
                            {error && (
                                <p className="text-red-500 mt-4">
                                    {error}
                                </p>
                            )}
                            {message && (
                                <p className="text-green-500 mt-4">
                                    {message}
                                </p>
                            )}
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPasswordComponent;
