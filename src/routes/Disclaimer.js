import React from 'react';
import Navbar from '../components/Navbar';
import { AlertTriangle } from 'lucide-react';

const Disclaimer = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 mt-12 text-center">
        <AlertTriangle size={64} className="text-yellow-500 mx-auto mb-6" />
        <h1 className="text-4xl font-black uppercase mb-8">Disclaimer</h1>
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl text-slate-300 max-w-2xl mx-auto">
          <p className="text-lg leading-relaxed italic">
            R7ESPORTS is an independent gaming community platform and is not affiliated with, endorsed, sponsored, or approved by Supercell or Discord.
          </p>
          <div className="mt-8 pt-8 border-t border-slate-800 grid grid-cols-2 gap-4 font-bold text-sm uppercase text-blue-400">
            <div>Skill-Based</div>
            <div>Free-To-Enter</div>
            <div>Non-Gambling</div>
            <div>No Real Money</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Disclaimer;