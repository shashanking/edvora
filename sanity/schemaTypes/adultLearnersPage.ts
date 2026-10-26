import { defineType, defineField } from "sanity";

export const adultLearnersPage = defineType({
  name: "adultLearnersPage",
  title: "Adult Learners Page",
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
      initialValue: "For Adult Learners",
    }),
    defineField({
      name: "ageRange",
      title: "Age Range",
      type: "string",
      group: "content",
      initialValue: "Ages 16+",
    }),
    defineField({
      name: "heroSubheading",
      title: "Hero Subheading",
      type: "text",
      rows: 2,
      group: "content",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 6,
      group: "content",
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
      group: "content",
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
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
        "Used for og:image / Twitter card. 1200x630 recommended. Falls back to Image.",
    }),
  ],
});
