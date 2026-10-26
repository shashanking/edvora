import { defineType, defineField } from "sanity";

export const blogPage = defineType({
    name: "blogpage",
    title: "BlogPage",
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
            name: "description",
            title: "Description",
            type: "text",
            rows: 3,
            group: "content",
        }),

        // ---- SEO group ----
        defineField({
            name: "metaTitle",
            title: "Meta Title",
            type: "string",
            group: "seo",
            description:
                "Overrides the page <title> and og:title. Aim for ~60 characters. Falls back to the site default.",
            validation: (rule) => rule.max(70),
        }),
        defineField({
            name: "metaDescription",
            title: "Meta Description",
            type: "text",
            rows: 3,
            group: "seo",
            description:
                "Shown in search results. Aim for ~155 characters. Falls back to the site default.",
            validation: (rule) => rule.max(170),
        }),
        defineField({
            name: "ogImage",
            title: "Social Share Image",
            type: "image",
            group: "seo",
            description: "Used for og:image / Twitter card. 1200x630 recommended.",
        }),
    ],
});