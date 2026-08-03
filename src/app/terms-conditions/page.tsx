import type { Metadata } from "next";
import { PortableText } from "@portabletext/react";
import { sanityClient } from "@/src/lib/sanityClient";
import PageHero from "@/src/components/core/PageHero";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions",
  description: "Addify Academy terms and conditions of use.",
};

export const revalidate = 300;

const query = `*[_type == "termsConditions"][0]{
  lastUpdated,
  body
}`;

export default async function TermsConditionsPage() {
  let doc: { lastUpdated?: string; body?: unknown[] } | null = null;
  try {
    doc = await sanityClient.fetch(query);
  } catch {
    doc = null;
  }

  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <PageHero
        eyebrow="Legal"
        heading="Terms & Conditions"
        subheading="The rules and guidelines for using our platform."
      />

      <section className="max-w-[860px] mx-auto px-4 md:px-8 py-16 md:py-24 text-gray-700">
        {doc?.lastUpdated && (
          <p className="text-sm text-gray-500 mb-10">
            Last updated:{" "}
            {new Date(doc.lastUpdated).toLocaleDateString("en-GB", {
              month: "long",
              year: "numeric",
            })}
          </p>
        )}

        {doc?.body && doc.body.length > 0 ? (
          <div className="prose prose-gray max-w-none text-[15px] leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-gray-900 [&_h2]:mb-3 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-gray-900 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-2 [&_ul]:pl-2">
            <PortableText value={doc.body as Parameters<typeof PortableText>[0]["value"]} />
          </div>
        ) : (
          <section className="text-center text-gray-500 py-12">
            <p className="text-lg">This page is coming soon.</p>
            <p className="mt-3 text-sm">
              For any questions about our terms, please contact us at{" "}
              <a href="mailto:contact@addifyacademy.com" className="text-[#1F4FD8] underline">
                contact@addifyacademy.com
              </a>
              .
            </p>
          </section>
        )}
      </section>

      <Footer />
    </main>
  );
}
