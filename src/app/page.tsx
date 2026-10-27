import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { buildAdultCourseCatalog, buildYoungCourseCatalog, type LmsLandingCourse } from "@/src/lib/course-catalog";
import { sanityClient } from "@/src/lib/sanityClient";
import { buildMetadata, SEO_PROJECTION, type SeoFields } from "@/src/lib/seo";
import Navbar from "../components/core/NavBar";
import Footer from "../components/core/Footer";
import Hero, { type HomeHeroContent } from "../components/Home/Hero";
import AboutSection, { type AboutHomeContent } from "../components/Home/About";
import AdvantageSection from "../components/Home/Advantage";
import ProgramsOverviewSection from "../components/Home/ProgrammeOverviewSection";
import AdultLearnersSection from "../components/Home/AdultLearnersSection";
import HowItWorksSection from "../components/Home/WorkSection";
import OurEducatorsSection, { type OurEducatorsContent } from "../components/Home/Educators";
import DemoCardSection, { type DemoCardContent } from "../components/Home/Demo";
import TestimonialSection from "../components/Home/SuccessStory";
import LearningResourcesSection from "../components/Home/ResourceSection";
import FAQSection from "../components/Home/FAQSection";
import PricingSection from "../components/Home/PricingSection";
import ContactSection from "../components/Home/ContactSection";
import CTASection from "../components/Home/JoinUs";

const FALLBACK_TITLE = "Online English Classes for Kids (4–12) | Addify Academy";
const FALLBACK_DESCRIPTION =
  "Live 1-on-1 English, phonics & spoken English classes for kids aged 4–12. Expert teachers. Book a free trial.";

export async function generateMetadata(): Promise<Metadata> {
  let seo: SeoFields | null = null;
  try {
    seo = await sanityClient.fetch(`*[_type == "homeHero"][0]{ ${SEO_PROJECTION} }`);
  } catch {
    seo = null;
  }

  return buildMetadata({
    path: "/",
    fallbackTitle: FALLBACK_TITLE,
    fallbackDescription: FALLBACK_DESCRIPTION,
    seo,
  });
}

const heroQuery = `*[_type == "homeHero"][0]{
  _id,
  mainTag,
  heading,
  tag,
  description,
  feature[]{ "icon": icon.asset->url, title },
  "image": image.asset->url
}`;

const aboutHomeQuery = `*[_type == "aboutHome"][0]{ heading, description, "image": image.asset->url }`;
const educatorsQuery = `*[_type == "ourEducators"][0]{
  heading, description, "imageUrl": image.asset->url,
  qualificationTitle, qualification, criteriaTitle, criteria
}`;
const demoCardQuery = `*[_type == "demoCard"][0]{ heading, description, "imageUrl": image.asset->url, features }`;

// Fetches a Sanity singleton doc, returning null (so the component falls
// back to its own default copy) if the CMS is unreachable or empty.
async function fetchSanityDoc<T>(query: string): Promise<T | null> {
  try {
    return await sanityClient.fetch(query);
  } catch {
    return null;
  }
}

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

  const [heroContent, aboutContent, educatorsContent, demoContent] = await Promise.all([
    fetchSanityDoc<HomeHeroContent>(heroQuery),
    fetchSanityDoc<AboutHomeContent>(aboutHomeQuery),
    fetchSanityDoc<OurEducatorsContent>(educatorsQuery),
    fetchSanityDoc<DemoCardContent>(demoCardQuery),
  ]);

  return (
    <div >
      <main className="min-h-screen bg-[#FAF9F8]">
        {/* <Navbar /> */}
        <Hero content={heroContent} />
        <AboutSection content={aboutContent} />
        <AdvantageSection />
        <ProgramsOverviewSection coursesByCategory={youngCourses} />
        <AdultLearnersSection coursesByCategory={adultCourses} />
        <HowItWorksSection />
        <OurEducatorsSection content={educatorsContent} />
        <DemoCardSection content={demoContent} />
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
