import { defineField, defineType } from "sanity";

// Reusable Q&A pair for blog post FAQ sections (renders FAQPage JSON-LD).
// Kept separate from the `faq` document type, which powers the standalone
// FAQ page section instead.
export const blogFaqItem = defineType({
  name: "blogFaqItem",
  title: "FAQ item",
  type: "object",
  fields: [
    defineField({
      name: "question",
      title: "Question",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "answer",
      title: "Answer",
      type: "text",
      rows: 4,
      validation: (rule) => rule.required(),
    }),
  ],
  preview: { select: { title: "question" } },
});
