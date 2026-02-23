import { defineType, defineField } from "sanity";

export const contact = defineType({
    name: "contact",
    title: "Contact",
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
            type: "string",
        }),
        defineField({
            name: "callDescription",
            title: "Call Description",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "phone",
            title: "Phone",
            type: "string",
        }),
        defineField({
            name: "emailDescription",
            title: "Email Description",
            type: "text",
            rows: 3,
        }),
        defineField({
            name: "email",
            title: "Email",
            type: "string",
        }),
    ],
});