import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "blogpage"][0]{
  title,
  description,
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Blog Page from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Blog Page content" },
      { status: 500 }
    );
  }
}