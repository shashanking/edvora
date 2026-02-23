import { defineField, defineType } from "sanity";

export const footer = defineType({
  name: "footer",
  title: "Footer",
  type: "document",
  fields: [
    defineField({
      name: "description",
      title: "Description",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "refundPolicy",
      title: "Refund Policy",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "privacyPolicy",
      title: "Privacy Policy",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "tremsAndConditions",
      title: "Terms and Conditions",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "forumTerms",
      title: "Forum Terms",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "phone",
      title: "Phone",
      type: "string",
    }),
    defineField({
      name: "email",
      title: "Email",
      type: "string",
    }),
    defineField({
      name: "address",
      title: "Address",
      type: "string",
    }),
    defineField({
      name: "instalink",
      title: "Instagram Link",
      type: "string",
    }),
    defineField({
      name: "xlink",
      title: "X Link",
      type: "string",
    }),
    defineField({
      name: "facebooklink",
      title: "Facebook Link",
      type: "string",
    }),
    defineField({
      name: "linkedinlink",
      title: "Linkedin Link",
      type: "string",
    }),
  ],
});