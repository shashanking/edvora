import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "faq"][0]{
  title,
  description,
  questionCard[]{
    question,
    answer
  }
}`;

export async function GET() {
    
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching FAQ from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load FAQ content" },
      { status: 500 }
    );
  }
}