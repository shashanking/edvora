import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: NextRequest) {
  let body: { email?: string; otp?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const otp = body.otp?.trim();
  const password = body.password;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }
  if (!otp || !/^\d{6}$/.test(otp)) {
    return NextResponse.json({ error: "Enter the 6-digit code" }, { status: 400 });
  }
  if (!password || password.length < 6) {
    return NextResponse.json(
      { error: "Password must be at least 6 characters" },
      { status: 400 }
    );
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Look up the most recent matching, unused, unexpired code for this email.
  const { data: record, error: lookupError } = await supabaseAdmin
    .from("email_verifications")
    .select("id, user_id, expires_at, used_at")
    .eq("email", email)
    .eq("token", otp)
    .is("used_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: "Failed to look up code" }, { status: 500 });
  }
  if (!record) {
    return NextResponse.json(
      { error: "Invalid or already-used code" },
      { status: 400 }
    );
  }
  if (new Date(record.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "This code has expired" }, { status: 400 });
  }
  if (!record.user_id) {
    return NextResponse.json({ error: "Account not found" }, { status: 400 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
    record.user_id,
    { email_confirm: true, password }
  );

  if (updateError) {
    return NextResponse.json(
      { error: updateError.message || "Failed to confirm account" },
      { status: 500 }
    );
  }

  await supabaseAdmin
    .from("email_verifications")
    .update({ used_at: new Date().toISOString() })
    .eq("id", record.id);

  return NextResponse.json({ success: true, email });
}
