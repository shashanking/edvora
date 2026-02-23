import Image from "next/image";
import Navbar from "../components/core/NavBar";
import Footer from "../components/core/Footer";
import Hero from "../components/Home/Hero";
import AboutSection from "../components/Home/About";
import AdvantageSection from "../components/Home/Advantage";
import ProgramsOverviewSection from "../components/Home/ProgrammeOverviewSection";
import HowItWorksSection from "../components/Home/WorkSection";
import OurEducatorsSection from "../components/Home/Educators";
import DemoCardSection from "../components/Home/Demo";
import TestimonialSection from "../components/Home/SuccessStory";
import LearningResourcesSection from "../components/Home/ResourceSection";
import BlogSection from "../components/Home/InsightSection";
import FAQSection from "../components/Home/FAQSection";
import PricingSection from "../components/Home/PricingSection";
import ContactSection from "../components/Home/ContactSection";
import CTASection from "../components/Home/JoinUs";

export default function Home() {
  return (
    <div >
      <main className="min-h-screen bg-[#FAF9F8]">
        {/* <Navbar /> */}
        <Hero />
        <AboutSection />
        <AdvantageSection />
        <ProgramsOverviewSection />
        <HowItWorksSection />
        <OurEducatorsSection />
        <DemoCardSection />
        <TestimonialSection />
        <LearningResourcesSection />
        <BlogSection />
        <FAQSection />
        <PricingSection />
        <ContactSection />
        {/* <CTASection /> */}
        <Footer />
      </main>
    </div>
  );
}
