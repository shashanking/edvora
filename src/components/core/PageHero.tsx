import React from "react";
import Navbar from "./NavBar";

type PageHeroProps = {
  /** Small label shown above the heading, e.g. a breadcrumb or eyebrow. */
  eyebrow?: string;
  /** Main heading. The last word is highlighted in yellow to match the homepage. */
  heading: string;
  /** Optional supporting copy below the heading. */
  subheading?: string;
};

const PageHero: React.FC<PageHeroProps> = ({ eyebrow, heading, subheading }) => {
  const words = heading.trim().split(" ");
  const lastWordIndex = words.length - 1;

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-[#102A72] to-[#1F4FD8] px-4 md:px-8 lg:px-16 pb-16 md:pb-24 lg:pb-28">
      {/* Background image (same as homepage hero) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/HeroBG.png"
          alt=""
          className="w-full h-full object-cover opacity-60"
        />
      </div>

      {/* Decorative elements echoing the homepage sections */}
      <div className="absolute top-24 md:top-32 right-2 md:-right-2 opacity-30 pointer-events-none">
        <img
          src="/Hat 1.png"
          alt=""
          className="h-[50px] w-[55px] md:h-[70px] md:w-[76px]"
        />
      </div>
      <div className="absolute bottom-6 -left-4 md:bottom-10 md:left-0 opacity-25 pointer-events-none">
        <img
          src="/Puzzle 1.png"
          alt=""
          className="h-[50px] w-[45px] md:h-[120px] md:w-[105px]"
        />
      </div>

      {/* Navbar */}
      <div className="relative z-20">
        <Navbar />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto text-center pt-10 md:pt-16 lg:pt-20">
        {eyebrow ? (
          <div className="flex justify-center mb-4 md:mb-6">
            <span className="inline-flex items-center px-4 md:px-5 py-2 rounded-full border border-white/30 bg-white/5 backdrop-blur-sm text-white/90 font-inter font-light text-[11px] md:text-[15px] tracking-wide uppercase">
              {eyebrow}
            </span>
          </div>
        ) : null}

        <h1 className="font-poppins font-extrabold text-white text-[30px] sm:text-[38px] md:text-[48px] lg:text-[56px] leading-tight tracking-normal">
          {words.map((word, i) => (
            <span
              key={i}
              className={i === lastWordIndex ? "text-[#FFC83D]" : "text-white"}
            >
              {word}{" "}
            </span>
          ))}
        </h1>

        {subheading ? (
          <p className="mt-4 md:mt-6 mx-auto max-w-[720px] text-white/90 font-nunito text-[14px] md:text-[16px] lg:text-[18px] leading-relaxed">
            {subheading}
          </p>
        ) : null}
      </div>
    </section>
  );
};

export default PageHero;
