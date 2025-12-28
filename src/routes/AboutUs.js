import React from 'react';
import Navbar from '../components/Navbar';
import { Info } from 'lucide-react';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 mt-12">
        <div className="flex items-center gap-4 mb-8">
          <Info size={40} className="text-blue-500" />
          <h1 className="text-4xl font-black uppercase tracking-tight">About Us</h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-10 rounded-3xl prose prose-invert max-w-none">
          <p className="text-xl text-slate-300 leading-relaxed mb-6">
            Welcome to <span className="text-white font-bold">R7ESPORTS</span>, a community-driven gaming platform created for gamers who love competition, fun, and fair play.
          </p>
          <p className="text-slate-400">
            We organize free online gaming tournaments, mainly focused on Brawl Stars, where players can compete and improve their skills. Our goal is to build a positive gaming community by hosting transparent and fair events.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;