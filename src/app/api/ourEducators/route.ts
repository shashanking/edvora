import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "ourEducators"][0]{
  heading,
  description,
  "imageUrl": image.asset->url,
  qualificationTitle,
  qualification,
  criteriaTitle,
  criteria
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Our Educators from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Our Educators content" },
      { status: 500 }
    );
  }
}