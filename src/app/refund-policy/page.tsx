import type { Metadata } from "next";
import PageHero from "@/src/components/core/PageHero";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Refund Policy",
  description: "Addify Academy refund and cancellation policy.",
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <PageHero
        eyebrow="Legal"
        heading="Refund Policy"
        subheading="Our cancellation and refund guidelines."
      />

      <section className="max-w-[860px] mx-auto px-4 md:px-8 py-24 md:py-32 text-center text-gray-500">
        <p className="text-lg">This page is coming soon.</p>
        <p className="mt-3 text-sm">
          For any refund-related queries, please contact us at{" "}
          <a
            href="mailto:contact@addifyacademy.com"
            className="text-[#1F4FD8] underline"
          >
            contact@addifyacademy.com
          </a>
          .
        </p>
      </section>

      <Footer />
    </main>
  );
}
