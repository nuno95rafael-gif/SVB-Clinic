import { requireUser } from "@/lib/auth";
import { getActiveClinicId } from "@/lib/clinic";
import { createClient } from "@/lib/supabase/server";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  const supabase = await createClient();

  const [{ data: clinics }, activeClinicId] = await Promise.all([
    supabase.from("clinics").select("id, name").eq("active", true).order("name"),
    getActiveClinicId(),
  ]);

  return (
    <div className="flex min-h-screen">
      <Sidebar profile={profile} clinics={clinics ?? []} activeClinicId={activeClinicId} />
      <main className="flex-1 overflow-y-auto bg-background">{children}</main>
    </div>
  );
}
