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

  // Check whether an account with this email already exists. If it does and
  // is still unconfirmed (OTP expired, email never arrived, tab closed,
  // etc.), treat "register again" as a resend: reissue a fresh OTP against
  // that same existing user instead of failing with "email already exists"
  // and leaving the account permanently stuck. Confirmed accounts are left
  // untouched and still get the existing-account error.
  let userId: string;
  let isNewUser = false;

  const { data: existingProfile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("email", email)
    .maybeSingle();

  if (existingProfile) {
    const { data: existingAuthUser, error: getUserError } =
      await supabaseAdmin.auth.admin.getUserById(existingProfile.id);

    if (getUserError || !existingAuthUser?.user) {
      return NextResponse.json({ error: "Failed to look up account" }, { status: 500 });
    }

    if (existingAuthUser.user.email_confirmed_at) {
      return NextResponse.json(
        { error: "An account with this email already exists. Please log in instead." },
        { status: 409 }
      );
    }

    userId = existingAuthUser.user.id;
  } else {
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

    isNewUser = true;
    userId = created.user.id;

    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      full_name: fullName,
      email,
      phone,
      country_code: countryCode,
      role: "student",
    });
  }

  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const { error: tokenError } = await supabaseAdmin.from("email_verifications").insert({
    user_id: userId,
    email,
    token: otp,
    expires_at: expiresAt.toISOString(),
  });

  if (tokenError) {
    // Only delete the user if we just created it in this request. A
    // pre-existing unconfirmed account being resent an OTP must not be
    // deleted here — that would defeat the whole point of the resend.
    if (isNewUser) await supabaseAdmin.auth.admin.deleteUser(userId);
    return NextResponse.json(
      { error: "Failed to generate verification code" },
      { status: 500 }
    );
  }

  try {
    await sendOtpEmailServer({ email, passcode: otp, expiresAt });
  } catch (err) {
    console.error("Failed to send OTP email:", err);
    // Roll back the token so the client can safely retry. Only delete the
    // user itself if we just created it in this request.
    await supabaseAdmin
      .from("email_verifications")
      .delete()
      .eq("user_id", userId);
    if (isNewUser) await supabaseAdmin.auth.admin.deleteUser(userId);
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
