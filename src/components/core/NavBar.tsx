import Image from 'next/image';

export default function Navbar() {
  return (
    <nav className=" md:px-40 py-5 z-10">
      <div className="max-w-[1400px] mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex-shrink-0 h-9 w-9 md:h-[110px] md:w-[110px]">
          <img src="./image 1.png" alt="logo" className='rounded-full h-full w-full object-cover' />
        </div>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-12">
          <a 
            href="#home" 
            className="text-white font-medium text-base hover:text-gray-300 transition-colors"
          >
            Home
          </a>
          <a 
            href="#young-learners" 
            className="text-gray-400 font-medium text-base hover:text-gray-300 transition-colors"
          >
            Young Learners
          </a>
          <a 
            href="#adult-learners" 
            className="text-gray-400 font-medium text-base hover:text-gray-300 transition-colors"
          >
            Adult Learners
          </a>
          <a 
            href="#about" 
            className="text-gray-400 font-medium text-base hover:text-gray-300 transition-colors"
          >
            About
          </a>
          <a 
            href="#contact" 
            className="text-gray-400 font-medium text-base hover:text-gray-300 transition-colors"
          >
            Contact Us
          </a>
        </div>

        {/* CTA Button */}
        <div className="hidden md:flex-shrink-0">
          <a 
            href="#contact"
            className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold px-8 py-3.5 rounded-full hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-xl inline-block"
          >
            Book a Free Demo
          </a>
        </div>
        <div className="md:hidden">
          <button className="flex items-center justify-center text-white">
            <img src="./NavButton.png" alt="Button" />
          </button>
        </div>
      </div>
    </nav>
  );
}