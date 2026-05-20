import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-uniboDarkRed py-6 sm:py-8 border-t border-red-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-3 sm:gap-4">
          <p className="text-xs sm:text-sm text-red-200 font-medium text-center">
            Copyright © {new Date().getFullYear()} Institute Bologna. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
