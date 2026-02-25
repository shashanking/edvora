import { defineField, defineType } from "sanity";

type MyArrayOptions = {
  hotspot: boolean;
}

export const aboutHome = defineType({
  name: "aboutHome",
  title: "About Home",
  type: "document",
  fields: [
    defineField({
      name: "heading",
      title: "Heading",
      type: "string",
      initialValue: "ABOUT ADDIFY ACADEMY",
    }),
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 7,
    }),
    defineField({
        name: "image",
        title: "Image",
        type: "image",
        options: { hotspot: true },
    })
  ],
});