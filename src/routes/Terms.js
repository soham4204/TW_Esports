import React from 'react';
import Navbar from '../components/Navbar';
import { FileText } from 'lucide-react';

const Terms = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 mt-12">
        <div className="flex items-center gap-4 mb-8">
          <FileText size={40} className="text-blue-500" />
          <h1 className="text-4xl font-black uppercase tracking-tight">Terms & Conditions</h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-8 text-slate-300">
          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Eligibility</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Participants must be 13 years or older</li>
              <li>Participants must comply with Supercell’s Terms of Service</li>
              <li>One account per participant unless stated otherwise</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-4 border-b border-slate-800 pb-2">Tournament Rules</h2>
            <p className="mb-4">All tournaments hosted are free-to-enter. Decisions made by organizers are final.</p>
            <ul className="list-disc ml-6 space-y-2">
              <li>Winners decided solely based on skill</li>
              <li>No cheating or third-party exploits</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Terms;