import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/Logo.png';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className="bg-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex ">
            <Link className="flex" to="/home">
            <div className="flex-shrink-0 flex space-x-1 items-center ">
                <img src={logo} alt="logo" className="h-8 w-8" />
                <span className="flex text-white font-bold text-xl">TW Esports</span>
            </div>
            </Link>
          </div>
          <div className="flex items-center">
            <div className="block md:hidden">
              <button
                onClick={toggleAccordion}
                className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white hover:bg-gray-700 focus:outline-none focus:bg-gray-700 transition duration-500"
                aria-controls="mobile-menu"
                aria-expanded={isOpen ? 'true' : 'false'}
              >
                <svg
                  className={`${isOpen ? 'hidden' : 'block'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
                <svg
                  className={`${isOpen ? 'block' : 'hidden'} h-6 w-6`}
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className={`md:hidden transition-all duration-500 ease-in-out ${isOpen ? 'block' : 'hidden'}`} id="mobile-menu">
        <div className="bg-gray-800 px-2 pt-2 pb-3 space-y-1 sm:px-3 absolute w-full">
          <Link to="/profile" className="text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Profile</Link>
          <Link to="/my-tournaments" className="text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">My Tournaments</Link>
          <Link to="/contactus" className="text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Contact Us</Link>
          <Link to="/" className="text-white hover:bg-gray-700 block px-3 py-2 rounded-md text-base font-medium">Logout</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
