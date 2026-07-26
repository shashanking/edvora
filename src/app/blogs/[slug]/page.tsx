import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHero from "@/src/components/core/PageHero";
import PortableText from "@/src/components/pages/PortableText";
import BlogFaqSection from "@/src/components/pages/BlogFaqSection";
import Footer from "@/src/components/core/Footer";
import { getBlogPost, getBlogSlugs } from "@/src/lib/blog";
import { SITE_NAME, absoluteUrl } from "@/src/lib/siteConfig";
import {
  blogPostingSchema,
  breadcrumbSchema,
  faqSchema,
  organizationSchema,
} from "@/src/lib/schema";

// Statically render each post and revalidate every 5 min (ISR), matching the
// rest of the blog routes.
export const revalidate = 300;

// Pre-build known posts at build time; new ones render on-demand.
export async function generateStaticParams() {
  const slugs = await getBlogSlugs();
  return slugs.map((slug) => ({ slug }));
}

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) {
    return { title: "Article not found", robots: { index: false, follow: false } };
  }

  const title = post.metaTitle || post.title;
  const description = post.metaDescription || post.excerpt || "";
  const url = absoluteUrl(`/blogs/${post.slug}`);
  const images = post.ogImageUrl
    ? [
        {
          url: post.ogImageUrl,
          width: 1200,
          height: 630,
          alt: post.imageAlt || post.title,
        },
      ]
    : undefined;

  return {
    title,
    description,
    alternates: { canonical: post.canonicalUrl || url },
    robots: post.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      type: "article",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images,
      publishedTime: post.date,
      modifiedTime: post.updatedAt || post.date,
      authors: post.author ? [post.author] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.ogImageUrl ? [post.ogImageUrl] : undefined,
    },
  };
}

const formatDate = (value?: string) => {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = await getBlogPost(slug);

  if (!post) notFound();

  const url = absoluteUrl(`/blogs/${post.slug}`);

  // Centralized Article + Breadcrumb (+ optional FAQ) structured data.
  const faqLd = faqSchema(post.faqs ?? []);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      organizationSchema(),
      blogPostingSchema(post, url),
      breadcrumbSchema([
        { name: "Home", url: "/" },
        { name: "Blogs", url: "/blogs" },
        { name: post.title, url },
      ]),
      ...(faqLd ? [faqLd] : []),
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
        eyebrow={formatDate(post.date) || "Blog"}
        heading={post.title}
        subheading={post.author ? `By ${post.author}` : undefined}
      />

      <article className="max-w-[820px] mx-auto px-4 md:px-6 py-12 md:py-16">
        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="flex items-center gap-2 mb-8 text-[13px] font-nunito text-[#2B2B2B]/70"
        >
          <Link href="/" className="hover:text-[#1F4FD8] transition-colors">
            Home
          </Link>
          <span>/</span>
          <Link href="/blogs" className="hover:text-[#1F4FD8] transition-colors">
            Blogs
          </Link>
          <span>/</span>
          <span className="text-[#082A6B] font-semibold">{post.title}</span>
        </nav>

        {post.imageUrl ? (
          <div className="rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(15,60,180,0.15)] mb-8 md:mb-12 h-[260px] md:h-[420px]">
            <img
              src={post.imageUrl}
              alt={post.imageAlt || post.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        {post.keyTakeaway ? (
          <aside className="mb-8 rounded-[16px] border-l-4 border-[#FFC83D] bg-[#FFF8E7] p-5">
            <p className="font-poppins text-[11px] font-bold uppercase tracking-wide text-[#B8860B]">
              Key takeaway
            </p>
            <p className="mt-2 font-nunito text-[15px] md:text-[16px] leading-relaxed text-[#2B2B2B]">
              {post.keyTakeaway}
            </p>
          </aside>
        ) : null}

        {post.excerpt ? (
          <p className="font-nunito text-[17px] md:text-[20px] text-[#17315F] leading-relaxed mb-6 md:mb-8 font-semibold">
            {post.excerpt}
          </p>
        ) : null}

        <PortableText value={post.content as never} />

        <BlogFaqSection faqs={post.faqs} />

        <div className="mt-12 pt-8 border-t border-[#0F3CB4]/15 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/blogs"
            className="font-poppins font-semibold text-[#1F4FD8] hover:text-[#102A72] transition-colors"
          >
            ← Back to all articles
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center px-7 py-3 bg-[#FFC83D] text-[#2B2B2B] rounded-full font-poppins font-semibold shadow-lg transition-all duration-300 hover:scale-105"
          >
            Book a Free Trial Class
          </Link>
        </div>
      </article>

      <Footer />
    </main>
  );
}
