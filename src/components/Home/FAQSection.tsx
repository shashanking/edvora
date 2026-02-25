'use client';

import { title } from 'process';
import React, { useEffect, useState } from 'react';

interface FAQItem {
  question: string;
  answer: string;
}

type FAQ = {
  title: string;
  description: string;
  questionCard: FAQItem[];
}

const faqs: FAQItem[] = [
  {
    question: 'Can you help with multiple subjects simultaneously?',
    answer:
      'Yes, we offer comprehensive support across multiple subjects. Our tutors are qualified to help with various subjects including Math, Science, English, and more. You can schedule sessions for different subjects based on your needs.',
  },
  {
    question: 'Do you follow specific curricula?',
    answer:
      'We align our teaching with major curricula including Common Core, IB, GCSE, and state-specific standards. Our tutors customize lessons to match your school curriculum and learning objectives.',
  },
  {
    question: 'What if my child needs help with homework?',
    answer:
      'Our tutors provide dedicated homework help sessions. They guide students through challenging assignments, explain concepts, and ensure understanding rather than just providing answers.',
  },
  {
    question: 'How do you assess progress?',
    answer:
      'We track progress through regular assessments, practice tests, and continuous feedback. Parents receive detailed progress reports showing improvements in understanding, grades, and confidence levels.',
  },
  {
    question: 'What technology do I need?',
    answer:
      'You need a computer or tablet with a stable internet connection, a webcam, and a microphone. We recommend using Chrome or Safari browsers for the best experience. All our learning tools are web-based.',
  },
];

const FALL_BACK_CONTENT: FAQ = {
  title: "FAQ SECTION",
  description: "Explore FAQs for quick support, guidance, and information",
  questionCard: faqs,
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const [content,setContent] = useState<FAQ | null>(null);

  useEffect(() => {
        let mounted = true;
    
        const load = async () => {
          try {
            const contentRes = await fetch("/api/FAQ");
            if (!contentRes.ok) {
              throw new Error("Failed to load Overview content");
            }
    
            const contentData = (await contentRes.json()) as FAQ;
    
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

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-gray-50 to-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="mb-4 font-poppins font-extrabold text-[20px] md:text-5xl leading-none tracking-normal text-center">
            {
              content?.title?.split(" ")?.map((word,index)=>(
                <span key={index} className={`${index==0 ? "text-[#1F4FD8]":"text-[#2B2B2B]"}`}>{word} </span>
              )) ?? FALL_BACK_CONTENT?.title?.split(" ")?.map((word,index)=>(
                <span key={index} className={`${index==0 ? "text-[#1F4FD8]":"text-[#2B2B2B]"}`}>{word} </span>
              ))
            }
          </h2>
          <p className="text-[#4D4D4D] font-nunito-sans font-normal text-[12px] md:text-base leading-100% tracking-normal text-center">
            {
              content?.description ?? FALL_BACK_CONTENT?.description
            }
          </p>
        </div>

        {/* FAQ Items */}
        <div className="space-y-4 mb-12">
          {content?.questionCard?.map((faq, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-expanded={openIndex === index}
              >
                <h3 className="text-[#000000] pr-4 font-poppins font-bold text-[16px] md:text-lg leading-100% tracking-normal">
                  {faq?.question}
                </h3>
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-full bg-[#1F4FD8] flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? 'rotate-45' : ''
                  }`}
                >
                  <svg
                    width="35"
                    height="35"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 5V15M5 10H15"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2">
                  <p className="text-gray-600 text-[12px] md:text-base leading-relaxed">{faq?.answer}</p>
                </div>
              </div>
            </div>
          )) ?? FALL_BACK_CONTENT?.questionCard?.map((faq, index) => (
            <div
              key={index}
              className="bg-white border-2 border-gray-200 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              {/* Question */}
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-6 text-left focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
                aria-expanded={openIndex === index}
              >
                <h3 className="text-[#000000] pr-4 font-poppins font-bold text-lg leading-100% tracking-normal">
                  {faq?.question}
                </h3>
                <div
                  className={`flex-shrink-0 w-11 h-11 rounded-full bg-[#1F4FD8] flex items-center justify-center transition-transform duration-300 ${
                    openIndex === index ? 'rotate-45' : ''
                  }`}
                >
                  <svg
                    width="35"
                    height="35"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M10 5V15M5 10H15"
                      stroke="white"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
              </button>

              {/* Answer */}
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index
                    ? 'max-h-96 opacity-100'
                    : 'max-h-0 opacity-0'
                }`}
              >
                <div className="px-6 pb-6 pt-2">
                  <p className="text-gray-600 leading-relaxed">{faq?.answer}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="flex justify-center relative">
          <button
            onClick={() => {
              const el = document.getElementById('coming-soon-faq');
              if (el) { el.classList.remove('hidden'); setTimeout(() => el.classList.add('hidden'), 2000); }
            }}
            className="bg-[#FFC83D] hover:bg-yellow-500 w-full md:w-auto text-[#2B2B2B] px-12 py-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-poppins font-semibold text-[12px] md:text-xl leading-cap leading-100% tracking-normal"
          >
            View All
          </button>
          <div id="coming-soon-faq" className="hidden absolute left-1/2 -translate-x-1/2 -top-12 bg-[#1C1C28] text-white text-sm font-poppins font-semibold px-5 py-2.5 rounded-full shadow-lg whitespace-nowrap z-50">
            🚀 Coming Soon!
          </div>
        </div>
      </div>
    </div>
  );
}