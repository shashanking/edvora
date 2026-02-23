'use client';

import React from 'react';

export default function CTASection() {
  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-white to-gray-50 py-20 px-4 flex items-center justify-center">
      <div className="max-w-7xl w-full">
        {/* CTA Card */}
        <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 rounded-[3rem] p-12 lg:p-20 shadow-2xl overflow-hidden">
          {/* Background Pattern/Circles - Decorative */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
            <div className="absolute bottom-10 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 left-1/3 w-48 h-48 bg-blue-300 rounded-full blur-2xl"></div>
          </div>

          {/* Content */}
          <div className="relative z-10 text-center">
            {/* Join Us Header with Avatars */}
            <div className="flex flex-col items-center mb-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px w-16 bg-white"></div>
                <h3 className="text-white text-xl font-semibold">Join Us</h3>
                <div className="h-px w-16 bg-white"></div>
              </div>

              {/* Avatar Group */}
              <div className="flex items-center justify-center -space-x-3">
                {[
                  '👨‍💼',
                  '👨‍🎓',
                  '👩‍💼',
                  '👨‍🔬',
                  '👩‍🏫',
                  '👩‍💻',
                  '👨‍🏫',
                ].map((avatar, index) => (
                  <div
                    key={index}
                    className="w-14 h-14 rounded-full bg-white border-4 border-blue-600 flex items-center justify-center text-2xl shadow-lg hover:scale-110 transition-transform duration-300 cursor-pointer"
                    style={{ zIndex: 7 - index }}
                  >
                    {avatar}
                  </div>
                ))}
              </div>
            </div>

            {/* Main Heading */}
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Help Your Child{' '}
              <span className="text-yellow-400">Speak English</span> with
              Confidence.
            </h2>

            {/* Subheading */}
            <p className="text-white text-lg md:text-xl mb-10 max-w-3xl mx-auto opacity-90">
              Give your child the support, attention, and encouragement they
              deserve.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Primary Button - Book Free Assessment */}
              <button className="group bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-bold px-8 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-3">
                <span className="text-lg">Book Free Assessment</span>
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center group-hover:rotate-45 transition-transform duration-300">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M3 8H13M13 8L9 4M13 8L9 12"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </button>

              {/* Secondary Button - Contact Us */}
              <button className="bg-transparent hover:bg-white hover:bg-opacity-10 text-white font-bold px-8 py-4 rounded-full border-2 border-white shadow-lg hover:shadow-xl transition-all duration-300">
                <span className="text-lg">Contact Us!</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}