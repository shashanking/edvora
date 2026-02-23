import { defineType, defineField } from "sanity";

export const resource = defineType({
    name: "resource",
    title: "Resource",
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
            name: "resourceCard",
            title: "Resource Card",
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
                            name: "icon",
                            title: "Icon",
                            type: "image",
                            options: { hotspot: true },
                        }),
                        defineField({
                            name: "image",
                            title: "Image",
                            type: "image",
                            options: { hotspot: true },
                        }),
                        defineField({
                            name: "items",
                            title: "Items",
                            type: "array",
                            of: [
                                defineField({
                                    name: "item",
                                    title: "Item",
                                    type: "object",
                                    fields: [
                                        defineField({
                                            name: "title",
                                            title: "Title",
                                            type: "string",
                                        }),
                                        defineField({
                                            name: "icon",
                                            title: "Icon",
                                            type: "image",
                                            options: { hotspot: true },
                                        }),
                                    ],
                                })
                            ]
                        })
                    ],
                })
            ]
        }),
    ],
});