import { NextResponse } from "next/server";
import { sanityClient } from "@/src/lib/sanityClient";

export const revalidate = 300;

const query = `*[_type == "footer"][0]{
  _id,
  description,
  refundPolicy,
  privacyPolicy,
  tremsAndConditions,
  forumTerms,
  phone,
  email,
  address,
  instalink,
  facebooklink,
  xlink,
  linkedinlink
}`;

export async function GET() {
  try {
    const data = await sanityClient.fetch(query);
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching footer from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load footer content" },
      { status: 500 }
    );
  }
}