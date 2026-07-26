import { defineType, defineField } from "sanity";

export const blog = defineType({
    name: "blog",
    title: "Blog",
    type: "document",
    groups: [
        { name: "content", title: "Content", default: true },
        { name: "seo", title: "SEO" },
    ],
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
            group: "content",
        }),
        defineField({
            name: "slug",
            title: "Slug",
            type: "slug",
            group: "content",
            description: "URL path under /blogs/. Keep it short and keyword-rich.",
            options: {
                source: "title",
                maxLength: 96,
            },
        }),
        defineField({
            name: "image",
            title: "Image",
            type: "image",
            group: "content",
            options: { hotspot: true },
            fields: [
                defineField({
                    name: "alt",
                    title: "Alt text",
                    type: "string",
                    description: "Describe the image. Important for SEO and accessibility.",
                }),
            ],
        }),
        defineField({
            name: "author",
            title: "Author",
            type: "string",
            group: "content",
        }),
        defineField({
            name: "date",
            title: "Date",
            type: "datetime",
            group: "content",
        }),
        defineField({
            name: "excerpt",
            title: "Excerpt",
            type: "text",
            rows: 3,
            group: "content",
            description:
                "Short summary shown in listings. Used as the fallback meta description if none is set.",
        }),
        defineField({
            name: "content",
            title: "Content",
            type: "array",
            group: "content",
            of: [{type: "block"}]
        }),
        defineField({
            name: "keyTakeaway",
            title: "Key takeaway",
            type: "text",
            rows: 3,
            group: "content",
            description:
                "1–3 sentence direct answer to the post's core question. Rendered in a highlighted box and used as the default meta description. Write it to stand alone (helps AI answer engines quote it directly).",
        }),
        defineField({
            name: "faqs",
            title: "FAQs",
            type: "array",
            group: "content",
            of: [{ type: "blogFaqItem" }],
            description:
                "Optional Q&A pairs. Renders an FAQ section and FAQPage JSON-LD.",
        }),

        // ---- SEO group ----
        defineField({
            name: "metaTitle",
            title: "Meta Title",
            type: "string",
            group: "seo",
            description:
                "Overrides <title> and og:title. Aim for ~60 characters. Falls back to Title.",
            validation: (rule) => rule.max(70),
        }),
        defineField({
            name: "metaDescription",
            title: "Meta Description",
            type: "text",
            rows: 3,
            group: "seo",
            description:
                "Shown in search results. Aim for ~155 characters. Falls back to Excerpt.",
            validation: (rule) => rule.max(170),
        }),
        defineField({
            name: "ogImage",
            title: "Social Share Image",
            type: "image",
            group: "seo",
            description:
                "Used for og:image / Twitter card. 1200x630 recommended. Falls back to Image.",
        }),
        defineField({
            name: "canonicalUrl",
            title: "Canonical URL",
            type: "url",
            group: "seo",
            description:
                "Only set this if the same content canonically lives at another URL. Leave empty otherwise.",
        }),
        defineField({
            name: "noIndex",
            title: "Hide from search engines (noindex)",
            type: "boolean",
            group: "seo",
            initialValue: false,
            description:
                "Turn on to keep this post out of Google. Also excludes it from the sitemap.",
        }),
    ],
    orderings: [
        {
            title: "Date, newest first",
            name: "dateDesc",
            by: [{ field: "date", direction: "desc" }],
        },
    ],
    preview: {
        select: { title: "title", subtitle: "date", media: "image" },
    },
});