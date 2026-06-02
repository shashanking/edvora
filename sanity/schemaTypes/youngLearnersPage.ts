import { defineType, defineField } from "sanity";

export const youngLearnersPage = defineType({
  name: "youngLearnersPage",
  title: "Young Learners Page",
  type: "document",
  fields: [
    defineField({
      name: "heroHeading",
      title: "Hero Heading",
      type: "string",
      initialValue: "For Young Learners",
    }),
    defineField({
      name: "ageRange",
      title: "Age Range",
      type: "string",
      initialValue: "Ages 4-15",
    }),
    defineField({
      name: "heroSubheading",
      title: "Hero Subheading",
      type: "text",
      rows: 2,
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 6,
    }),
    defineField({
      name: "image",
      title: "Image",
      type: "image",
      options: { hotspot: true },
    }),
    defineField({
      name: "highlights",
      title: "Highlights",
      type: "array",
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
  ],
});
