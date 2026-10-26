import type { Metadata } from "next";
import { sanityClient } from "@/src/lib/sanityClient";
import { buildMetadata, SEO_PROJECTION, type SeoFields } from "@/src/lib/seo";
import AboutContent from "@/src/components/pages/AboutContent";
import Footer from "@/src/components/core/Footer";

const FALLBACK_TITLE = "About Us | Addify Academy";
const FALLBACK_DESCRIPTION =
  "Learn about Addify Academy — personalized 1-on-1 tutoring that closes learning gaps and builds confidence for young learners and adults.";

export async function generateMetadata(): Promise<Metadata> {
  let seo: SeoFields | null = null;
  try {
    seo = await sanityClient.fetch(`*[_type == "aboutPage"][0]{ ${SEO_PROJECTION} }`);
  } catch {
    seo = null;
  }

  return buildMetadata({
    path: "/about",
    fallbackTitle: FALLBACK_TITLE,
    fallbackDescription: FALLBACK_DESCRIPTION,
    seo,
  });
}

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <AboutContent />
      <Footer />
    </main>
  );
}
