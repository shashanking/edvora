import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "homeHero"][0]{
  _id,
  mainTag,
  heading,
  tag,
  images[]{
    "url": asset->url
  }
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Home hero from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Home hero content" },
      { status: 500 }
    );
  }
}