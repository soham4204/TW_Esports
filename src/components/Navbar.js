import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { User, Trophy, MessageCircle, LogOut } from 'lucide-react';
import logo from '../assets/Logo.png';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActivePage = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className={`w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-slate-900/95 backdrop-blur-sm shadow-lg' : 'bg-slate-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-2">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
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
                TW <span className="text-blue-500">Esports</span>
              </span>
            </div>
          </Link>

          {/* Navigation Links - Now visible on all screen sizes */}
          <div className="flex items-center space-x-1">
            <NavLink to="/profile" active={isActivePage('/profile')}>
              <User size={18} />
              <span className="hidden sm:inline">Profile</span>
            </NavLink>

            <NavLink to="/my-tournaments" active={isActivePage('/my-tournaments')}>
              <Trophy size={18} />
              <span className="hidden sm:inline">My Tournaments</span>
            </NavLink>

            <NavLink to="/contactus" active={isActivePage('/contactus')}>
              <MessageCircle size={18} />
              <span className="hidden sm:inline">Contact Us</span>
            </NavLink>

            <NavLink to="/" active={isActivePage('/')}>
              <LogOut size={18} />
              <span className="hidden sm:inline">Logout</span>
            </NavLink>
          </div>
        </div>
      </div>
    </nav>
  );
};

// Navigation Link Component
const NavLink = ({ children, to, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
      active
        ? 'bg-blue-500 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

export default Navbar;