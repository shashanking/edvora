import { defineType,defineField } from "sanity";

export const testimonials = defineType({
    name: "testimonials",
    title: "Testimonials",
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
                            name: "name",
                            title: "Name",
                            type: "string",
                        }),
                        defineField({
                            name: "rating",
                            title: "Rating",
                            type: "number",
                        }),
                        defineField({
                            name: "category",
                            title: "Category",
                            type: "string",
                        }),
                        defineField({
                            name: "description",
                            title: "Description",
                            type: "text",
                            rows: 3,
                        }),
                        defineField({
                            name: "subtitle",
                            title: "Subtitle",
                            type: "string",
                        })
                    ],
                }),
            ],
        }),
    ],
});