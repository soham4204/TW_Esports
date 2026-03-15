import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth } from '../firebase-config';
import { 
  Trophy, 
  MessageCircle, 
  Info, 
  ShieldCheck, 
  FileText, 
  AlertTriangle,
  LogOut,
  User
} from 'lucide-react';
import logo from '../assets/Logo.png';
import LoginModal from './LoginModal';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [discordProfile, setDiscordProfile] = useState(null);
  
  const location = useLocation();

  useEffect(() => {
    // Listen to Firebase Auth state changes
    const unsubscribe = auth.onAuthStateChanged(currentUser => {
      setUser(currentUser);
      if (currentUser) {
        // Retrieve the Discord profile we cached in localStorage during callback
        const cachedProfile = localStorage.getItem('discordUser');
        if (cachedProfile) {
          setDiscordProfile(JSON.parse(cachedProfile));
        }
      } else {
        setDiscordProfile(null);
        localStorage.removeItem('discordUser');
      }
    });

    return unsubscribe;
  }, []);
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePage = (path) => location.pathname === path;

  return (
    <nav className={`w-full z-50 transition-all duration-300 sticky top-0 ${
      scrolled ? 'bg-slate-900/95 backdrop-blur-sm shadow-lg' : 'bg-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo / Home Section */}
          <Link className="flex items-center group" to="/home">
            <div className="flex items-center space-x-3">
              <div className="relative h-10 w-10 overflow-hidden">
                <img 
                  src={logo} 
                  alt="logo" 
                  className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-110" 
                />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">
                R7 <span className="text-red-500">Esports</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center space-x-1 overflow-x-auto no-scrollbar">
            <NavLink to="/my-tournaments" active={isActivePage('/my-tournaments')}>
              <Trophy size={18} />
              <span className="hidden md:inline">My Tournaments</span>
            </NavLink>

            <NavLink to="/about-us" active={isActivePage('/about-us')}>
              <Info size={18} />
              <span className="hidden md:inline">About</span>
            </NavLink>

            <NavLink to="/contactus" active={isActivePage('/contactus')}>
              <MessageCircle size={18} />
              <span className="hidden md:inline">Contact</span>
            </NavLink>

            <NavLink to="/privacy-policy" active={isActivePage('/privacy-policy')}>
              <ShieldCheck size={18} />
              <span className="hidden lg:inline">Privacy</span>
            </NavLink>

            <NavLink to="/terms" active={isActivePage('/terms')}>
              <FileText size={18} />
              <span className="hidden lg:inline">Terms</span>
            </NavLink>

            <NavLink to="/disclaimer" active={isActivePage('/disclaimer')}>
              <AlertTriangle size={18} />
              <span className="hidden lg:inline">Disclaimer</span>
            </NavLink>
          </div>

          {/* User Profile / Login Button */}
          <div className="flex items-center space-x-4 pl-4 border-l border-slate-700 ml-2">
            {user ? (
              <div className="flex items-center space-x-3 group cursor-pointer relative">
                <div className="flex items-center space-x-2">
                  {discordProfile?.avatar ? (
                    <img src={discordProfile.avatar} alt="Profile" className="w-8 h-8 rounded-full border border-indigo-500" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center border border-indigo-500">
                      <User size={16} className="text-white" />
                    </div>
                  )}
                  <span className="hidden md:inline text-sm font-bold text-white max-w-[100px] truncate">
                    {discordProfile?.username || "Player"}
                  </span>
                </div>
                
                {/* Logout Dropdown logic simple implementation */}
                <button 
                  onClick={() => auth.signOut()}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
                  title="Logout"
                >
                  <LogOut size={18} />
                </button>
              </div>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold font-poppins transition-all shadow-lg shadow-indigo-500/30"
              >
                Login
              </button>
            )}
          </div>

        </div>
      </div>
      
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </nav>
  );
};

const NavLink = ({ children, to, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 flex-shrink-0 ${
      active
        ? 'bg-blue-600 text-white shadow-md'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;