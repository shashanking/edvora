import { defineField, defineType } from "sanity";

type MyArrayOptions = {
  hotspot: boolean;
}

export const homeHero = defineType({
  name: "homeHero",
  title: "Home Hero",
  type: "document",
  groups: [
    { name: "content", title: "Content", default: true },
    { name: "seo", title: "SEO" },
  ],
  fields: [
    defineField({
      name: "mainTag",
      title: "Main Tag",
      type: "string",
      group: "content",
      initialValue: "Certified Educators Across All Subjects | 500+ Students Transformed Globally",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      group: "content",
      initialValue: "ADDIFY ACADEMY: Your Global Learning Partner",
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      group: "content",
      initialValue: "Master Any Subject with Expert-Led, Personalized 1-on-1 Learning",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
      group: "content",
    }),
    defineField({
      name: "feature",
      title: "Feature",
      type: "array",
      group: "content",
      of: [
        defineField({
          name: "feature",
          title: "Feature",
          type: "object",
          fields: [
            defineField({
             name: "icon",
             title: "Icon",
             type: "image",
             options: { hotspot: true },
            }),
            defineField({
              name: "title",
              title: "Title",
              type: "string",
            }),
          ],
        }),
      ]
    }),
    defineField({
        name: "image",
        title: "Image",
        type: "image",
        options: { hotspot: true },
        group: "content",
    }),

    // ---- SEO group ----
    defineField({
      name: "metaTitle",
      title: "Meta Title",
      type: "string",
      group: "seo",
      description:
        "Overrides the homepage <title> and og:title. Aim for ~60 characters. Falls back to the site default.",
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