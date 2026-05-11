import { createClient } from "@/src/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Stream a course material with a forced download header. Restricted to
 * authenticated teachers and admins so cross-origin Supabase storage URLs
 * become a real download instead of an inline preview.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = (await createClient()) as any;
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["teacher", "admin"].includes(profile.role)) {
      return NextResponse.json(
        { error: "Teacher or admin role required" },
        { status: 403 }
      );
    }

    const url = req.nextUrl.searchParams.get("url");
    const name = req.nextUrl.searchParams.get("name") || "material";

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    let target: URL;
    try {
      target = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }
    if (target.protocol !== "https:" && target.protocol !== "http:") {
      return NextResponse.json({ error: "Unsupported url" }, { status: 400 });
    }

    const upstream = await fetch(target.toString());
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json(
        { error: `Upstream fetch failed (${upstream.status})` },
        { status: 502 }
      );
    }

    const safeName = name.replace(/[\r\n"]/g, "").slice(0, 200) || "material";
    const contentType =
      upstream.headers.get("content-type") || "application/octet-stream";

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    console.error("Material download error:", err);
    return NextResponse.json(
      { error: err.message || "Download failed" },
      { status: 500 }
    );
  }
}
