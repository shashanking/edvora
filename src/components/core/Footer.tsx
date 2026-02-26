'use client';

import React, { useEffect, useState } from 'react';
import { Phone, Mail, MapPin } from 'lucide-react';
import { Instagram, Facebook, Linkedin } from 'lucide-react';

interface FooterProps {
  className?: string;
}

type Content = {
  description: string;
  phone: string;
  email: string;
  address: string;
  instalink: string;
  xlink: string;
  facebooklink: string;
  linkedinlink: string;
}

const FALL_BACK_CONTENT: Content = {
  description: "Addify Academy is a modern learning platform helping students build strong skills, confidence, and knowledge through interactive lessons and expert guidance.",
  phone: "+91 93303 88153",
  email: "contact@addifyacademy.com",
  address: "KUNJAMONI,2ND FLOOR, PANCHPOTA, RAJPUR SONARPUR (M) Kolkata West Bengal 700152 South 24 Parganas India ",
  instalink: "#",
  xlink: "#",
  facebooklink: "#",
  linkedinlink: "#",
}
const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const [content, setContent] = useState<Content | null>(null);

  useEffect(() => {
        let mounted = true;
    
        const load = async () => {
          try {
            const contentRes = await fetch("/api/footer");
            if (!contentRes.ok) {
              throw new Error("Failed to load footer content");
            }
    
            const contentData = (await contentRes.json()) as Content;
    
            if (!mounted) return;
            setContent(contentData);
          } catch (e: any) {
            if (!mounted) return;
            setContent(null);
          }
        };
    
        void load();
    
        return () => {
          mounted = false;
        };
      }, []);
  return (
    <footer className={`bg-[#1F4FD8] text-white px-4 py-7 md:px-40 md:py-15 ${className}`}>
      <div className="md:*:max-w-[1600px] mx-auto  md:gap-[48px]">
        {/* Main Footer Content */}
        <div className="grid grid-cols-4 gap-3 md:gap-12 pb-8">
          {/* Logo and Description */}
          <div className="space-y-6 col-span-4 md:col-span-1">
            <div className="w-[90px] h-[90px] bg-white rounded-full flex items-center justify-center flex-shrink-0">
              {/* Logo placeholder - replace with your actual logo */}
              <div className="flex-shrink-0 h-9 w-9 md:h-[110px] md:w-[110px]">
          <img src="./image 1.png" alt="logo" className='rounded-full h-full w-full object-cover' />
        </div>
            </div>
            <p className="text-white/90 text-[12px] md:text-sm leading-relaxed max-w-xs">
              {content?.description ?? FALL_BACK_CONTENT?.description}
            </p>
          </div>

          {/* Menu Links */}
          <div>
            <h3 className="text-white font-semibold text-[16px] md:text-lg mb-6">Menu</h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href="#home" 
                  className="text-yellow-300 hover:text-yellow-200 transition-colors text-[12px] md:text-sm font-medium"
                >
                  Home
                </a>
              </li>
              <li>
                <a 
                  href="#young-learners" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Young Learners
                </a>
              </li>
              <li>
                <a 
                  href="#adult-learners" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Adult Learners
                </a>
              </li>
              <li>
                <a 
                  href="#about" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  About
                </a>
              </li>
              <li>
                <a 
                  href="#contact" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Important Links */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Important</h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href="/refund-policy" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Refund Policy
                </a>
              </li>
              <li>
                <a 
                  href="/privacy-policy" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a 
                  href="/terms-conditions" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Terms & Conditions
                </a>
              </li>
              {/* <li>
                <a 
                  href="/forum-terms" 
                  className="text-white/80 hover:text-white transition-colors text-sm"
                >
                  Forum terms
                </a>
              </li> */}
            </ul>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-white font-semibold text-lg mb-6">Contact</h3>
            <ul className="space-y-4">
              <li>
                <a 
                  href={`tel:${content?.phone ?? "#"}`} 
                  className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-sm group"
                >
                  <Phone className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <span>{content?.phone ?? FALL_BACK_CONTENT?.phone}</span>
                </a>
              </li>
              <li>
                <a 
                  href={`mailto:${content?.email ?? "#"}`}
                  className="flex items-center gap-3 text-white/80 hover:text-white transition-colors text-sm group"
                >
                  <Mail className="w-5 h-5 text-yellow-300 flex-shrink-0" />
                  <span>{content?.email ?? FALL_BACK_CONTENT?.email}</span>
                </a>
              </li>
              <li>
                <div className="flex items-start gap-3 text-white/80 text-sm">
                  <MapPin className="w-5 h-5 text-yellow-300 flex-shrink-0 mt-0.5" />
                  <span className="leading-relaxed">
                    {content?.address ?? FALL_BACK_CONTENT?.address}
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider Line */}
        <div className="border-t border-white/20 my-8"></div>

        {/* Bottom Section - Follow Us & Social Icons */}
        <div className="flex items-center justify-between gap-6">
          <div className="text-white font-semibold text-lg">
            Follow us
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href={content?.instalink ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors group"
              aria-label="Instagram"
            >
              <Instagram className="w-6 h-6 text-[#2B5FD9]" />
            </a>
            <a
              href={content?.facebooklink ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors group"
              aria-label="Facebook"
            >
              <Facebook className="w-6 h-6 text-[#2B5FD9]" />
            </a>
            {/* <a
              href={content?.xlink ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors group"
              aria-label="Twitter/X"
            >
              <svg 
                className="w-5 h-5 text-[#2B5FD9]" 
                fill="currentColor" 
                viewBox="0 0 24 24"
              >
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
            </a>
            <a
              href={content?.linkedinlink ?? "#"}
              target="_blank"
              rel="noopener noreferrer"
              className="w-12 h-12 bg-white rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors group"
              aria-label="LinkedIn"
            >
              <Linkedin className="w-6 h-6 text-[#2B5FD9]" />
            </a> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;