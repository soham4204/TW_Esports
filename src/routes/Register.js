import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import logo from '../assets/Logo.png';
import BackButton from '../components/BackButton';
import { auth } from '../firebase-config';
import { ArrowRight, Mail, User, GamepadIcon } from 'lucide-react';
import { db } from '../firebase-config';

const RegisterComponent = () => {
    const [formData, setFormData] = useState({
        email: '',
        username: '',
        brawlstarsId: '',
        password: '',
    });
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(formData.email, formData.password);
            const user = userCredential.user;

            await db.collection('users').doc(user.uid).set({
                email: formData.email,
                username: formData.username,
                brawlstarsId: formData.brawlstarsId
            });
            navigate('/home');
        } catch (error) {
            setError(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white">
            <div className="max-w-md mx-auto px-4 py-8">
                <div className="relative">
                    <BackButton path="/" />
                    <div className="flex justify-center mb-8">
                        <img src={logo} alt="TW Esports Logo" className="h-24 transform hover:scale-105 transition-transform duration-300" />
                    </div>
                </div>

                <div className="bg-gray-800 bg-opacity-50 rounded-2xl p-8 backdrop-blur-sm shadow-xl">
                    <h1 className="text-3xl font-bold text-center mb-2">
                        Create Account
                    </h1>
                    <p className="text-gray-400 text-center mb-8">Join the Brawl Stars community</p>

                    <form onSubmit={handleRegister} className="space-y-6">
                        <div className="space-y-4">
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="Email"
                                    className="w-full bg-gray-700 bg-opacity-50 rounded-lg py-3 px-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                                    placeholder="Username"
                                    className="w-full bg-gray-700 bg-opacity-50 rounded-lg py-3 px-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <GamepadIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                                <input
                                    type="text"
                                    value={formData.brawlstarsId}
                                    onChange={(e) => setFormData({...formData, brawlstarsId: e.target.value})}
                                    placeholder="Brawl Stars ID"
                                    className="w-full bg-gray-700 bg-opacity-50 rounded-lg py-3 px-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    placeholder="Password"
                                    className="w-full bg-gray-700 bg-opacity-50 rounded-lg py-3 px-10 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-500 bg-opacity-20 border border-red-500 rounded-lg p-3 text-red-500 text-sm text-center">
                                User already exists
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-3 rounded-lg font-semibold transform transition-all hover:scale-105 flex items-center justify-center space-x-2"
                        >
                            {isLoading ? (
                                <div className="w-6 h-6 border-t-2 border-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>Create Account</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-gray-400">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterComponent;