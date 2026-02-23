import {defineType, defineField} from "sanity";

export const pricing = defineType({
    name: "pricing",
    title: "Pricing",
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
            name: "priceTitle",
            title: "Price Title",
            type: "string",
        }),
        defineField({
            name: "priceLabel",
            title: "Price Label",
            type: "array",
            of: [{type: "string"}],
        }),
        defineField({
            name: "programmeTitle",
            title: "Programme Title",
            type: "string",
        }),
        defineField({
            name: "programmeFeature",
            title: "Programme Feature",
            type: "array",
            of: [{type: "string"}],
        }),
    ],
});