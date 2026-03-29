import { NextResponse } from "next/server";
import { createClient } from "@/src/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Get user role to redirect to correct dashboard
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", user.id)
          .single() as { data: { role: string } | null };

        // If profile doesn't exist (trigger may have failed), create it
        if (!profile) {
          const supabaseAdmin = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
          );

          const meta = user.user_metadata || {};
          await supabaseAdmin.from("profiles").upsert({
            id: user.id,
            full_name: meta.full_name || "",
            email: user.email!,
            phone: meta.phone || null,
            country_code: meta.country_code || null,
            role: meta.role || "student",
          });
        }

        const role = profile?.role || user.user_metadata?.role || "student";
        const forwardedHost = request.headers.get("x-forwarded-host");
        const isLocalEnv = process.env.NODE_ENV === "development";

        if (isLocalEnv) {
          return NextResponse.redirect(`${origin}/dashboard/${role}`);
        } else if (forwardedHost) {
          return NextResponse.redirect(
            `https://${forwardedHost}/dashboard/${role}`
          );
        } else {
          return NextResponse.redirect(`${origin}/dashboard/${role}`);
        }
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
