"use server";

import { createClient, createServiceClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import { z } from "zod";
import type { Language } from "@/lib/supabase/types";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const VOICE_MIN_CAPTIONS = 10; // minimum before attempting voice extraction
const VOICE_REANALYZE_EVERY = 30; // re-analyze after every N new posts

const LANGUAGE_NAMES: Record<Language, string> = {
  en: "English", sw: "Swahili", fr: "French", pt: "Portuguese (Brazilian)",
  ar: "Arabic", hi: "Hindi", es: "Spanish", de: "German", yo: "Yoruba", ig: "Igbo",
};

// Regions with full trend pipeline (real scraped data)
const FULL_COVERAGE_REGIONS = new Set(["KE", "NG", "ZA", "GH", "TZ", "UG"]);
// Regions with partial coverage (Google Trends only, no TikTok CC scrape)
const BETA_REGIONS = new Set(["IN", "BR", "DE", "FR", "EG", "US", "GB"]);

const REGION_CONTEXT: Record<string, string> = {
  KE: "Kenya (Nairobi, Mombasa). Currency: KES. Culture: Kenyan slang (sawa, poa, si mbaya), M-Pesa, matatu culture, Gikomba market, ugali, nyama choma. Peak hours: EAT (UTC+3).",
  NG: "Nigeria (Lagos, Abuja, Port Harcourt). Currency: NGN. Culture: Naija slang (e go be, wahala, omo), Afrobeats, Nollywood, jollof rice wars, Lagos traffic. Peak hours: WAT (UTC+1).",
  ZA: "South Africa (Johannesburg, Cape Town, Durban). Currency: ZAR. Culture: Mzansi slang, braai culture, load shedding references, township vibes. Peak hours: SAST (UTC+2).",
  GH: "Ghana (Accra, Kumasi). Currency: GHS. Culture: Ghanaian slang (ei, charle), highlife music, jollof rice, Accra nightlife. Peak hours: GMT (UTC+0).",
  TZ: "Tanzania (Dar es Salaam, Zanzibar). Currency: TZS. Culture: Swahili culture, Zanzibar tourism, bongo flava music. Peak hours: EAT (UTC+3).",
  UG: "Uganda (Kampala). Currency: UGX. Culture: Ugandan culture, rolex (chapati), boda bodas. Peak hours: EAT (UTC+3).",
  EG: "Egypt (Cairo, Alexandria). Currency: EGP. Culture: Egyptian Arabic, Cairo culture. Peak hours: EET (UTC+2).",
  US: "United States. Currency: USD. Culture: American internet culture, trending sounds, pop culture. Peak hours: EST/PST.",
  GB: "United Kingdom. Currency: GBP. Culture: British humour, London culture, UK slang. Peak hours: GMT/BST.",
  IN: "India. Currency: INR. Culture: Bollywood, cricket, regional diversity. Peak hours: IST (UTC+5:30).",
  BR: "Brazil. Currency: BRL. Culture: Brazilian Portuguese, funk, samba, football. Peak hours: BRT (UTC-3).",
  DE: "Germany. Currency: EUR. Culture: German precision, Bundesliga, Berlin culture. Peak hours: CET (UTC+1).",
  FR: "France. Currency: EUR. Culture: French culture, Paris, fashion, cuisine. Peak hours: CET (UTC+1).",
};

const NICHE_SIGNALS: Record<string, string> = {
  Fitness: "Transformation content, workout challenges, nutrition tips, before/after. Best formats: short workout demos, POV training sessions.",
  Food: "Recipe reveals, taste tests, street food tours, cooking hacks. Best formats: cooking process videos, food ASMR.",
  Comedy: "Relatable situations, POV skits, reaction content, trending audio remixes. Best formats: short skits under 30s, duets.",
  Fashion: "Outfit reveals, styling tips, thrift hauls, GRWM. Best formats: outfit transitions, try-on hauls.",
  Tech: "App reviews, productivity hacks, gadget unboxings, tutorials. Best formats: screen recordings, talking-head explainers.",
  Business: "Income reveals, business tips, entrepreneurship journeys. Best formats: talking-head advice, day-in-the-life.",
  Education: "Quick facts, myth-busting, explainers, study tips. Best formats: text-overlay videos, whiteboard-style.",
  Music: "Song covers, beat reveals, music reactions, studio BTS. Best formats: performance clips, duets.",
  Lifestyle: "Day-in-the-life, morning routines, travel vlogs, home tours. Best formats: vlog-style, aesthetic montages.",
  Gaming: "Gameplay highlights, reviews, tips, reactions. Best formats: screen capture clips, reaction cams.",
  Travel: "Destination reveals, travel hacks, hidden spots, budget travel. Best formats: cinematic clips, POV travel.",
  Beauty: "Makeup tutorials, skincare routines, product reviews, transformations. Best formats: GRWM, before/after.",
  Finance: "Money tips, budgeting hacks, investment basics, income reveals. Best formats: talking-head, text-overlay.",
  Parenting: "Parenting hacks, day-in-the-life with kids, relatable moments. Best formats: vlog-style, POV.",
  Sports: "Highlights, training tips, match reactions, athlete lifestyle. Best formats: clips, talking-head analysis.",
};

// ─── Platform-specific prompt instructions ───────────────────────────────────
const PLATFORM_INSTRUCTIONS: Record<string, string> = {
  tiktok: `Platform: TikTok
- Hook must land in the first 2 seconds — open with a visual action or bold statement
- Recommend a specific trending sound by name if available
- Optimal video length: 15–34 seconds for maximum completion rate
- Hashtag strategy: 3–5 niche tags + 2–3 trending tags + 1–2 broad tags`,

  instagram: `Platform: Instagram Reels/Feed
- Hook in caption first line — Instagram shows 2 lines before "more"
- Recommend posting to both Reels and Feed for maximum reach
- Stories cross-promotion: post a story teaser 2 hours before the main post
- Hashtag strategy: 5–10 highly relevant tags (avoid banned hashtags)
- Best engagement window: 24–48 hours after posting`,

  twitter: `Platform: Twitter/X
- Text-first platform — the hook IS the post, not a caption for a video
- If posting video: keep under 2:20, add captions (80% watch muted)
- Thread strategy: if educational, break into 5–7 tweet thread for maximum reach
- Timing: post around breaking news or trending conversations in their niche
- No hashtag spam — max 2 relevant hashtags
- Reply to comments within the first hour to boost algorithmic reach`,

  youtube: `Platform: YouTube Shorts / Long-form
- Title optimization is critical — include the main keyword in first 3 words
- Thumbnail hook: face + emotion + text overlay (A/B test two thumbnails)
- For Shorts: hook in first 3 seconds, loop-friendly ending
- For long-form: chapters in description, pinned comment with timestamps
- Description: first 2 lines must contain primary keyword for SEO
- Hashtag strategy: 3 hashtags max in description (#Shorts if applicable)`,

  linkedin: `Platform: LinkedIn
- Post on Tuesday–Thursday, 7–9 AM or 12–1 PM in creator's local timezone
- Text-first: start with a bold single-line hook, then line break
- No hashtag spam — max 3–5 professional hashtags
- Personal story + professional insight performs 3× better than pure advice
- End with a direct question to drive comments (LinkedIn algorithm rewards comments heavily)
- Avoid external links in the post body — put them in first comment instead
- Video performs well but native document/carousel posts get highest organic reach`,
};

async function getCreatorVoice(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("creator_voice")
    .select("writing_style, common_phrases, tone, sample_captions")
    .eq("user_id", userId)
    .single();
  return data;
}

async function getTrendContext(region: string, platform: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("trend_cache")
    .select("data")
    .eq("region", region)
    .eq("platform", platform)
    .gt("expires_at", new Date().toISOString())
    .order("fetched_at", { ascending: false })
    .limit(1)
    .single();

  if (!data?.data) return null;
  return (data.data as Array<{ hashtag?: string; title?: string }>)
    .slice(0, 8)
    .map((t) => t.hashtag ?? t.title)
    .filter(Boolean)
    .join(", ");
}

// ─── Data-backed engagement prediction ───────────────────────────────────────
// Uses own plan_results history once 30+ results exist.
// Falls back to AI estimate with honest labeling below that threshold.
async function getEngagementPrediction(
  userId: string,
  platform: string,
  peakHours: string
): Promise<{ range: string; data_backed: boolean }> {
  const supabase = await createClient();

  const { data: results, count } = await supabase
    .from("plan_results")
    .select("actual_engagement, recommended_time, followed_plan", { count: "exact" })
    .eq("user_id", userId)
    .eq("platform", platform)
    .not("actual_engagement", "is", null)
    .limit(50);

  const n = count ?? 0;

  if (n >= 30 && results && results.length >= 10) {
    // Use own data — calculate mean and std dev of actual engagement
    const values = results
      .filter((r) => r.actual_engagement !== null)
      .map((r) => r.actual_engagement as number);

    const mean = values.reduce((s, v) => s + v, 0) / values.length;
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / values.length;
    const std = Math.sqrt(variance);

    const low = Math.max(0, mean - std).toFixed(1);
    const high = (mean + std).toFixed(1);

    return {
      range: `${low}%–${high}% (based on your last ${values.length} posts on ${platform})`,
      data_backed: true,
    };
  }

  // Not enough data yet — return null so AI generates an estimate with honest label
  return {
    range: `Baseline estimate — ${30 - n} more logged results needed for your personal prediction`,
    data_backed: false,
  };
}

// ─── Input schema ─────────────────────────────────────────────────────────────
const InputSchema = z.object({
  niche: z.string().min(2).max(100),
  region: z.string(),
  language: z.string().default("en"),
  engagement_rate: z.number().min(0).max(100),
  peak_active_hours: z.string(),
  top_performing_format: z.string(),
  follower_count: z.number().min(0),
  last_7_day_growth: z.number(),
  platform: z.string().default("tiktok"),
});

export type AIInput = z.infer<typeof InputSchema>;

export interface AIOutput {
  daily_action: string;
  hashtags: string[];
  growth_warning: string | null;
  confidence_score: number;
  predicted_engagement_range: string | null;
  engagement_data_backed: boolean;
  voice_note: string | null;
  trend_coverage: "full" | "beta" | "none";
  error?: string;
}

export async function getAIGrowthPlan(input: AIInput): Promise<AIOutput> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("users")
    .select("tier, language")
    .eq("id", user.id)
    .single();

  if (profile?.tier === "starter") {
    return {
      daily_action: "", hashtags: [], growth_warning: null, confidence_score: 0,
      predicted_engagement_range: null, engagement_data_backed: false,
      voice_note: null, trend_coverage: "none",
      error: "AI Assistant requires Growth Hacker plan or above.",
    };
  }

  const parsed = InputSchema.parse(input);
  const lang = (profile?.language ?? parsed.language ?? "en") as Language;
  const langName = LANGUAGE_NAMES[lang] ?? "English";
  const regionCtx = REGION_CONTEXT[parsed.region] ?? parsed.region;
  const nicheSignals = NICHE_SIGNALS[parsed.niche] ?? "";
  const platformInstructions = PLATFORM_INSTRUCTIONS[parsed.platform] ?? PLATFORM_INSTRUCTIONS.tiktok;

  // Determine trend coverage honestly
  const trendCoverage: AIOutput["trend_coverage"] = FULL_COVERAGE_REGIONS.has(parsed.region)
    ? "full"
    : BETA_REGIONS.has(parsed.region)
    ? "beta"
    : "none";

  const trendingToday = await getTrendContext(parsed.region, parsed.platform);
  const trendSection = trendingToday
    ? `Trending Today (${parsed.region}, ${parsed.platform}): ${trendingToday}`
    : trendCoverage === "beta"
    ? `Trend data for ${parsed.region} is in beta — limited coverage. Use general ${parsed.niche} trends.`
    : `No trend data available for ${parsed.region}.`;

  const voice = await getCreatorVoice(user.id);
  const voiceSection = voice
    ? `Creator's Writing Voice — inject this into daily_action:
- Style: ${voice.writing_style}
- Tone: ${voice.tone}
- Phrases they use: ${voice.common_phrases.slice(0, 5).join(", ")}
- Sample captions: ${voice.sample_captions.slice(0, 2).join(" | ")}`
    : "No voice profile yet — use natural, conversational tone.";

  const { range: engRange, data_backed } = await getEngagementPrediction(
    user.id, parsed.platform, parsed.peak_active_hours
  );

  const prompt = `You are a world-class social media growth strategist specializing in ${parsed.region} creator culture.

RESPOND ENTIRELY IN ${langName}. Every field in your JSON must be in ${langName}.

${platformInstructions}

Creator Profile:
- Niche: ${parsed.niche}
- Region: ${regionCtx}
- Follower Count: ${parsed.follower_count.toLocaleString()}
- Engagement Rate: ${parsed.engagement_rate}% (benchmark for this size: ${parsed.follower_count < 10000 ? "3–6%" : parsed.follower_count < 100000 ? "2–4%" : "1–3%"})
- Peak Active Hours: ${parsed.peak_active_hours}
- Top Performing Format: ${parsed.top_performing_format}
- Last 7-Day Growth: ${parsed.last_7_day_growth > 0 ? "+" : ""}${parsed.last_7_day_growth} followers
- ${trendSection}

Niche Intelligence:
${nicheSignals}

${voiceSection}

${data_backed ? `Engagement prediction is data-backed: ${engRange}. Reference this in predicted_engagement_range.` : "Engagement prediction: insufficient personal data yet. Set predicted_engagement_range to null."}

Respond ONLY with valid JSON:
{
  "daily_action": "One hyper-specific action for TODAY. Name the exact sound/trend, exact time in local timezone, exact opening hook. 2–3 sentences. Sound like a personal growth manager who knows this creator.",
  "hashtags": ["exactly 10 hashtags, no # prefix"],
  "growth_warning": null or "specific warning if engagement is below benchmark or growth is stalling",
  "confidence_score": 0.0-1.0,
  "predicted_engagement_range": ${data_backed ? `"${engRange}"` : "null"},
  "voice_note": "One sentence on how this plan reflects their specific voice" or null
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 700,
      temperature: 0.7,
    });

    const r = JSON.parse(completion.choices[0].message.content ?? "{}");

    // Log plan non-blocking
    void (async () => {
      try {
        await createServiceClient()
          .from("plan_results")
          .insert({
            user_id: user.id,
            plan_date: new Date().toISOString().split("T")[0],
            recommended_time: parsed.peak_active_hours,
            platform: parsed.platform,
            predicted_engagement: data_backed
              ? parseFloat(engRange.split("%")[0]) || null
              : null,
          });
      } catch {
        // Non-blocking analytics log
      }
    })();

    return {
      daily_action: r.daily_action ?? "",
      hashtags: r.hashtags ?? [],
      growth_warning: r.growth_warning === "null" ? null : r.growth_warning ?? null,
      confidence_score: r.confidence_score ?? 0.5,
      predicted_engagement_range: data_backed ? engRange : null,
      engagement_data_backed: data_backed,
      voice_note: r.voice_note ?? null,
      trend_coverage: trendCoverage,
    };
  } catch (err) {
    console.error("AI error:", err);
    return {
      daily_action: "", hashtags: [], growth_warning: null, confidence_score: 0,
      predicted_engagement_range: null, engagement_data_backed: false,
      voice_note: null, trend_coverage: trendCoverage,
      error: "AI service temporarily unavailable. Please try again.",
    };
  }
}

// ─── Creator Voice Analyzer ───────────────────────────────────────────────────
// Minimum 10 captions required. Pass the most recent 20 (not 50).
// Called: on first account connect, and every VOICE_REANALYZE_EVERY new posts.

export interface VoiceAnalysisResult {
  success: boolean;
  reason?: "too_few_captions" | "ai_error";
  captions_analyzed?: number;
}

export async function analyzeCreatorVoice(
  captions: string[],
  postCount: number // total posts on the account
): Promise<VoiceAnalysisResult> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false };

  // Hard minimum — don't hallucinate a style from nothing
  if (captions.length < VOICE_MIN_CAPTIONS) {
    return { success: false, reason: "too_few_captions", captions_analyzed: captions.length };
  }

  // Check if re-analysis is needed based on post count
  const { data: existing } = await supabase
    .from("creator_voice")
    .select("analyzed_at")
    .eq("user_id", user.id)
    .single();

  if (existing) {
    // Check if enough new posts have been made since last analysis
    const { count: planCount } = await supabase
      .from("post_analytics")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .gt("created_at", existing.analyzed_at);

    if ((planCount ?? 0) < VOICE_REANALYZE_EVERY) {
      return { success: true, captions_analyzed: 0 }; // no re-analysis needed yet
    }
  }

  // Use the most recent 20 captions only — recent voice matters more than old
  const recentCaptions = captions.slice(0, 20);

  const prompt = `Analyze these ${recentCaptions.length} social media captions from a single creator. Extract their writing voice precisely.

Captions (most recent first):
${recentCaptions.map((c, i) => `${i + 1}. "${c}"`).join("\n")}

Respond ONLY with valid JSON:
{
  "writing_style": "2-sentence description of HOW they write — sentence length, punctuation habits, use of line breaks, emoji patterns",
  "common_phrases": ["up to 8 actual phrases or words that appear repeatedly"],
  "avg_caption_length": average word count as integer,
  "tone": "one word: funny | inspirational | educational | relatable | bold | calm | energetic | raw"
}`;

  try {
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_tokens: 400,
      temperature: 0.3,
    });

    const r = JSON.parse(res.choices[0].message.content ?? "{}");
    const svc = createServiceClient();

    await svc.from("creator_voice").upsert({
      user_id: user.id,
      writing_style: r.writing_style ?? "",
      common_phrases: r.common_phrases ?? [],
      avg_caption_length: r.avg_caption_length ?? 0,
      tone: r.tone ?? "relatable",
      sample_captions: recentCaptions.slice(0, 5),
      analyzed_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return { success: true, captions_analyzed: recentCaptions.length };
  } catch {
    return { success: false, reason: "ai_error" };
  }
}

// ─── Log Plan Result (feedback loop) ─────────────────────────────────────────
export async function logPlanResult(data: {
  plan_date: string;
  actual_post_time: string;
  actual_engagement: number;
  platform: string;
}): Promise<void> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await createServiceClient()
    .from("plan_results")
    .update({
      actual_post_time: data.actual_post_time,
      actual_engagement: data.actual_engagement,
      followed_plan: true,
    })
    .eq("user_id", user.id)
    .eq("plan_date", data.plan_date)
    .eq("platform", data.platform);
}
