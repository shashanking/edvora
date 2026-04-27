import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";
import { sendOtpEmailServer } from "@/src/lib/emailjs-server";

const OTP_EXPIRY_MINUTES = 15;

function generateOtp(): string {
  // 6-digit numeric code, zero-padded
  const n = crypto.randomInt(0, 1_000_000);
  return n.toString().padStart(6, "0");
}

export async function POST(req: NextRequest) {
  let body: {
    email?: string;
    full_name?: string;
    phone?: string;
    country_code?: string;
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const fullName = body.full_name?.trim() || "";
  const phone = body.phone?.trim() || null;
  const countryCode = body.country_code?.trim() || null;

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create the auth user with a strong random temporary password.
  // The real password is set on the verify-OTP step.
  const tempPassword = crypto.randomBytes(24).toString("hex");

  const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: tempPassword,
    email_confirm: false,
    user_metadata: {
      full_name: fullName,
      phone,
      country_code: countryCode,
      role: "student",
    },
  });

  if (createError || !created.user) {
    return NextResponse.json(
      { error: createError?.message || "Failed to create account" },
      { status: 400 }
    );
  }

  const userId = created.user.id;

  await supabaseAdmin.from("profiles").upsert({
    id: userId,
    full_name: fullName,
    email,
    phone,
    country_code: countryCode,
    role: "student",
  });

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const { error: tokenError } = await supabaseAdmin.from("email_verifications").insert({
    user_id: userId,
    email,
    token: otp,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenError) {
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to generate verification code" },
      { status: 500 }
    );
  }

  try {
    await sendOtpEmailServer({ email, passcode: otp, expiresAt });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // Roll back the user and the token so the client can safely retry.
    await supabaseAdmin
      .from("email_verifications")
      .delete()
      .eq("user_id", userId);
    await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Could not send verification email. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({
    success: true,
    email,
    expiresInMinutes: OTP_EXPIRY_MINUTES,
  });
}
