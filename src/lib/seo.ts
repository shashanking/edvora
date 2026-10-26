import type { Metadata } from "next";
import { SITE_NAME, absoluteUrl } from "@/src/lib/siteConfig";

// Shape of the "SEO group" fields shared by homeHero, aboutPage,
// youngLearnersPage, adultLearnersPage and blogPage in Sanity.
export type SeoFields = {
  metaTitle?: string | null;
  metaDescription?: string | null;
  ogImageUrl?: string | null;
};

export const SEO_PROJECTION = `metaTitle, metaDescription, "ogImageUrl": ogImage.asset->url`;

// Builds page <title>/<meta description>/Open Graph/Twitter metadata,
// preferring Sanity's SEO fields and falling back to the page's hardcoded
// defaults when a field is empty.
export function buildMetadata({
  path,
  fallbackTitle,
  fallbackDescription,
  seo,
}: {
  path: string;
  fallbackTitle: string;
  fallbackDescription: string;
  seo?: SeoFields | null;
}): Metadata {
  const title = seo?.metaTitle || fallbackTitle;
  const description = seo?.metaDescription || fallbackDescription;
  const url = absoluteUrl(path);
  const images = seo?.ogImageUrl
    ? [{ url: seo.ogImageUrl, width: 1200, height: 630, alt: title }]
    : undefined;

  return {
    // `absolute` bypasses the root layout's "%s | Addify Academy" template —
    // SEO-set titles are meant to render exactly as typed, not get suffixed.
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title,
      description,
      url,
      siteName: SITE_NAME,
      images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: seo?.ogImageUrl ? [seo.ogImageUrl] : undefined,
    },
  };
}
