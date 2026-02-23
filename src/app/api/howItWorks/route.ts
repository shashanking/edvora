import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "howItWorks"][0]{
  heading,
  description,
  card[]{
    title,
    description
  }
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching How It Works from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load How It Works content" },
      { status: 500 }
    );
  }
}