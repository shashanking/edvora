import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";

// Returns the auth-user ids of everyone whose email is not yet confirmed, so
// the admin students list can show a "Force Verify" action only where it's
// actually needed. Reads from Supabase Auth (service role) since confirmation
// state lives on auth.users, not the profiles table.
export async function GET(_req: NextRequest) {
  const serverSupabase = await createServerClient();
  const { data: { user } } = await serverSupabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: profile } = await serverSupabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single() as { data: { role: string } | null };

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const unconfirmedIds: string[] = [];
  const perPage = 1000;

  for (let page = 1; page <= 10; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    for (const u of data.users) {
      if (!u.email_confirmed_at) unconfirmedIds.push(u.id);
    }

    if (data.users.length < perPage) break;
  }

  return NextResponse.json({ unconfirmedIds });
}
