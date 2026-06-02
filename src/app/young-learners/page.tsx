import type { Metadata } from "next";
import { createClient } from "@/src/lib/supabase/server";
import { buildYoungCourseCatalog, type LmsLandingCourse } from "@/src/lib/course-catalog";
import { sanityClient } from "@/src/lib/sanityClient";
import PageHero from "@/src/components/core/PageHero";
import LearnerIntro, { type LearnerHighlight } from "@/src/components/pages/LearnerIntro";
import ProgramsOverviewSection from "@/src/components/Home/ProgrammeOverviewSection";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Young Learners",
  description:
    "Personalized 1-on-1 tutoring for young learners aged 4-15 — core academics, specialized programs, and exam preparation that build strong foundations.",
};

export const revalidate = 300;

type YoungLearnersDoc = {
  heroHeading?: string;
  ageRange?: string;
  heroSubheading?: string;
  description?: string;
  image?: string;
  highlights?: LearnerHighlight[];
};

const FALLBACK = {
  heroHeading: "For Young Learners",
  ageRange: "Ages 4-15",
  heroSubheading:
    "Building strong academic foundations through personalized, one-on-one learning tailored to every child.",
  description: `Every young mind learns differently. Our one-on-one sessions meet children exactly where they are — closing gaps, sparking curiosity, and building the confidence to love learning.

From core academics to specialized programs and exam preparation, each plan is shaped around your child's pace, strengths, and goals by a subject-specialist mentor.`,
  image: "/kids_class.png",
  highlights: [
    { title: "Core Academics", description: "Maths, Science, and English mastery from the ground up." },
    { title: "Specialized Programs", description: "Phonics, creative writing, and public speaking." },
    { title: "Exam Preparation", description: "SAT, 11+, and selective entrance exam readiness." },
    { title: "1-on-1 Mentorship", description: "Undivided attention from a dedicated specialist tutor." },
  ] as LearnerHighlight[],
};

const docQuery = `*[_type == "youngLearnersPage"][0]{
  heroHeading,
  ageRange,
  heroSubheading,
  description,
  "image": image.asset->url,
  highlights[]{ title, description }
}`;

export default async function YoungLearnersPage() {
  const supabase = await createClient();
  const { data } = (await supabase
    .from("courses")
    .select("title, description, duration, thumbnail_url, rating, audience, landing_category")
    .eq("status", "published")
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: false })) as { data: LmsLandingCourse[] | null };

  const youngCourses = buildYoungCourseCatalog(data ?? []);

  let doc: YoungLearnersDoc | null = null;
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
        theme="young"
        ageRange={doc?.ageRange || FALLBACK.ageRange}
        description={doc?.description || FALLBACK.description}
        image={doc?.image || FALLBACK.image}
        highlights={highlights}
      />
      <ProgramsOverviewSection coursesByCategory={youngCourses} />
      <Footer />
    </main>
  );
}
