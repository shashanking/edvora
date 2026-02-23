import { defineType, defineField } from "sanity";

export const howItWorks = defineType({
    name: "howItWorks",
    title: "How It Works",
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
        defineField({
            name: "card",
            title: "Card",
            type: "array",
            of: [
                defineField({
                    name: "card",
                    title: "Card",
                    type: "object",
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
                }),
            ],
        })
    ],
});