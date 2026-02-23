import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "course"]{
    _id,
  "coverImageUrl": coverImage.asset->url,
    subject,
    description,
    duration,
    rating
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Course from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Course content" },
      { status: 500 }
    );
  }
}