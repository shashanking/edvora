import { defineConfig } from "sanity";
import { deskTool } from "sanity/desk";
import { visionTool } from "@sanity/vision";

import { schemaTypes } from "./sanity/schemaTypes";

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!;
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET!;
const apiVersion = process.env.NEXT_PUBLIC_SANITY_API_VERSION || "2021-10-21";

export default defineConfig({
  name: "default",
  title: "Addify Academy",

  projectId,
  dataset,

  basePath: "/studio",

  apiVersion,
  useCdn: true,

  plugins: [deskTool(), visionTool()],

  schema: {
    types: schemaTypes,
  },
});
