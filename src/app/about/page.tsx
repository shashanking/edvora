import type { Metadata } from "next";
import { sanityClient } from "@/src/lib/sanityClient";
import { buildMetadata, SEO_PROJECTION, type SeoFields } from "@/src/lib/seo";
import AboutContent from "@/src/components/pages/AboutContent";
import Footer from "@/src/components/core/Footer";

const FALLBACK_TITLE = "About Addify Academy | Live 1-on-1 English Classes for Kids";
const FALLBACK_DESCRIPTION =
  "Addify Academy offers live 1-on-1 online English and phonics classes for kids aged 4–12, with caring expert teachers who build real confidence.";

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
