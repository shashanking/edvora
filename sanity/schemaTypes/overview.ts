import { defineType, defineField } from "sanity";

export const overview = defineType({
    name: "overview",
    title: "Overview",
    type: "document",
    fields: [
        defineField({
            name: "heading",
            title: "Heading",
            type: "string",
        }),
        defineField({
            name: "description",
            title: "Description",
            type: "string",
        }),
    ],
});