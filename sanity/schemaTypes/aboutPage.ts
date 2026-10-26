import { defineType, defineField } from "sanity";

export const aboutPage = defineType({
  name: "aboutPage",
  title: "About Page",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "heroHeading",
      title: "Hero Heading",
      type: "string",
      group: "content",
      initialValue: "About Addify Academy",
    }),
    defineField({
      name: "heroSubheading",
      title: "Hero Subheading",
      type: "text",
      rows: 2,
      group: "content",
    }),
    defineField({
      name: "storyHeading",
      title: "Story Heading",
      type: "string",
      group: "content",
      initialValue: "Our Story",
    }),
    defineField({
      name: "storyDescription",
      title: "Story Description",
      type: "text",
      rows: 8,
      group: "content",
    }),
    defineField({
      name: "storyImage",
      title: "Story Image",
      type: "image",
      options: { hotspot: true },
      group: "content",
    }),
    defineField({
      name: "mission",
      title: "Mission",
      type: "text",
      rows: 4,
      group: "content",
    }),
    defineField({
      name: "vision",
      title: "Vision",
      type: "text",
      rows: 4,
      group: "content",
    }),
    defineField({
      name: "stats",
      title: "Stats",
      type: "array",
      group: "content",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "value", title: "Value", type: "string" }),
            defineField({ name: "label", title: "Label", type: "string" }),
          ],
        },
      ],
    }),
    defineField({
      name: "values",
      title: "Core Values",
      type: "array",
      group: "content",
      of: [
        {
          type: "object",
          fields: [
            defineField({ name: "title", title: "Title", type: "string" }),
            defineField({
              name: "description",
              title: "Description",
              type: "text",
              rows: 3,
            }),
          ],
        },
      ],
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
      description:
        "Used for og:image / Twitter card. 1200x630 recommended. Falls back to Story Image.",
    }),
  ],
});
