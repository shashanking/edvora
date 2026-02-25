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
        name: "images",
        title: "Images",
        type: "array",
        of: [{type: "image",
            options: { hotspot: true },
        }],
    })
  ],
});