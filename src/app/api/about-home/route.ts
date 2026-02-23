import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "aboutHome"][0]{
  _id,
  heading,
  description,
  "image": image.asset->url
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching about Home from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load About Home content" },
      { status: 500 }
    );
  }
}