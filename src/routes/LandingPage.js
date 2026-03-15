import React from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Users, Zap, ShieldCheck } from 'lucide-react';
import AdComponent from '../components/AdComponent';

const LandingPage = () => {
  const features = [
    {
      icon: <Zap className="w-8 h-8 text-yellow-400" />,
      title: "Discord Linked",
      description: "Seamlessly log in with your Discord account to instantly register for tournaments."
    },
    {
      icon: <Trophy className="w-8 h-8 text-blue-400" />,
      title: "Pro Tournaments",
      description: "Join high-stakes Brawl Stars tournaments and win exclusive rewards."
    },
    {
      icon: <Users className="w-8 h-8 text-green-400" />,
      title: "Team Ready",
      description: "Register your trio and track your progress across the platform."
    },
    {
      icon: <ShieldCheck className="w-8 h-8 text-purple-400" />,
      title: "Verified Results",
      description: "Live updates and fair play guaranteed by our active admin team."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-blue-900 text-white font-poppins">
      <div className="max-w-6xl mx-auto px-4 pt-16 pb-8">
        {/* Hero Section */}
        <div className="text-center space-y-6">
          <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 tracking-tight">
            R7 ESPORTS
          </h1>
          <p className="text-2xl text-gray-300 max-w-2xl mx-auto">
            The fastest way to join professional Brawl Stars tournaments.
          </p>
        </div>

        {/* Main CTA - No Login/Register */}
        <div className="mt-12 text-center">
          <Link to="/home">
            <button className="bg-gradient-to-r from-blue-500 to-purple-600 px-12 py-5 rounded-full text-xl font-bold transform transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(59,130,246,0.5)]">
              View Active Tournaments
            </button>
          </Link>
          <p className="mt-4 text-gray-400 animate-pulse">
            Connect your Discord. Compete for glory.
          </p>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-800/40 backdrop-blur-md border border-gray-700/50 p-8 rounded-2xl transition-all hover:bg-gray-800/60">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="p-4 bg-gray-700/50 rounded-2xl">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Ad Placement */}
        <div className="mt-20 py-8 border-y border-gray-800">
          <AdComponent adSlot={3058069917}/>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;