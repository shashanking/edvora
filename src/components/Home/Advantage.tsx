"use client";

import React, { useEffect, useState } from "react";

type AdvantageContent = {
  heading: string;
  description: string;
  card: {
    imageUrl: string;
    title: string;
    description: string;
  }[];
};

const Fall_BACK_CONTENT: AdvantageContent = {
  heading: "The Addify Academy Advantage",
  description: `Join us and unlock your full potential. With our personalized learning experience, you'll master any subject and become a confident expert in no time. `,
  card: [
    {
      imageUrl: "./one-to-one-filled.png",
      title: "1-on-1 Live Sessions",
      description:
        "Receive a customized curriculum designed by subject specialists specifically for your needs.",
    },
    {
      imageUrl: "./mdi_art.png",
      title: " Personalized Learning Plans",
      description:
        "Benefit from the expertise of our subject experts, who will guide you through each step of your learning journey.",
    },
    {
      imageUrl: "./person-support-filled.png",
      title: "24/7 Support & Guidance",
      description:
        "Enjoy personalized attention from your dedicated subject expert, ensuring you receive the attention you need to succeed.",
    },
    {
      imageUrl: "./mdi_art.png",
      title: "Personalized Learning Plans",
      description:
        "Benefit from the expertise of our subject experts, who will guide you through each step of your learning journey.",
    },
    {
      imageUrl: "./mdi_art.png",
      title: "Personalized Learning Plans",
      description:
        "Benefit from the expertise of our subject experts, who will guide you through each step of your learning journey.",
    },
    {
      imageUrl: "./mdi_art.png",
      title: "Personalized Learning Plans",
      description:
        "Benefit from the expertise of our subject experts, who will guide you through each step of your learning journey.",
    },
  ],
};

const AdvantageSection: React.FC = () => {
  const [content, setContent] = useState<AdvantageContent | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const contentRes = await fetch("/api/advantage");
        if (!contentRes.ok) {
          throw new Error("Failed to load podcast advantage content");
        }

        const contentData = (await contentRes.json()) as AdvantageContent;
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
    <section className="relative w-full bg-white py-12 md:py-16 lg:py-20 px-4 md:px-8 lg:px-12">
      {/*bottom left paper plane*/}
      <div className="absolute bottom-10 md:bottom-0 md:left-40 -z-10 pointer-events-none">
        <img
          src="./Paper plane 1.png"
          alt=""
          className="w-[90px] h-[60px] md:h-100 md:w-77"
        />
      </div>
      {/*top right star*/}
      <div className="absolute top-60 right-5 md:top-50 right-0 -z-10 pointer-events-none">
        <img
          src="./star 1.png"
          alt=""
          className="h-12.5 w-12.5 md:h-32.5 md:w-32.5"
        />
      </div>
      <div className="max-w-[1400px] mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-8 md:mb-12 px-3">
          <h2
            className="mb-3 md:mb-6 font-poppins font-extrabold text-[24px] sm:text-[28px] md:text-[36px] lg:text-[48px] leading-tight tracking-normal text-center text-[#2B2B2B]
"
          >
            {content?.heading?.split(" ")?.map((word, index) => (
              <span
                key={index}
                className={`${index == 1 ? "text-[#1F4FD8]" : ""}`}
              >
                {word}{" "}
              </span>
            )) ??
              Fall_BACK_CONTENT.heading?.split(" ")?.map((word, index) => (
                <span
                  key={index}
                  className={`${index == 1 ? "text-[#1F4FD8]" : ""}`}
                >
                  {word}{" "}
                </span>
              ))}
          </h2>
          <p
            className="text-[#4D4D4D] mx-auto font-nunito font-normal text-[12px] sm:text-[13px] md:text-[16px] leading-relaxed tracking-normal text-center
"
          >
            {content?.description ?? Fall_BACK_CONTENT.description}
          </p>
        </div>

        {/* Cards Grid */}
        <div className="flex items-center justify-center flex-wrap gap-3 md:gap-4 lg:gap-6 mt-8 md:mt-12 lg:mt-16">
          {/* Card 1 - 1-on-1 Live Sessions */}
          {content?.card?.map((card, index) => (
            <div
              key={index}
              className="p-px rounded-2xl md:rounded-3xl bg-linear-to-b from-[#1F4FD8] to-[#FFFFFF]"
            >
              <div className="w-[160px] h-[180px] sm:w-[200px] sm:h-[220px] md:w-[280px] md:h-[320px] lg:w-[310px] lg:h-[360px] bg-gradient-to-b from-[#F3F3F3] to-[#FFFFFF] rounded-2xl md:rounded-3xl p-4 sm:p-6 md:p-8 hover:scale-105 transition-transform duration-300 hover:bg-gradient-to-b hover:from-[#1F4FD8] hover:to-[#FFFFFF] border">
                <div className="group relative flex flex-col items-center text-center ">
                  {/* Icon circle */}
                  <div className="h-16 w-16 sm:h-20 sm:w-20 md:w-28 md:h-28 lg:w-32 lg:h-32 bg-white rounded-full flex items-center justify-center mb-3 md:mb-6 lg:mb-8 shadow-lg">
                    <img
                      src={card?.imageUrl}
                      alt=""
                      className="h-6 w-6 sm:h-8 sm:w-8 md:h-20 md:w-20 lg:h-25 lg:w-25"
                    />
                  </div>

                  <h3
                    className="text-[#2B2B2B] mt-auto font-poppins font-extrabold text-[12px] sm:text-[14px] md:text-[18px] lg:text-[20px] leading-tight tracking-normal text-center w-full
"
                  >
                    {card?.title}
                  </h3>
                  <p className="font-nunito text-[10px] sm:text-xs md:text-sm lg:text-base mt-2 text-[#4D4D4D] max-h-0 opacity-0 group-hover:max-h-20 group-hover:opacity-100 transition-all duration-200">
                    {card?.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AdvantageSection;
