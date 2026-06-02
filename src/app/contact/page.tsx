import type { Metadata } from "next";
import PageHero from "@/src/components/core/PageHero";
import ContactSection from "@/src/components/Home/ContactSection";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with Addify Academy. Ask a question, book a free trial class, or explore how personalized 1-on-1 tutoring can help you grow.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <PageHero
        eyebrow="Contact Us"
        heading="Let's Get In Touch"
        subheading="Share your thoughts, ask questions, or explore opportunities to learn and grow together. We usually respond within one business day."
      />
      <ContactSection />
      <Footer />
    </main>
  );
}
