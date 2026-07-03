import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const InputSchema = z.object({
  kind: z.enum(["hook", "hashtag", "caption", "bio"]),
  platform: z.enum(["instagram", "tiktok", "linkedin", "twitter", "youtube"]),
  tone: z.string().min(1).max(40),
  topic: z.string().min(1).max(1000),
  useEmoji: z.boolean().optional().default(true),
  language: z.enum(["english", "hindi", "gujarati"]).optional().default("english"),
});

export type GenerateInput = z.infer<typeof InputSchema>;

export type GenerateItem = {
  text: string;
  hashtags: string[];
  viralScore: number;
  viralReason?: string;
};

export type GenerateResult = {
  items: GenerateItem[];
};

function extractJSON(raw: string): unknown {
  let s = raw.trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  if (!s.startsWith("{") && !s.startsWith("[")) {
    const o = s.indexOf("{");
    const a = s.indexOf("[");
    const isArr = a !== -1 && (o === -1 || a < o);
    const start = isArr ? a : o;
    const end = isArr ? s.lastIndexOf("]") : s.lastIndexOf("}");
    if (start === -1 || end <= start) throw new Error("No JSON in response");
    s = s.slice(start, end + 1);
  }
  return JSON.parse(s);
}


export const generateContent = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => InputSchema.parse(data))
  .handler(async ({ data }): Promise<GenerateResult> => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY missing");

    const gateway = createLovableAiGatewayProvider(apiKey);

    const platformGuide: Record<string, string> = {
      instagram: "Instagram — visual, story-driven, aesthetic.",
      tiktok: "TikTok — short, punchy, Gen-Z, trend-aware.",
      linkedin: "LinkedIn — professional, insightful, no slang.",
      twitter: "Twitter/X — under 240 chars, witty, scroll-stopping.",
      youtube: "YouTube — strong hook, SEO keywords, high CTR.",
    };

    const emojiRule = data.useEmoji
      ? "Use 1-3 tasteful emojis where they amplify the message."
      : "Do NOT use any emojis. Pure text only.";

    const languageMap: Record<string, string> = {
      english: "Write ALL output in natural English.",
      hindi: "Write ALL output in Hindi using Devanagari script (हिंदी). Keep it natural, conversational Hindi — not transliteration. Hashtags can stay in English/Roman script.",
      gujarati: "Write ALL output in Gujarati using Gujarati script (ગુજરાતી). Keep it natural, conversational Gujarati — not transliteration. Hashtags can stay in English/Roman script.",
    };
    const languageRule = languageMap[data.language];

    const scoringRule = `For EVERY item, include a "viralScore" integer from 0-100 estimating likelihood of going viral on ${data.platform} (consider hook strength, curiosity gap, emotion, trend-fit, clarity). Also include a short "viralReason" (max 60 chars) explaining why. Make scores realistic and spread out — not all 90+.`;

    let system = "";

    if (data.kind === "hook") {
      system = `You are an expert viral content writer. Generate 5 distinct scroll-stopping VIRAL HOOKS (opening lines only) for ${data.platform}. ${platformGuide[data.platform]}
Tone: ${data.tone}. ${emojiRule}
Rules:
- Each hook must be a single punchy opening line (max 120 chars).
- ONLY return hooks. No captions, no hashtags, no explanations.
- Each item's "text" is the hook. "hashtags" MUST be an empty array [].
${scoringRule}`;
    } else if (data.kind === "hashtag") {
      system = `You are an expert ${data.platform} growth strategist. Generate 3 distinct HASHTAG PACKS for ${data.platform}. ${platformGuide[data.platform]}
Rules:
- Each pack has 15-25 highly relevant trending hashtags (mix of broad + niche).
- Each hashtag MUST start with #, no spaces, no commas.
- "text" should be a short pack label like "Broad reach", "Niche", "Trending mix". "hashtags" is the array of tags.
${scoringRule}`;
    } else if (data.kind === "caption") {
      system = `You are an expert social media copywriter. Generate 5 distinct CAPTIONS for ${data.platform}. ${platformGuide[data.platform]}
Tone: ${data.tone}. ${emojiRule}
Rules:
- ONLY captions. No bios, no standalone hooks, no hashtag-only packs.
- 1-3 sentences each, engaging and on-brand.
- "hashtags" MUST be an empty array [].
${scoringRule}`;
    } else {
      system = `You are an expert profile copywriter. Generate 4 distinct BIOS for ${data.platform}. ${platformGuide[data.platform]}
Tone: ${data.tone}. ${emojiRule}
Rules:
- ONLY bios. No captions, no hooks, no hashtag packs.
- Each bio max 150 chars, identity-driven, memorable.
- "hashtags" MUST be an empty array [].
${scoringRule}`;
    }

    const jsonRule = `${languageRule}
Return STRICT JSON ONLY (no markdown, no commentary, no code fences) in this EXACT shape:
{"items":[{"text":"...","hashtags":["#tag"],"viralScore":0-100,"viralReason":"short reason"}]}`;

    const userPrompt = `Topic / about: ${data.topic}

REMINDERS (must follow strictly):
- Language: ${data.language.toUpperCase()} — ${languageRule}
- Tone: ${data.tone} — every item MUST clearly reflect this tone.
- Emojis: ${data.useEmoji ? "allowed (1-3 max)" : "FORBIDDEN — none at all"}.
- Output: JSON only, matching the schema. No prose before or after.`;

    const callOnce = async () => {
      const { text } = await generateText({
        model: gateway("google/gemini-3-flash-preview"),
        system: `${system}\n\n${jsonRule}`,
        prompt: userPrompt,
      });
      const parsed = extractJSON(text) as { items?: unknown };
      const rawItems = Array.isArray(parsed?.items) ? parsed.items : [];
      type RawItem = { text?: unknown; hashtags?: unknown; viralScore?: unknown; viralReason?: unknown };
      return (rawItems as RawItem[])
        .map((i) => ({
          text: String(i.text ?? "").trim(),
          hashtags: Array.isArray(i.hashtags) ? i.hashtags.map(String) : [],
          viralScore: Math.max(0, Math.min(100, Math.round(Number(i.viralScore) || 0))),
          viralReason: String(i.viralReason ?? "").trim(),
        }))
        .filter((i) => i.text.length > 0)
        .sort((a, b) => b.viralScore - a.viralScore);
    };

    let lastErr: unknown = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const items = await callOnce();
        if (items.length > 0) return { items };
        lastErr = new Error("empty response");
      } catch (error) {
        lastErr = error;
        const message = error instanceof Error ? error.message : "";
        if (message.includes("429")) throw new Error("Rate limit reached. Please wait a moment and try again.");
        if (message.includes("402")) throw new Error("AI credits exhausted. Add credits to your Lovable workspace.");
      }
    }
    throw new Error(`AI response failed. Please try again. ${lastErr instanceof Error ? lastErr.message : ""}`.trim());
  });
