import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/dashboard");
  }

  const { data: profile } = (await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single()) as {
    data: { role: "student" | "teacher" | "admin" } | null;
  };

  const role = profile?.role || "student";

  if (role === "admin") {
    redirect("/dashboard/admin");
  }

  if (role === "teacher") {
    redirect("/dashboard/teacher");
  }

  redirect("/dashboard/student");
}
