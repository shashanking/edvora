import { defineType, defineField } from "sanity";

export const ourEducators = defineType({
    name: "ourEducators",
    title: "Our Educators",
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
            name: "qualificationTitle",
            title: "Qualification Title",
            type: "string",
        }),
        defineField({
            name:"qualification",
            title:"Qualification",
            type: "array",
            of: [{type: "string"}]
        }),
        defineField({
            name: "criteriaTitle",
            title: "Criteria Title",
            type: "string",
        }),
        defineField({
            name:"criteria",
            title:"Criteria",
            type: "array",
            of: [{type: "string"}]
        }),
    ],
});