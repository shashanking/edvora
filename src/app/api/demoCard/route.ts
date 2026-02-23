import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "demoCard"][0]{
  heading,
  description,
  "imageUrl": image.asset->url,
  features
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Demo Card from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Demo Card content" },
      { status: 500 }
    );
  }
}