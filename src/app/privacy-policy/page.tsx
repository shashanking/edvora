import type { Metadata } from "next";
import { PortableText } from "@portabletext/react";
import { sanityClient } from "@/src/lib/sanityClient";
import PageHero from "@/src/components/core/PageHero";
import Footer from "@/src/components/core/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Learn how Addify Academy collects, uses, and protects your personal information.",
};

export const revalidate = 300;

const query = `*[_type == "privacyPolicy"][0]{
  lastUpdated,
  body
}`;

export default async function PrivacyPolicyPage() {
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
        heading="Privacy Policy"
        subheading="How we collect, use, and protect your information."
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
          <div className="space-y-10 text-[15px] leading-relaxed">
            <p className="text-gray-500">Content coming soon.</p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  );
}
