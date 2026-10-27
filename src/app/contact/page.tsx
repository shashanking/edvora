import type { Metadata } from "next";
import { buildMetadata } from "@/src/lib/seo";
import PageHero from "@/src/components/core/PageHero";
import ContactSection from "@/src/components/Home/ContactSection";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = buildMetadata({
  path: "/contact",
  fallbackTitle: "Contact Addify Academy | Book a Free Trial English Class",
  fallbackDescription:
    "Questions about online English classes for your child? Call or WhatsApp +91 93303 88153, or book a free trial class with Addify Academy.",
});

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
