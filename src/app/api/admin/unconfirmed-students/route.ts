import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/src/lib/supabase/server";

// Returns the auth-user ids of everyone whose email is not yet confirmed, so
// the admin students list can show a "Force Verify" action only where it's
// actually needed. Reads from Supabase Auth (service role) since confirmation
// state lives on auth.users, not the profiles table.
//
// Deliberately avoids auth.admin.listUsers(): production has a pre-existing
// auth.users row that was inserted directly via SQL at some point (see the
// warning in scripts/create-admin.js) and doesn't have all the columns
// GoTrue expects. listUsers() 500s ("Database error finding users") on any
// page/perPage window that includes that row, which silently broke this
// endpoint for every student once the table grew past ~16 rows. Instead,
// look up confirmation status per student id (scoped to role=student
// profiles, which the bad row isn't part of) the same way force-verify
// already does with getUserById — more requests, but immune to the poisoned
// row and only touches students we'd actually show a badge for.
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

  const { data: students } = await serverSupabase
    .from("profiles")
    .select("id")
    .eq("role", "student") as { data: { id: string }[] | null };

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const results = await Promise.all(
    (students || []).map(async (s) => {
      const { data, error } = await supabaseAdmin.auth.admin.getUserById(s.id);
      if (error || !data?.user) return null; // skip rather than fail the whole list
      return data.user.email_confirmed_at ? null : s.id;
    })
  );

  const unconfirmedIds = results.filter((id): id is string => id !== null);

  return NextResponse.json({ unconfirmedIds });
}
