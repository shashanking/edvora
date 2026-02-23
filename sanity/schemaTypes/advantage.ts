import { defineField,defineType } from "sanity";

export const advantage = defineType({
    name: "advantage",
    title: "Advantage",
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
                            name: "image",
                            title: "Image",
                            type: "image",
                            options: { hotspot: true },
                        }),
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
                })
            ],
        })
    ],
});