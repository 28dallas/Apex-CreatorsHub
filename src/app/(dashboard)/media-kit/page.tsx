import { createClient } from "@/lib/supabase/server";
import MediaKitClient from "./MediaKitClient";

export default async function MediaKitPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: profile }, { data: accounts }, { data: kit }] = await Promise.all([
    supabase.from("users").select("full_name, username, tier").eq("id", user!.id).single(),
    supabase.from("social_accounts").select("platform, username, follower_count").eq("user_id", user!.id),
    supabase.from("media_kits").select("*").eq("user_id", user!.id).single(),
  ]);

  const totalFollowers = accounts?.reduce((s, a) => s + (a.follower_count ?? 0), 0) ?? 0;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold">Media Kit</h1>
        <p className="text-xs text-slate-500 mt-0.5">One-click kit to share with brands</p>
      </div>
      <MediaKitClient
        user={{ id: user!.id, ...profile }}
        accounts={accounts ?? []}
        totalFollowers={totalFollowers}
        existingKit={kit}
        tier={profile?.tier ?? "starter"}
      />
    </div>
  );
}
