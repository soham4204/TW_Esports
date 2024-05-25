// JoinUsPage.js
import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo.png';

const JoinUsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-900 text-white w-full">
      <div className="text-center w-4/5">
        <h1 className="text-3xl font-bold text-blue-400">Welcome to</h1>
        <h2 className="text-5xl font-bold mb-8">TW Esports</h2>
        <div className="mt-8 flex justify-center">
          <img src={logo} alt="TW Esports Logo" className="h-16 mb-8" />
        </div>
        <p className="text-lg mb-2">The ultimate destination for competitive gaming!</p>
        <p className="text-lg my-2 text-blue-400">Join our community today, Play for Free and Earn!</p>
        <button className="bg-blue-500 text-white px-8 py-3 rounded-lg text-lg font-semibold my-2">
          <Link to="/register">Join Us</Link>
        </button>
        <p className="text-lg">Already have an account?</p>
        <Link to="/login" className="text-blue-500">Login here</Link>      
      </div>
    </div>
  );
};

export default JoinUsPage;
