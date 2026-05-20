import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import logo from '../assets/logo.png';

const Navbar = () => {
  const location = useLocation();
  const isApplyPage = location.pathname === '/apply';

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16 sm:h-20 md:h-24">
          <div className="flex-shrink-0 flex items-center">
            <Link to="/" className="flex items-center py-2">
              <img
                src={logo}
                alt="Institute Bologna"
                className="h-12 sm:h-16 md:h-24 lg:h-32 w-auto object-contain transition-transform duration-300 hover:scale-105"
              />
            </Link>
          </div>
          <div>
            {isApplyPage ? (
              <Link 
                to="/" 
                className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-1.5 sm:py-2 border border-gray-300 text-xs sm:text-sm font-bold uppercase rounded-full shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uniboRed transition-all duration-300 transform hover:scale-105"
              >
                <svg className="w-3 sm:w-4 h-3 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                <span className="hidden sm:inline">Back to Home</span>
                <span className="sm:hidden">Back</span>
              </Link>
            ) : (
              <Link 
                to="/admin" 
                className="inline-flex items-center px-3 sm:px-6 py-1.5 sm:py-2 border border-transparent text-xs sm:text-sm font-bold uppercase rounded-full shadow-sm text-white bg-uniboRed hover:bg-uniboDarkRed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-uniboRed transition-all duration-300 transform hover:scale-105"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
