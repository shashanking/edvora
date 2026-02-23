import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "testimonials"][0]{
  heading,
  description,
  card[]{
    "imageUrl": image.asset->url,
    name,
    rating,
    category,
    description,
    subtitle
  }
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Testimonials from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Testimonials content" },
      { status: 500 }
    );
  }
}