import { createClient } from "@/lib/supabase/server";
import { Flame, Copy } from "lucide-react";
import HookLibraryClient from "./HookLibraryClient";

export default async function HookLibraryPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("users")
    .select("tier")
    .eq("id", user!.id)
    .single();

  const { data: hooks } = await supabase
    .from("hook_library")
    .select("*")
    .order("saves", { ascending: false });

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20 md:pb-0">
      <div className="flex items-center gap-3">
        <Flame className="w-6 h-6 text-orange-400" />
        <div>
          <h1 className="text-xl font-bold">Hook Library</h1>
          <p className="text-xs text-slate-500">Proven first-line hooks — the first 2 seconds decide everything</p>
        </div>
      </div>

      <HookLibraryClient hooks={hooks ?? []} tier={profile?.tier ?? "starter"} />
    </div>
  );
}
