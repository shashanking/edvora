import { defineField, defineType } from "sanity";

type MyArrayOptions = {
  hotspot: boolean;
}

export const homeHero = defineType({
  name: "homeHero",
  title: "Home Hero",
  type: "document",
  fields: [
    defineField({
      name: "mainTag",
      title: "Main Tag",
      type: "string",
      initialValue: "Certified Educators Across All Subjects | 500+ Students Transformed Globally",
    }),
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "ADDIFY ACADEMY: Your Global Learning Partner",
    }),
    defineField({
      name: "tag",
      title: "Tag",
      type: "string",
      initialValue: "Master Any Subject with Expert-Led, Personalized 1-on-1 Learning",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "feature",
      title: "Feature",
      type: "array",
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
    })
  ],
});