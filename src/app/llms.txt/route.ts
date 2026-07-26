import { getBlogPosts } from "@/src/lib/blog";
import { SITE_NAME, absoluteUrl } from "@/src/lib/siteConfig";

// Regenerate hourly so newly published posts appear (ISR).
export const revalidate = 3600;

// Serves /llms.txt — a curated, LLM-friendly map of the site's content,
// following the llms.txt convention (https://llmstxt.org).
export async function GET() {
  const posts = await getBlogPosts();

  const clean = (s?: string) => (s || "").replace(/\s+/g, " ").trim();

  const lines: string[] = [
    `# ${SITE_NAME}`,
    "",
    "> Personalized 1-on-1 online tutoring for young learners and adults.",
    "",
    `${SITE_NAME} offers personalized 1-on-1 online tutoring — Math, Science, English, IELTS and more — delivered by certified educators.`,
    "",
    "## Blog",
  ];

  if (posts.length === 0) {
    lines.push("- No posts published yet.");
  } else {
    for (const p of posts) {
      const note = clean(p.excerpt);
      lines.push(
        `- [${p.title}](${absoluteUrl(`/blogs/${p.slug}`)})${note ? `: ${note}` : ""}`
      );
    }
  }

  lines.push(
    "",
    "## Key Pages",
    `- [Blog](${absoluteUrl("/blogs")}): Learning insights, study tips and education guidance.`,
    `- [Young Learners](${absoluteUrl("/young-learners")}): Programs for young learners.`,
    `- [Adult Learners](${absoluteUrl("/adult-learners")}): Programs for adult learners.`,
    `- [About](${absoluteUrl("/about")}): About ${SITE_NAME}.`,
    `- [Contact](${absoluteUrl("/contact")}): Get in touch or book a free trial class.`,
    ""
  );

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
