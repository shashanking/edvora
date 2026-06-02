import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { buildAdultCourseCatalog, type LmsLandingCourse } from "@/src/lib/course-catalog";
import { sanityClient } from "@/src/lib/sanityClient";
import PageHero from "@/src/components/core/PageHero";
import LearnerIntro, { type LearnerHighlight } from "@/src/components/pages/LearnerIntro";
import AdultLearnersSection from "@/src/components/Home/AdultLearnersSection";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Adult Learners",
  description:
    "Advance your skills and career with Addify Academy — professional development and academic support through personalized 1-on-1 learning for ages 16+.",
};

export const revalidate = 300;

type AdultLearnersDoc = {
  heroHeading?: string;
  ageRange?: string;
  heroSubheading?: string;
  description?: string;
  image?: string;
  highlights?: LearnerHighlight[];
};

const FALLBACK = {
  heroHeading: "For Adult Learners",
  ageRange: "Ages 16+",
  heroSubheading:
    "Advancing your skills and career with flexible, one-on-one learning built around your ambitions.",
  description: `Whether you're sharpening professional skills, switching careers, or returning to academics, our mentors design a plan that fits your schedule and your goals.

From spoken English and business communication to advanced academics and exam prep, you'll work one-on-one with a specialist committed to measurable progress.`,
  image: "/Educators.png",
  highlights: [
    { title: "Professional Development", description: "Spoken English, business communication, and interview prep." },
    { title: "Academic Support", description: "Advanced maths, science, and literature at university level." },
    { title: "Flexible Scheduling", description: "Sessions that fit around work and life commitments." },
    { title: "Career-Focused", description: "Practical skills and confidence that translate to real results." },
  ] as LearnerHighlight[],
};

const docQuery = `*[_type == "adultLearnersPage"][0]{
  heroHeading,
  ageRange,
  heroSubheading,
  description,
  "image": image.asset->url,
  highlights[]{ title, description }
}`;

export default async function AdultLearnersPage() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("courses")
    .select("title, description, duration, thumbnail_url, rating, audience, landing_category")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: LmsLandingCourse[] | null };

  const adultCourses = buildAdultCourseCatalog(data ?? []);

  let doc: AdultLearnersDoc | null = null;
  try {
    doc = await sanityClient.fetch(docQuery);
  } catch {
    doc = null;
  }

  const highlights = doc?.highlights?.length ? doc.highlights : FALLBACK.highlights;

  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <PageHero
        eyebrow={doc?.ageRange || FALLBACK.ageRange}
        heading={doc?.heroHeading || FALLBACK.heroHeading}
        subheading={doc?.heroSubheading || FALLBACK.heroSubheading}
      />
      <LearnerIntro
        theme="adult"
        ageRange={doc?.ageRange || FALLBACK.ageRange}
        description={doc?.description || FALLBACK.description}
        image={doc?.image || FALLBACK.image}
        highlights={highlights}
      />
      <AdultLearnersSection coursesByCategory={adultCourses} />
      <Footer />
    </main>
  );
}
