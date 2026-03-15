import { createClient } from "@/src/lib/supabase/server";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("courses")
      .select("id, title, description, duration, thumbnail_url, rating, audience, landing_category, category, price, currency")
      .eq("status", "published")
      .order("display_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) {
      throw error;
    }

    return NextResponse.json(data ?? null);
  } catch (err) {
    console.error("Error fetching LMS courses", err);
    return NextResponse.json(
      { message: "Failed to load Course content" },
      { status: 500 }
    );
  }
}