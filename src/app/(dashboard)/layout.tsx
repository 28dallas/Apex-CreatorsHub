import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import MobileNav from "@/components/dashboard/MobileNav";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, avatar_url, tier")
    .eq("id", user.id)
    .single();

  return (
    <div
      className="min-h-screen flex text-white"
      style={{
        background:
          "radial-gradient(circle at top right, rgba(var(--country-secondary-rgb),0.08), transparent 24%), radial-gradient(circle at bottom left, rgba(var(--country-primary-rgb),0.08), transparent 20%), linear-gradient(180deg, rgba(2,6,23,0.96), rgba(2,6,23,0.98))",
      }}
    >
      {/* Desktop sidebar */}
      <Sidebar user={{ email: user.email!, ...profile }} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top nav */}
        <MobileNav user={{ email: user.email!, ...profile }} />

        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
