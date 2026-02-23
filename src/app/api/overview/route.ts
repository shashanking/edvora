import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "overview"][0]{
  heading,
  description,
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Overview Home from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Overview Home content" },
      { status: 500 }
    );
  }
}