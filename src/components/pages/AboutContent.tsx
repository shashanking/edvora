"use client";

import React, { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import PageHero from "../core/PageHero";

type Stat = { value: string; label: string };
type CoreValue = { title: string; description: string };

type AboutPageContent = {
  heroHeading: string;
  heroSubheading: string;
  storyHeading: string;
  storyDescription: string;
  storyImage: string;
  mission: string;
  vision: string;
  stats: Stat[];
  values: CoreValue[];
};

const FALLBACK: AboutPageContent = {
  heroHeading: "About Addify Academy",
  heroSubheading:
    "Your dedicated partner in academic and professional growth — one learner, one goal, one mentor at a time.",
  storyHeading: "Our Story",
  storyDescription: `Addify Academy was built on a simple belief: every learner deserves an education shaped around them. We specialize in closing learning gaps across multiple subjects and unlocking the most confident version of you through customized, one-on-one instruction.

Whether you're mastering English, Mathematics, and Science, refining your communication skills, building executive presence, or preparing for critical exams, we provide expert guidance tailored to your unique learning needs at every milestone of your journey.

Our promise is straightforward: no generic courses, no crowded classrooms. Just you, your goals, and a subject-specialist mentor committed to your success.`,
  storyImage: "/About.jpg",
  mission:
    "To make world-class, personalized education accessible to every learner — closing gaps, building confidence, and unlocking potential through one-on-one mentorship.",
  vision:
    "A world where learning is never one-size-fits-all, and every student grows with the guidance of a mentor who truly understands their goals.",
  stats: [
    { value: "1-on-1", label: "Personalized Sessions" },
    { value: "4-Adult", label: "Ages We Teach" },
    { value: "24/7", label: "Learner Support" },
    { value: "100%", label: "Tailored Curriculum" },
  ],
  values: [
    {
      title: "Personalized Learning",
      description:
        "Every plan is built around the individual — their pace, their goals, and the way they learn best.",
    },
    {
      title: "Expert Mentorship",
      description:
        "Subject-specialist tutors who don't just teach content, but mentor learners toward real results.",
    },
    {
      title: "Confidence First",
      description:
        "We close learning gaps and build the self-belief that turns students into independent thinkers.",
    },
    {
      title: "Measurable Results",
      description:
        "Clear milestones and honest feedback so progress is always visible, never guessed at.",
    },
  ],
};

const AboutContent: React.FC = () => {
  const [content, setContent] = useState<AboutPageContent | null>(null);

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      try {
        const res = await fetch("/api/about-page");
        if (!res.ok) throw new Error("Failed to load About page content");
        const data = (await res.json()) as AboutPageContent;
        if (!mounted) return;
        setContent(data);
      } catch {
        if (!mounted) return;
        setContent(null);
      }
    };
    void load();
    return () => {
      mounted = false;
    };
  }, []);

  const c = content ?? FALLBACK;
  const stats = c.stats?.length ? c.stats : FALLBACK.stats;
  const values = c.values?.length ? c.values : FALLBACK.values;

  return (
    <>
      <PageHero
        eyebrow="About Us"
        heading={c.heroHeading || FALLBACK.heroHeading}
        subheading={c.heroSubheading || FALLBACK.heroSubheading}
      />

      {/* Story */}
      <section className="w-full bg-[#FAF9F8] py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -z-10 -top-4 -left-4 w-1/2 h-1/2 bg-[#FFC83D] rounded-br-[120px]" />
            <div className="rounded-[28px] overflow-hidden shadow-[0_20px_60px_rgba(15,60,180,0.18)] h-[320px] md:h-[440px]">
              <img
                src={c.storyImage || FALLBACK.storyImage}
                alt="About Addify Academy"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          <div className="space-y-4 md:space-y-6 order-1 lg:order-2">
            <h2 className="font-poppins font-extrabold text-[24px] sm:text-[28px] md:text-[36px] lg:text-[46px] leading-tight flex flex-wrap gap-2 md:gap-3">
              {(c.storyHeading || FALLBACK.storyHeading)
                .split(" ")
                .map((word, i, arr) => (
                  <span
                    key={i}
                    className={i === arr.length - 1 ? "text-[#FFC83D]" : "text-[#1F4FD8]"}
                  >
                    {word}{" "}
                  </span>
                ))}
            </h2>
            <div className="text-[#2B2B2B]/90 font-nunito text-[13px] md:text-base lg:text-[17px] leading-relaxed space-y-4">
              {(c.storyDescription || FALLBACK.storyDescription)
                .split("\n")
                .filter((line) => line.trim().length)
                .map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="w-full bg-[#1F4FD8] py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div className="bg-white/10 border border-white/20 backdrop-blur rounded-[24px] p-8 md:p-10">
            <h3 className="font-poppins font-extrabold text-[24px] md:text-[32px] text-[#FFC83D] mb-4">
              Our Mission
            </h3>
            <p className="text-white/90 font-nunito text-[14px] md:text-[17px] leading-relaxed">
              {c.mission || FALLBACK.mission}
            </p>
          </div>
          <div className="bg-white/10 border border-white/20 backdrop-blur rounded-[24px] p-8 md:p-10">
            <h3 className="font-poppins font-extrabold text-[24px] md:text-[32px] text-[#FFC83D] mb-4">
              Our Vision
            </h3>
            <p className="text-white/90 font-nunito text-[14px] md:text-[17px] leading-relaxed">
              {c.vision || FALLBACK.vision}
            </p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="w-full bg-[#FAF9F8] py-12 md:py-16 px-4 md:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="bg-white rounded-[24px] border-2 border-[#0F3CB4]/15 p-6 md:p-8 text-center shadow-[0_20px_60px_rgba(15,60,180,0.10)]"
            >
              <div className="font-poppins font-extrabold text-[28px] md:text-[40px] text-[#1F4FD8]">
                {stat.value}
              </div>
              <div className="font-nunito font-semibold text-[12px] md:text-[15px] text-[#2B2B2B]/70 mt-2">
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core values */}
      <section className="w-full bg-[#FAF9F8] pb-12 md:pb-20 px-4 md:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto">
          <h2 className="font-poppins font-extrabold text-[24px] sm:text-[28px] md:text-[40px] text-center leading-tight mb-8 md:mb-12">
            <span className="text-[#1F4FD8]">What We </span>
            <span className="text-[#FFC83D]">Stand For</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {values.map((value, i) => (
              <div
                key={i}
                className="bg-white rounded-[24px] border-2 border-[#0F3CB4]/15 p-6 md:p-7 flex flex-col gap-3 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className="w-10 h-10 rounded-full bg-[#FFC83D] flex items-center justify-center font-poppins font-extrabold text-[#082A6B]">
                  {i + 1}
                </div>
                <h3 className="font-poppins font-semibold text-[18px] md:text-[20px] text-[#082A6B]">
                  {value.title}
                </h3>
                <p className="font-nunito text-[14px] md:text-[15px] text-[#17315F]/80 leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-[#FAF9F8] pb-16 md:pb-24 px-4 md:px-6 lg:px-16">
        <div className="max-w-[1400px] mx-auto bg-gradient-to-r from-[#102A72] to-[#1F4FD8] rounded-[2rem] md:rounded-[3rem] p-8 md:p-14 text-center">
          <h2 className="font-poppins font-extrabold text-white text-[24px] md:text-[38px] leading-tight mb-4">
            Ready to start your learning journey?
          </h2>
          <p className="text-white/85 font-nunito text-[14px] md:text-[17px] max-w-[640px] mx-auto mb-8">
            Book a free trial class and meet a mentor matched to your goals.
          </p>
          <Link
            href="/contact"
            className="group inline-flex items-center justify-center gap-2 px-8 py-4 bg-[#FFC83D] text-[#2B2B2B] rounded-full font-poppins font-semibold text-[16px] md:text-[18px] shadow-lg transition-all duration-300 hover:scale-105"
          >
            <span>Book a Free Trial Class</span>
            <span className="w-6.5 h-6.5 bg-[#2B2B2B] rounded-full flex items-center justify-center">
              <ArrowUpRight className="group-hover:rotate-45 transition-transform duration-300 text-[#FFC83D] h-4 w-4" />
            </span>
          </Link>
        </div>
      </section>
    </>
  );
};

export default AboutContent;
