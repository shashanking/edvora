import type { Metadata } from "next";
import { sanityClient } from "@/src/lib/sanityClient";
import { buildMetadata, SEO_PROJECTION, type SeoFields } from "@/src/lib/seo";
import PageHero from "@/src/components/core/PageHero";
import BlogList from "@/src/components/pages/BlogList";
import Footer from "@/src/components/core/Footer";
import { breadcrumbSchema, organizationSchema } from "@/src/lib/schema";

const FALLBACK_TITLE = "Blogs | Addify Academy";
const FALLBACK_DESCRIPTION =
  "Learning insights, study tips, and education guidance from the mentors at Addify Academy.";

export async function generateMetadata(): Promise<Metadata> {
  let seo: SeoFields | null = null;
  try {
    seo = await sanityClient.fetch(`*[_type == "blogpage"][0]{ ${SEO_PROJECTION} }`);
  } catch {
    seo = null;
  }

  return buildMetadata({
    path: "/blogs",
    fallbackTitle: FALLBACK_TITLE,
    fallbackDescription: FALLBACK_DESCRIPTION,
    seo,
  });
}

export const revalidate = 300;

type BlogPageHeader = { title?: string; description?: string };

const headerQuery = `*[_type == "blogpage"][0]{ title, description }`;

export default async function BlogsPage() {
  let header: BlogPageHeader | null = null;
  try {
    header = await sanityClient.fetch(headerQuery);
  } catch {
    header = null;
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blogs", url: "/blogs" },
      ]),
    ],
  };

  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <script
        type="application/ld+json"
        // JSON-LD must be a raw string; safe because it's our own structured data.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <PageHero
        eyebrow="Blogs"
        heading={header?.title || "Insights & Articles"}
        subheading={
          header?.description ||
          "Practical learning tips, study strategies, and stories from our mentors — written to help every learner grow."
        }
      />
      <BlogList />
      <Footer />
    </main>
  );
}
