import type { Metadata } from "next";
import { sanityClient } from "@/src/lib/sanityClient";
import PageHero from "@/src/components/core/PageHero";
import BlogList from "@/src/components/pages/BlogList";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Blogs",
  description:
    "Learning insights, study tips, and education guidance from the mentors at Addify Academy.",
};

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

  return (
    <main className="min-h-screen bg-[#FAF9F8]">
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
