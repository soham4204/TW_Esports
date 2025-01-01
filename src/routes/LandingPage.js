import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Gamepad2, Coins } from 'lucide-react';
import AdComponent from '../components/AdComponent';

const JoinUsPage = () => {
  const features = [
    {
      icon: <Trophy className="w-8 h-8 text-yellow-400" />,
      title: "Competitive Tournaments",
      description: "Join daily tournaments and climb the ranks to win exclusive rewards"
    },
    {
      icon: <Users className="w-8 h-8 text-blue-400" />,
      title: "Team Formation",
      description: "Find your perfect trio and dominate the arena together"
    },
    {
      icon: <Gamepad2 className="w-8 h-8 text-green-400" />,
      title: "Custom Matches",
      description: "Create and join custom games with your own rules"
    },
    {
      icon: <Coins className="w-8 h-8 text-yellow-500" />,
      title: "Rewards System",
      description: "Earn points and exchange them for in-game items"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        <div className="text-center space-y-6">
          <h1 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500">
            TW Esports
          </h1>
          <p className="text-xl text-gray-300">Your Gateway to Professional Brawl Stars Gaming</p>
        </div>

        {/* Main CTA */}
        <div className="mt-12 text-center">
          <div className="space-y-4">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 px-8 py-4 rounded-lg text-lg font-bold transform transition-all hover:scale-105 hover:shadow-xl">
              <Link to="/register">Start Your Journey</Link>
            </button>
            <p className="text-gray-400">
              Already a member?{' '}
              <Link to="/login" className="text-blue-400 hover:text-blue-300">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800 bg-opacity-50 p-6 rounded-xl transform transition-all hover:scale-105">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-3 bg-gray-700 rounded-full">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-blue-300">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Game Stats */}
        <div className="mt-20 bg-gray-800 bg-opacity-50 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <p className="text-4xl font-bold text-blue-400">100+</p>
              <p className="text-gray-400">Active Players</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-purple-400">Rs500+</p>
              <p className="text-gray-400">Monthly Prize Pool</p>
            </div>
            <div className="space-y-2">
              <p className="text-4xl font-bold text-green-400">24/7</p>
              <p className="text-gray-400">Tournament Support</p>
            </div>
          </div>
        </div>

        {/* Ad Section */}
        <div className="mt-12">
          <AdComponent adSlot={3058069917}/>
        </div>
      </div>
    </div>
  );
};

export default JoinUsPage;