import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "aboutPage"][0]{
  _id,
  heroHeading,
  heroSubheading,
  storyHeading,
  storyDescription,
  "storyImage": storyImage.asset->url,
  mission,
  vision,
  stats[]{ value, label },
  values[]{ title, description }
}`;

export async function GET() {
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching About Page from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load About Page content" },
      { status: 500 }
    );
  }
}
