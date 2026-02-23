import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "pricing"][0]{
  title,
  description,
  priceTitle,
  priceLabel,
  programmeTitle,
  programmeFeature
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Pricing from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Pricing content" },
      { status: 500 }
    );
  }
}