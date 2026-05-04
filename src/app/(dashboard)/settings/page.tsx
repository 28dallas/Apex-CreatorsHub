import { createClient } from "@/lib/supabase/server";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [
    { data: profile },
    { data: accounts },
    { data: voiceProfile },
    { count: postCount },
  ] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, username, tier, tier_expires_at, language, niche_tags")
      .eq("id", user!.id)
      .single(),
    supabase
      .from("social_accounts")
      .select("id, platform, username, follower_count, account_age_days")
      .eq("user_id", user!.id),
    supabase
      .from("creator_voice")
      .select("analyzed_at, tone")
      .eq("user_id", user!.id)
      .single(),
    supabase
      .from("post_analytics")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user!.id),
  ]);

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div>
        <h1 className="text-xl font-bold">Settings</h1>
        <p className="text-xs text-slate-500 mt-0.5">Manage your profile and preferences</p>
      </div>

      <SettingsForm
        user={{ id: user!.id, email: user!.email!, ...profile }}
        accounts={accounts ?? []}
        voiceProfile={voiceProfile ?? null}
        postCount={postCount ?? 0}
      />
    </div>
  );
}
