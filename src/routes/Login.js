import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // Import useNavigate
import PasswordInput from '../components/PasswordInput';
import TextInput from '../components/TextInput';
import logo from '../assets/Logo.png';
import BackButton from '../components/BackButton';
import { auth } from '../firebase-config';

const LoginComponent = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate(); 

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await auth.signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            if (user.email === 'twesports29@gmail.com') {
                navigate('/admindashboard'); // Navigate to admin dashboard
            } else {
                navigate('/home'); // Navigate to home page
            }
        } catch (error) {
            setError(error.message);
        }
    };
    

    return (
        <div className="flex flex-col items-center justify-center h-screen overflow-auto bg-gray-900 text-white">
            <div className="text-center h-full">
                <div className="mt-4 flex float-start">
                    <BackButton path="/"/>
                </div>
                <div className="w-full flex justify-center mt-6">
                    <img src={logo} alt="TW Esports Logo" className="flex h-24 mb-8" />
                </div>
                <h1 className="text-3xl font-bold">Welcome to</h1>
                <h2 className="text-3xl font-bold mb-2">TW Esports</h2>
                <form className="mt-2 flex flex-col justify-center" onSubmit={handleSubmit}>
                    <TextInput label="Email" name="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                    <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} /> {/* Fixed onchange to onChange */}
                    {error && <p className="text-red-500">Incorrect Credentials</p>} {/* Display error message */}
                    <button type="submit" className="ml-4 bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold m-4">Login</button>
                </form>
                <p>Don't have an account? <Link to="/register" className="text-blue-500">Register here</Link></p>
                <p>Forgot Password? <Link to="/forgotpassword" className="text-blue-500">Click here</Link></p>

            </div>
        </div>
    )
}

export default LoginComponent;
