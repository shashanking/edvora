import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "resource"][0]{
  title,
  description,
  resourceCard[]{
    title,
    "iconUrl": icon.asset->url,
    "imageUrl": image.asset->url,
    items[]{
      title,
      "iconUrl": icon.asset->url
    }
  }
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Resource from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Resource content" },
      { status: 500 }
    );
  }
}