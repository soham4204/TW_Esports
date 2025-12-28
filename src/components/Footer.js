import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-slate-900 border-t border-slate-800 pt-12 pb-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <h3 className="text-xl font-bold text-white">R7 <span className="text-red-500">ESPORTS</span></h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Your gateway to professional Brawl Stars gaming. Join free tournaments and win rewards.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Navigation</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/home" className="hover:text-blue-400 transition-colors">All Tournaments</Link></li>
              <li><Link to="/my-tournaments" className="hover:text-blue-400 transition-colors">My Registrations</Link></li>
              <li><Link to="/contactus" className="hover:text-blue-400 transition-colors">Support</Link></li>
            </ul>
          </div>

          {/* Legal Links */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/privacy-policy" className="hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link to="/disclaimer" className="hover:text-blue-400 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-white font-bold mb-4 uppercase text-xs tracking-widest">Company</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/about-us" className="hover:text-blue-400 transition-colors">About Us</Link></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-xs">
          <p>© {new Date().getFullYear()} R7ESPORTS. Not affiliated with Supercell or Discord.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;