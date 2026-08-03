import { defineType, defineField } from "sanity";

export const privacyPolicy = defineType({
    name: "privacyPolicy",
    title: "Privacy Policy",
    type: "document",
    fields: [
        defineField({
            name: "lastUpdated",
            title: "Last Updated",
            type: "date",
        }),
        defineField({
            name: "body",
            title: "Content",
            type: "array",
            of: [
                {
                    type: "block",
                    styles: [
                        { title: "Normal", value: "normal" },
                        { title: "Heading 2", value: "h2" },
                        { title: "Heading 3", value: "h3" },
                    ],
                    marks: {
                        decorators: [
                            { title: "Strong", value: "strong" },
                            { title: "Emphasis", value: "em" },
                            { title: "Underline", value: "underline" },
                        ],
                    },
                },
            ],
        }),
    ],
});
