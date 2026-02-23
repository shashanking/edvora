import { defineType, defineField } from "sanity";

export const FAQ = defineType({
    name: "faq",
    title: "FAQ",
    type: "document",
    fields: [
        defineField({
            name: "title",
            title: "Title",
            type: "string",
        }),
        defineField({
            name: "description",
            title: "description",
            type: "string",
        }),
        defineField({
            name: "questionCard",
            title: "Question Card",
            type: "array",
            of: [
                defineField({
                    name: "card",
                    title: "Card",
                    type: "object",
                    fields: [
                        defineField({
                            name: "question",
                            title: "Question",
                            type: "string",
                        }),
                        defineField({
                            name: "answer",
                            title: "Answer",
                            type: "string",
                        }),
                    ],
                }),
            ]
        })
    ],
});