import React from "react";

export type LearnerHighlight = { title: string; description: string };

type Theme = "young" | "adult";

type LearnerIntroProps = {
  theme: Theme;
  ageRange?: string;
  description: string;
  image?: string;
  highlights: LearnerHighlight[];
};

const THEME = {
  young: {
    sectionBg: "bg-[#FAF9F8]",
    accentText: "text-[#1F4FD8]",
    headingText: "text-[#082A6B]",
    body: "text-[#17315F]/85",
    cardBorder: "border-[#0F3CB4]/15",
    badge: "bg-[#1F4FD8] text-white",
    pill: "bg-[#FFC83D] text-[#082A6B]",
    imageBg: "bg-[#D9E6FF]",
    shadow: "shadow-[0_20px_60px_rgba(15,60,180,0.12)]",
  },
  adult: {
    sectionBg: "bg-[#FAF9F8]",
    accentText: "text-[#8A6500]",
    headingText: "text-[#6E5200]",
    body: "text-[#5F4A00]/85",
    cardBorder: "border-[#E0A800]/25",
    badge: "bg-[#FFC83D] text-[#6E5200]",
    pill: "bg-[#1F4FD8] text-white",
    imageBg: "bg-[#FFF3C4]",
    shadow: "shadow-[0_20px_60px_rgba(224,168,0,0.14)]",
  },
} as const;

const LearnerIntro: React.FC<LearnerIntroProps> = ({
  theme,
  ageRange,
  description,
  image,
  highlights,
}) => {
  const t = THEME[theme];

  return (
    <section className={`w-full ${t.sectionBg} py-12 md:py-16 lg:py-20 px-4 md:px-6 lg:px-16`}>
      <div className="max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-20 items-center">
        {/* Text */}
        <div className="space-y-5 md:space-y-6">
          {ageRange ? (
            <span className={`inline-flex items-center px-5 py-2 rounded-full font-poppins font-semibold text-[14px] md:text-[16px] ${t.pill}`}>
              {ageRange}
            </span>
          ) : null}

          <div className={`font-nunito text-[14px] md:text-base lg:text-[17px] leading-relaxed space-y-4 ${t.body}`}>
            {description
              .split("\n")
              .filter((line) => line.trim().length)
              .map((line, i) => (
                <p key={i}>{line}</p>
              ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {highlights.map((h, i) => (
              <div
                key={i}
                className={`bg-white rounded-[20px] border-2 ${t.cardBorder} p-5 ${t.shadow}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-poppins font-extrabold mb-3 ${t.badge}`}>
                  {i + 1}
                </div>
                <h3 className={`font-poppins font-semibold text-[17px] md:text-[19px] mb-1 ${t.headingText}`}>
                  {h.title}
                </h3>
                <p className={`font-nunito text-[13px] md:text-[14px] leading-relaxed ${t.body}`}>
                  {h.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Image */}
        <div className="relative order-first lg:order-last">
          <div className={`rounded-[28px] overflow-hidden ${t.shadow} h-[320px] md:h-[460px] ${t.imageBg}`}>
            {image ? (
              <img
                src={image}
                alt="Addify Academy learners"
                className="w-full h-full object-cover"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default LearnerIntro;
