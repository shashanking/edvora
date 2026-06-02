import { sanityClient } from "@/src/lib/sanityClient";
import { NextResponse } from "next/server";

export const revalidate = 300;

const query = `*[_type == "blog" && slug.current == $slug][0]{
  _id,
  title,
  "slug": slug.current,
  author,
  date,
  excerpt,
  content,
  "imageUrl": image.asset->url
}`;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const data = await sanityClient.fetch(query, { slug });
    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching Blog post from Sanity", err);
    return NextResponse.json(
      { message: "Failed to load Blog post content" },
      { status: 500 }
    );
  }
}
