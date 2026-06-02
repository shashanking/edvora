import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "youngLearnersPage"][0]{
  _id,
  heroHeading,
  ageRange,
  heroSubheading,
  description,
  "image": image.asset->url,
  highlights[]{ title, description }
}`;

export async function GET() {
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Young Learners Page from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Young Learners Page content" },
      { status: 500 }
    );
  }
}
