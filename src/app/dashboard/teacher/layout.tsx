import { redirect } from "next/navigation";
import { createClient } from "@/src/lib/supabase/server";
import Sidebar from "@/src/components/dashboard/Sidebar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = (await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()) as { data: { full_name: string; email: string; role: string } | null };

  if (!profile || (profile.role !== "teacher" && profile.role !== "admin")) {
    redirect(`/dashboard/${profile?.role || "student"}`);
  }

  return (
    <div className="flex min-h-screen bg-[#F8F9FB]">
      <Sidebar
        role="teacher"
        userName={profile.full_name}
        userEmail={profile.email}
      />
      <main className="flex-1 p-4 lg:p-8 pt-16 lg:pt-8 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
