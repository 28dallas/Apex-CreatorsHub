import { createClient } from "@/lib/supabase/server";
import CompetitorClient from "./CompetitorClient";

type Competitor = {
  id: string;
  platform: string;
  handle: string;
  display_name: string | null;
  follower_count: number;
  last_checked_at: string | null;
  snapshots: Array<{ date: string; followers: number }>;
};

export default async function CompetitorsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await (supabase.from("users") as any).select("tier").eq("id", user!.id).single() as { data: { tier: string } | null };
  const { data: competitors } = await (supabase.from("competitor_tracks") as any)
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false }) as { data: unknown[] | null };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold">Competitor Tracker</h1>
        <p className="text-xs text-slate-500 mt-0.5">Monitor competitor growth and top posts</p>
      </div>
      <CompetitorClient competitors={competitors as Competitor[] ?? []} tier={profile?.tier ?? "starter"} userId={user!.id} />
</xai:function_call >

<xai:function_call name="execute_command">
<parameter name="command">git add src/app/(dashboard)/competitors/page.tsx
    </div>
  );
}
