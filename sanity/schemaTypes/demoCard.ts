import { defineType,defineField } from "sanity";

export const demoCard = defineType({
    name: "demoCard",
    title: "Demo Card",
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
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "image",
            title: "Image",
            type: "image",
            options: { hotspot: true },
        }),
        defineField({
            name: "features",
            title: "Features",
            type: "array",
            of: [{type: "string"}]
        }),
    ],
});