import type {
  Article,
  BreadcrumbList,
  FAQPage,
  Organization,
  WithContext,
} from "schema-dts";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION, ORG_ID, absoluteUrl } from "./siteConfig";
import type { BlogPost } from "./blog";

export function organizationSchema(): WithContext<Organization> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": ORG_ID,
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };
}

export function blogPostingSchema(
  post: BlogPost,
  url: string
): WithContext<Article> {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    headline: post.metaTitle || post.title,
    description:
      post.keyTakeaway || post.metaDescription || post.excerpt || "",
    image: post.ogImageUrl ? [post.ogImageUrl] : undefined,
    datePublished: post.date,
    dateModified: post.updatedAt || post.date,
    author: post.author
      ? { "@type": "Person", name: post.author }
      : { "@id": ORG_ID },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
  };
}

export function breadcrumbSchema(
  items: { name: string; url: string }[]
): WithContext<BreadcrumbList> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : absoluteUrl(item.url),
    })),
  };
}

export function faqSchema(
  faqs: { question: string; answer: string }[]
): WithContext<FAQPage> | null {
  if (!faqs?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };
}
