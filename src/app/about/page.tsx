import type { Metadata } from "next";
import AboutContent from "@/src/components/pages/AboutContent";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Addify Academy — personalized 1-on-1 tutoring that closes learning gaps and builds confidence for young learners and adults.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <AboutContent />
      <Footer />
    </main>
  );
}
