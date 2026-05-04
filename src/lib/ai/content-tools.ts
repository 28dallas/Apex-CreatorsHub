"use server";

import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";

async function getOpenAI() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function getTrendContext(region: string, platform = "tiktok") {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trend_cache")
    .select("data")
    .eq("region", region)
    .eq("platform", platform)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();
  return data?.data
    ? (data.data as Array<{ hashtag?: string }>)
        .slice(0, 5)
        .map((t) => t.hashtag)
        .filter(Boolean)
        .join(", ")
    : "No trend data";
}

// ─── Caption Generator ────────────────────────────────────────────────────────

const CaptionSchema = z.object({
  niche: z.string(),
  region: z.enum(["KE", "NG", "ZA", "US", "GB"]),
  trend: z.string(),
  platform: z.enum(["tiktok", "instagram", "twitter", "youtube"]),
  tone: z.enum(["funny", "inspirational", "educational", "relatable"]).default("relatable"),
});

export type CaptionInput = z.infer<typeof CaptionSchema>;

export interface CaptionOutput {
  hook: string;
  caption: string;
  hashtags: string[];
  cta: string;
  error?: string;
}

export async function generateCaption(input: CaptionInput): Promise<CaptionOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("users").select("tier").eq("id", user.id).single();
  if (profile?.tier === "starter") {
    return { hook: "", caption: "", hashtags: [], cta: "", error: "Caption generator requires Growth Hacker plan." };
  }

  const parsed = CaptionSchema.parse(input);
  const trendContext = await getTrendContext(parsed.region, parsed.platform);

  const prompt = `You are a viral social media copywriter for African content creators.

Write a ${parsed.platform} caption for a ${parsed.niche} creator in ${parsed.region}.
Trend/topic to use: "${parsed.trend}"
Tone: ${parsed.tone}
Trending context: ${trendContext}

Respond ONLY with valid JSON:
{
  "hook": "The first 1-2 lines (the hook that stops the scroll — max 15 words)",
  "caption": "The full caption body (2-4 sentences, conversational, region-aware slang if appropriate)",
  "hashtags": ["10 relevant hashtags without # prefix"],
  "cta": "One call-to-action line (comment, share, follow, etc.)"
}`;

  try {
    const openai = await getOpenAI();
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.8,
    });
    const r = JSON.parse(res.choices[0].message.content ?? "{}");
    return { hook: r.hook ?? "", caption: r.caption ?? "", hashtags: r.hashtags ?? [], cta: r.cta ?? "" };
  } catch {
    return { hook: "", caption: "", hashtags: [], cta: "", error: "AI unavailable. Try again." };
  }
}

// ─── Script Writer ────────────────────────────────────────────────────────────

const ScriptSchema = z.object({
  niche: z.string(),
  region: z.enum(["KE", "NG", "ZA", "US", "GB"]),
  topic: z.string(),
  duration: z.enum(["15s", "30s", "60s"]).default("30s"),
});

export type ScriptInput = z.infer<typeof ScriptSchema>;

export interface ScriptOutput {
  title: string;
  hook_line: string;
  script: string;
  b_roll_notes: string;
  error?: string;
}

export async function generateScript(input: ScriptInput): Promise<ScriptOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("users").select("tier").eq("id", user.id).single();
  if (profile?.tier === "starter") {
    return { title: "", hook_line: "", script: "", b_roll_notes: "", error: "Script writer requires Growth Hacker plan." };
  }

  const parsed = ScriptSchema.parse(input);
  const wordCount = parsed.duration === "15s" ? 40 : parsed.duration === "30s" ? 80 : 160;

  const prompt = `You are a TikTok/Reels script writer for African content creators.

Write a ${parsed.duration} talking-head video script for a ${parsed.niche} creator in ${parsed.region}.
Topic: "${parsed.topic}"
Target word count: ~${wordCount} words (spoken at normal pace)

Respond ONLY with valid JSON:
{
  "title": "Video title/concept (max 10 words)",
  "hook_line": "The very first sentence spoken on camera (must create curiosity or shock)",
  "script": "The full spoken script with natural pauses marked as [pause]. Write exactly as the creator should say it.",
  "b_roll_notes": "2-3 brief notes on what to show on screen while talking"
}`;

  try {
    const openai = await getOpenAI();
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 800,
      temperature: 0.75,
    });
    const r = JSON.parse(res.choices[0].message.content ?? "{}");
    return { title: r.title ?? "", hook_line: r.hook_line ?? "", script: r.script ?? "", b_roll_notes: r.b_roll_notes ?? "" };
  } catch {
    return { title: "", hook_line: "", script: "", b_roll_notes: "", error: "AI unavailable. Try again." };
  }
}

// ─── Comment Reply Suggestions ────────────────────────────────────────────────

export interface CommentReplyOutput {
  replies: string[];
  error?: string;
}

export async function getCommentReplies(comment: string, niche: string): Promise<CommentReplyOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const prompt = `You are a social media engagement expert for ${niche} content creators.

A viewer left this comment: "${comment}"

Generate 3 reply options that:
1. Drive further engagement (ask a question, spark debate, or invite sharing)
2. Feel authentic, not corporate
3. Are short (max 20 words each)

Respond ONLY with valid JSON: { "replies": ["reply1", "reply2", "reply3"] }`;

  try {
    const openai = await getOpenAI();
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 200,
      temperature: 0.9,
    });
    const r = JSON.parse(res.choices[0].message.content ?? "{}");
    return { replies: r.replies ?? [] };
  } catch {
    return { replies: [], error: "AI unavailable. Try again." };
  }
}

// ─── Content Calendar Generator ───────────────────────────────────────────────

const CalendarSchema = z.object({
  niche: z.string(),
  region: z.enum(["KE", "NG", "ZA", "US", "GB"]),
  platform: z.enum(["tiktok", "instagram", "twitter", "youtube"]),
  week_start: z.string(), // ISO date string
});

export type CalendarInput = z.infer<typeof CalendarSchema>;

export interface CalendarDay {
  date: string;
  day_label: string;
  topic: string;
  hook: string;
  caption: string;
  hashtags: string[];
  best_time: string;
  trend_used: string | null;
}

export interface CalendarOutput {
  days: CalendarDay[];
  error?: string;
}

export async function generateWeeklyCalendar(input: CalendarInput): Promise<CalendarOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase.from("users").select("tier").eq("id", user.id).single();
  if (profile?.tier === "starter") {
    return { days: [], error: "Content calendar requires Growth Hacker plan." };
  }

  const parsed = CalendarSchema.parse(input);
  const trendContext = await getTrendContext(parsed.region, parsed.platform);

  // Build 7 dates from week_start
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(parsed.week_start);
    d.setDate(d.getDate() + i);
    return d.toISOString().split("T")[0];
  });

  const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const prompt = `You are a content strategist for African social media creators.

Create a 7-day ${parsed.platform} content calendar for a ${parsed.niche} creator in ${parsed.region}.
Dates: ${dates.join(", ")}
Trending topics available: ${trendContext}

Rules:
- Vary content types (educational, entertaining, personal, trending)
- Use region-specific references where natural
- Best times should reflect African timezone patterns (EAT = UTC+3)
- Incorporate trending topics on 2-3 days

Respond ONLY with valid JSON:
{
  "days": [
    {
      "date": "YYYY-MM-DD",
      "day_label": "Monday",
      "topic": "What the video is about (1 sentence)",
      "hook": "Opening line (max 12 words)",
      "caption": "Full caption (2-3 sentences)",
      "hashtags": ["5 hashtags no # prefix"],
      "best_time": "e.g. 7:00 PM EAT",
      "trend_used": "hashtag name or null"
    }
  ]
}`;

  try {
    const openai = await getOpenAI();
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 2000,
      temperature: 0.75,
    });
    const r = JSON.parse(res.choices[0].message.content ?? "{}");
    const days: CalendarDay[] = r.days ?? [];

    // Persist to DB
    if (days.length > 0) {
      const { createServiceClient } = await import("@/lib/supabase/server");
      const svc = createServiceClient();
      await svc.from("content_calendar").upsert(
        days.map((d) => ({
          user_id: user.id,
          scheduled_date: d.date,
          platform: parsed.platform,
          niche: parsed.niche,
          region: parsed.region,
          caption: `${d.hook}\n\n${d.caption}`,
          hook: d.hook,
          hashtags: d.hashtags,
          trend_used: d.trend_used,
          status: "planned" as const,
        })),
        { onConflict: "user_id,scheduled_date,platform" }
      );
    }

    return { days };
  } catch {
    return { days: [], error: "AI unavailable. Try again." };
  }
}

// ─── Growth Velocity Score ────────────────────────────────────────────────────

export interface GrowthVelocityOutput {
  score: number;        // 0-100
  label: string;        // "Stalled" | "Slow" | "Steady" | "Growing" | "Viral"
  week_over_week: number; // % change
  insight: string;
  error?: string;
}

export async function getGrowthVelocity(): Promise<GrowthVelocityOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: accounts } = await supabase
    .from("social_accounts")
    .select("follower_count, account_age_days, platform")
    .eq("user_id", user.id);

  if (!accounts || accounts.length === 0) {
    return { score: 0, label: "No data", week_over_week: 0, insight: "Connect a social account to track growth velocity." };
  }

  const { data: recentAnalytics } = await supabase
    .from("post_analytics")
    .select("engagement_rate, posted_at, views, likes")
    .eq("user_id", user.id)
    .gte("posted_at", new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())
    .order("posted_at", { ascending: false });

  const thisWeek = recentAnalytics?.filter(
    (p) => new Date(p.posted_at) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ) ?? [];
  const lastWeek = recentAnalytics?.filter(
    (p) => new Date(p.posted_at) < new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  ) ?? [];

  const avgEngThis = thisWeek.length
    ? thisWeek.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / thisWeek.length
    : 0;
  const avgEngLast = lastWeek.length
    ? lastWeek.reduce((s, p) => s + (p.engagement_rate ?? 0), 0) / lastWeek.length
    : 0;

  const wow = avgEngLast > 0 ? ((avgEngThis - avgEngLast) / avgEngLast) * 100 : 0;

  // Score: 0-100 based on engagement trend + posting frequency
  const freqScore = Math.min(thisWeek.length / 7, 1) * 40; // up to 40pts for daily posting
  const engScore = Math.min(avgEngThis * 10, 40);           // up to 40pts for engagement
  const trendScore = Math.min(Math.max(wow / 2, -20), 20);  // ±20pts for trend direction
  const score = Math.round(Math.max(0, Math.min(100, freqScore + engScore + trendScore)));

  const label =
    score >= 80 ? "Viral 🔥" :
    score >= 60 ? "Growing 📈" :
    score >= 40 ? "Steady ✅" :
    score >= 20 ? "Slow 🐢" : "Stalled ⚠️";

  const insight =
    score >= 60
      ? `Strong momentum — your engagement is ${wow >= 0 ? "up" : "down"} ${Math.abs(wow).toFixed(0)}% vs last week.`
      : thisWeek.length < 3
      ? "Post more consistently — aim for at least 1 post per day to build momentum."
      : `Engagement is ${wow < 0 ? "dropping" : "flat"} — try a different content format this week.`;

  return { score, label, week_over_week: parseFloat(wow.toFixed(1)), insight };
}
