import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";

export async function POST(req: NextRequest) {
  // Verify the caller is an admin
  const serverSupabase = await createServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = (await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { full_name, email, password, phone } = await req.json();

  if (!full_name || !email || !password) {
    return NextResponse.json(
      { error: "Full name, email, and password are required" },
      { status: 400 }
    );
  }

  // Use service role client to bypass RLS
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First, try creating the auth user
  const { data: authData, error: authError } =
    await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        role: "teacher",
        phone: phone || undefined,
      },
    });

  if (authError) {
    // If the trigger failed, the auth user creation is rolled back.
    // Try an alternative: create auth user without relying on the trigger,
    // then manually insert the profile.
    console.error("Auth createUser failed:", authError.message);

    // Attempt with raw approach: create user, then upsert profile
    const { data: retryData, error: retryError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name, role: "teacher" },
      });

    if (retryError) {
      return NextResponse.json({ error: retryError.message }, { status: 400 });
    }

    // Manually insert the profile since the trigger likely failed
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .upsert({
        id: retryData.user.id,
        full_name,
        email,
        phone: phone || null,
        role: "teacher",
      });

    if (profileError) {
      console.error("Profile upsert failed:", profileError);
      return NextResponse.json(
        { error: "User created but profile setup failed: " + profileError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ user: retryData.user });
  }

  // Ensure profile exists (trigger may or may not have succeeded)
  const { error: profileError } = await supabaseAdmin
    .from("profiles")
    .upsert({
      id: authData.user.id,
      full_name,
      email,
      phone: phone || null,
      role: "teacher",
    });

  if (profileError) {
    console.error("Profile upsert failed:", profileError);
  }

  return NextResponse.json({ user: authData.user });
}
