import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "blog"]{
  _id,
  title,
  "slug": slug.current,
  author,
  date,
  excerpt,
  content,
  "imageUrl": image.asset->url
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Blog from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Blog Home content" },
      { status: 500 }
    );
  }
}