import React from 'react';
import Navbar from '../components/Navbar';
import { ShieldCheck } from 'lucide-react';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-slate-950 text-white pb-12">
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 mt-12">
        <div className="flex items-center gap-4 mb-8">
          <ShieldCheck size={40} className="text-blue-500" />
          <h1 className="text-4xl font-black uppercase tracking-tight">Privacy Policy</h1>
        </div>
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-3xl space-y-6 text-slate-300 leading-relaxed">
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Information We Collect</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Username or in-game name (for tournament participation)</li>
              <li>Email address (for communication and prize distribution)</li>
              <li>Discord ID (if required for tournament coordination)</li>
            </ul>
            <p className="mt-4 italic">We do not collect any payment or financial information.</p>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">How We Use Your Information</h2>
            <ul className="list-disc ml-6 space-y-2">
              <li>Organize and manage tournaments</li>
              <li>Communicate with participants</li>
              <li>Distribute digital prizes</li>
              <li>Improve our website and services</li>
            </ul>
          </section>
          <section>
            <h2 className="text-xl font-bold text-white mb-3">Consent</h2>
            <p>By using our website, you hereby consent to our Privacy Policy.</p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;