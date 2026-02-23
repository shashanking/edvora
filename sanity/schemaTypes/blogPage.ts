import { defineType, defineField } from "sanity";

export const blogPage = defineType({
    name: "blogpage",
    title: "BlogPage",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
        }),
        defineField({
            name: "description",
            title: "Description",
            type: "text",
            rows: 3,
        }),
    ],
});