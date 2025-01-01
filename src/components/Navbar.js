import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Trophy, MessageCircle, LogOut } from 'lucide-react';
import logo from '../assets/Logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
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

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/profile" active={isActivePage('/profile')}>
              <User size={18} />
              <span>Profile</span>
            </NavLink>

            <NavLink to="/my-tournaments" active={isActivePage('/my-tournaments')}>
              <Trophy size={18} />
              <span>My Tournaments</span>
            </NavLink>

            <NavLink to="/contactus" active={isActivePage('/contactus')}>
              <MessageCircle size={18} />
              <span>Contact Us</span>
            </NavLink>

            <NavLink to="/" active={isActivePage('/')}>
              <LogOut size={18} />
              <span>Logout</span>
            </NavLink>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none transition duration-300"
            >
              {isOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className={`md:hidden transition-all duration-300 ease-in-out transform ${
          isOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        }`}
      >
        <div className="bg-slate-900/95 backdrop-blur-sm px-4 pt-2 pb-3 space-y-1 shadow-lg">
          <MobileNavLink to="/profile" onClick={() => setIsOpen(false)}>
            <User size={18} />
            <span>Profile</span>
          </MobileNavLink>

          <MobileNavLink to="/my-tournaments" onClick={() => setIsOpen(false)}>
            <Trophy size={18} />
            <span>My Tournaments</span>
          </MobileNavLink>

          <MobileNavLink to="/contactus" onClick={() => setIsOpen(false)}>
            <MessageCircle size={18} />
            <span>Contact Us</span>
          </MobileNavLink>

          <MobileNavLink to="/" onClick={() => setIsOpen(false)}>
            <LogOut size={18} />
            <span>Logout</span>
          </MobileNavLink>
        </div>
      </div>
    </nav>
  );
};

// Desktop Navigation Link Component
const NavLink = ({ children, to, active }) => (
  <Link
    to={to}
    className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-300 ${
      active
        ? 'bg-blue-500 text-white'
        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
    }`}
  >
    {children}
  </Link>
);

// Mobile Navigation Link Component
const MobileNavLink = ({ children, to, onClick }) => (
  <Link
    to={to}
    onClick={onClick}
    className="flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors duration-300"
  >
    {children}
  </Link>
);

export default Navbar;