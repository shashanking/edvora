import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "contact"][0]{
  _id,
  title,
  description,
  callDescription,
  phone,
  emailDescription,
  email
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Contact from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Contact content" },
      { status: 500 }
    );
  }
}