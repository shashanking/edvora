import { createClient } from "@/src/lib/supabase/server";
import { buildAdultCourseCatalog, buildYoungCourseCatalog, type LmsLandingCourse } from "@/src/lib/course-catalog";
import Navbar from "../components/core/NavBar";
import Footer from "../components/core/Footer";
import Hero from "../components/Home/Hero";
import AboutSection from "../components/Home/About";
import AdvantageSection from "../components/Home/Advantage";
import ProgramsOverviewSection from "../components/Home/ProgrammeOverviewSection";
import AdultLearnersSection from "../components/Home/AdultLearnersSection";
import HowItWorksSection from "../components/Home/WorkSection";
import OurEducatorsSection from "../components/Home/Educators";
import DemoCardSection from "../components/Home/Demo";
import TestimonialSection from "../components/Home/SuccessStory";
import LearningResourcesSection from "../components/Home/ResourceSection";
import FAQSection from "../components/Home/FAQSection";
import PricingSection from "../components/Home/PricingSection";
import ContactSection from "../components/Home/ContactSection";
import CTASection from "../components/Home/JoinUs";

export default async function Home() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("courses")
    .select("title, description, duration, thumbnail_url, rating, audience, landing_category")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: LmsLandingCourse[] | null };

  const catalogCourses = data ?? [];
  const youngCourses = buildYoungCourseCatalog(catalogCourses);
  const adultCourses = buildAdultCourseCatalog(catalogCourses);

  return (
    <div >
      <main className="min-h-screen bg-[#FAF9F8]">
        {/* <Navbar /> */}
        <Hero />
        <AboutSection />
        <AdvantageSection />
        <ProgramsOverviewSection coursesByCategory={youngCourses} />
        <AdultLearnersSection coursesByCategory={adultCourses} />
        <HowItWorksSection />
        <OurEducatorsSection />
        <DemoCardSection />
        <TestimonialSection />
        {/* <LearningResourcesSection /> */}
        <FAQSection />
        {/* <PricingSection /> */}
        <ContactSection />
        {/* <CTASection /> */}
        <Footer />
      </main>
    </div>
  );
}
