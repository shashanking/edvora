import { sanityClient } from "./sanityClient";

// ---- Types ----
// Field names (title, slug, image, author, date, excerpt, content) match the
// existing `blog` Sanity document so no content migration is needed. The SEO
// fields below are additive (see sanity/schemaTypes/blog.ts).
export type BlogListItem = {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  date: string;
  imageUrl?: string;
  imageAlt?: string;
  author?: string;
};

export type BlogPost = BlogListItem & {
  updatedAt?: string;
  metaTitle?: string;
  metaDescription?: string;
  ogImageUrl?: string;
  canonicalUrl?: string;
  noIndex?: boolean;
  keyTakeaway?: string;
  faqs?: { question: string; answer: string }[];
  // Portable Text blocks.
  content?: unknown[];
};

// Exclude Sanity drafts in every query.
const PUBLISHED = `!(_id in path("drafts.**"))`;

const listFields = `
  _id,
  title,
  "slug": slug.current,
  excerpt,
  date,
  "imageUrl": image.asset->url,
  "imageAlt": image.alt,
  author
`;

export async function getBlogPosts(): Promise<BlogListItem[]> {
  const query = `*[_type == "blog" && ${PUBLISHED} && noIndex != true]
    | order(date desc){${listFields}}`;
  return (await sanityClient.fetch(query)) ?? [];
}

export async function getBlogSlugs(): Promise<string[]> {
  const query = `*[_type == "blog" && defined(slug.current) && ${PUBLISHED}].slug.current`;
  return (await sanityClient.fetch(query)) ?? [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const query = `*[_type == "blog" && slug.current == $slug && ${PUBLISHED}][0]{
    ${listFields},
    updatedAt,
    content,
    metaTitle,
    metaDescription,
    "ogImageUrl": coalesce(ogImage.asset->url, image.asset->url),
    canonicalUrl,
    noIndex,
    keyTakeaway,
    faqs[]{ question, answer }
  }`;
  return (await sanityClient.fetch(query, { slug })) ?? null;
}
