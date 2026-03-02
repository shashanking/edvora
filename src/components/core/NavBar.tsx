'use client';
import { useState } from 'react';

export default function Navbar() {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <nav className="px-4 md:px-10 lg:px-16 xl:px-24 py-5 z-10 relative">
      <div className="max-w-[1400px] mx-auto w-full flex items-start md:items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex-shrink-0 h-9 w-9 md:h-[80px] md:w-[80px] lg:h-[110px] lg:w-[110px]">
          <img src="./image 1.png" alt="logo" className='rounded-full h-full w-full object-cover' />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-5 lg:gap-12 flex-nowrap whitespace-nowrap min-w-0">
          <a 
            href="#home" 
            className="text-white font-medium text-sm lg:text-base hover:text-gray-300 transition-colors"
          >
            Home
          </a>
          <a 
            href="#young-learners" 
            className="text-gray-400 font-medium text-sm lg:text-base hover:text-gray-300 transition-colors"
          >
            Young Learners
          </a>
          <a 
            href="#adult-learners" 
            className="text-gray-400 font-medium text-sm lg:text-base hover:text-gray-300 transition-colors"
          >
            Adult Learners
          </a>
          <a 
            href="#about" 
            className="text-gray-400 font-medium text-sm lg:text-base hover:text-gray-300 transition-colors"
          >
            About
          </a>
          <a 
            href="#contact" 
            className="text-gray-400 font-medium text-sm lg:text-base hover:text-gray-300 transition-colors"
          >
            Contact Us
          </a>
        </div>

        {/* CTA Button */}
        <div className="hidden lg:flex-shrink-0">
          <a 
            href="#contact"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-7 xl:px-8 py-3.5 rounded-full hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl inline-block"
          >
            Book a Free Demo
          </a>
        </div>
        <div className="md:hidden">
          <button 
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="flex items-center justify-center text-white"
          >
            <img src="./NavButton.png" alt="Button" />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 right-0 h-full w-[280px] bg-[#1F4FD8] shadow-2xl transform transition-transform duration-300 ease-in-out z-50 md:hidden ${
          isDrawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Close button */}
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsDrawerOpen(false)}
              className="text-white text-2xl font-bold"
            >
              ×
            </button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-6 px-6 py-4">
            <a
              href="#home"
              onClick={() => setIsDrawerOpen(false)}
              className="text-white font-medium text-lg hover:text-yellow-400 transition-colors py-2 border-b border-white/20"
            >
              Home
            </a>
            <a
              href="#young-learners"
              onClick={() => setIsDrawerOpen(false)}
              className="text-white font-medium text-lg hover:text-yellow-400 transition-colors py-2 border-b border-white/20"
            >
              Young Learners
            </a>
            <a
              href="#adult-learners"
              onClick={() => setIsDrawerOpen(false)}
              className="text-white font-medium text-lg hover:text-yellow-400 transition-colors py-2 border-b border-white/20"
            >
              Adult Learners
            </a>
            <a
              href="#about"
              onClick={() => setIsDrawerOpen(false)}
              className="text-white font-medium text-lg hover:text-yellow-400 transition-colors py-2 border-b border-white/20"
            >
              About
            </a>
            <a
              href="#contact"
              onClick={() => setIsDrawerOpen(false)}
              className="text-white font-medium text-lg hover:text-yellow-400 transition-colors py-2 border-b border-white/20"
            >
              Contact Us
            </a>

            {/* CTA Button in drawer */}
            <a
              href="#contact"
              onClick={() => setIsDrawerOpen(false)}
              className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-6 py-3 rounded-full hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg text-center mt-4"
            >
              Book a Free Demo
            </a>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsDrawerOpen(false)}
        />
      )}
    </nav>
  );
}