import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PasswordInput from '../components/PasswordInput';
import TextInput from '../components/TextInput';
import logo from '../assets/Logo.png';
import BackButton from '../components/BackButton';
import { auth, db } from '../firebase-config';

const RegisterComponent = () => {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [brawlstarsId, setBrawlstarsId] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        
        try {
            const userCredential = await auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            await db.collection('users').doc(user.uid).set({
                email,
                username,
                brawlstarsId
            });
            navigate('/home');
        } catch (error) {
            setError(error.message);
            console.error(error);
        }
    };

    return (
        <div className="flex flex-col overflow-auto items-center justify-center h-screen bg-gray-900 text-white">
            <div className="text-center h-full">
                <div className="mt-4 flex float-start">
                    <BackButton path="/"/>
                </div>
                <div className="w-full flex justify-center mt-6">
                    <img src={logo} alt="TW Esports Logo" className="flex h-24 mb-8" />
                </div>
                <h1 className="mt-2 text-3xl font-bold">Register with</h1>
                <h2 className="text-3xl font-bold mb-8">TW Esports</h2>
                <form className="mt-8 flex flex-col justify-center" onSubmit={handleRegister}>
                    <TextInput label="Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <TextInput label="Username" name="username" value={username} onChange={(e) => setUsername(e.target.value)} />
                    <TextInput label="BrawlStars_Id" name="brawlstars_id" value={brawlstarsId} onChange={(e) => setBrawlstarsId(e.target.value)} />
                    <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
                    {error && <p className="text-red-500">User Already Exists</p>}
                    <button type="submit" className="ml-4 bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold m-4">Register</button>
                </form>
                <p>Already have an account? <Link to="/login" className="text-blue-500">Login here</Link></p>
            </div>
        </div>
    );
};

export default RegisterComponent;
