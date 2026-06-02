import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sanityClient } from "@/src/lib/sanityClient";
import PageHero from "@/src/components/core/PageHero";
import PortableText from "@/src/components/pages/PortableText";
import Footer from "@/src/components/core/Footer";

export const revalidate = 300;

type BlogPost = {
  title: string;
  slug: string;
  author: string;
  date: string;
  excerpt: string;
  content: unknown[];
  imageUrl: string;
};

const query = `*[_type == "blog" && slug.current == $slug][0]{
  title,
  "slug": slug.current,
  author,
  date,
  excerpt,
  content,
  "imageUrl": image.asset->url
}`;

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    return await sanityClient.fetch(query, { slug });
  } catch {
    return null;
  }
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Article not found" };
  return {
    title: post.title,
    description: post.excerpt,
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return (
    <main className="min-h-screen bg-[#FAF9F8]">
      <PageHero
        eyebrow={formatDate(post.date) || "Blog"}
        heading={post.title}
        subheading={post.author ? `By ${post.author}` : undefined}
      />

      <article className="max-w-[820px] mx-auto px-4 md:px-6 py-12 md:py-16">
        {post.imageUrl ? (
          <div className="rounded-[24px] overflow-hidden shadow-[0_20px_60px_rgba(15,60,180,0.15)] mb-8 md:mb-12 h-[260px] md:h-[420px]">
            <img
              src={post.imageUrl}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : null}

        {post.excerpt ? (
          <p className="font-nunito text-[17px] md:text-[20px] text-[#17315F] leading-relaxed mb-6 md:mb-8 font-semibold">
            {post.excerpt}
          </p>
        ) : null}

        <PortableText value={post.content as never} />

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
