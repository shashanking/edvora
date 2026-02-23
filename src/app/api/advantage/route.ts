import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "advantage"][0]{
  _id,
  heading,
  description,
  card[]{
      _id,
      "imageUrl": image.asset->url,
      title,
      description
  }
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching advantage Home from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Advantage Home content" },
      { status: 500 }
    );
  }
}