import type { MetadataRoute } from "next";
import { getBlogPosts } from "@/src/lib/blog";
import { absoluteUrl } from "@/src/lib/siteConfig";

export const revalidate = 3600;

// Static, public marketing routes worth advertising to crawlers.
// Auth, dashboard, studio and API routes are intentionally excluded
// (see robots.ts) and don't belong here either.
const STATIC_PATHS = [
  "/",
  "/about",
  "/young-learners",
  "/adult-learners",
  "/contact",
  "/blogs",
  "/privacy-policy",
  "/refund-policy",
  "/terms-conditions",
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getBlogPosts();

  const staticEntries: MetadataRoute.Sitemap = STATIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  }));

  const blogEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: absoluteUrl(`/blogs/${post.slug}`),
    lastModified: post.date ? new Date(post.date) : undefined,
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  return [...staticEntries, ...blogEntries];
}
