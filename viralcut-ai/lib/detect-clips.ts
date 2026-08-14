// lib/detect-clips.ts
// Analyzes a transcript and returns scored, timestamped viral clip candidates.

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TitleVariant {
  title: string;
  hook: string;
}

export interface ClipCandidate {
  title: string;
  hook: string;
  start_time: number;
  end_time: number;
  score: number; // 0-100
  reason: string;
  caption_style: "bold-yellow" | "bold-white" | "karaoke";
  title_variants: TitleVariant[];
}
const SYSTEM_PROMPT = `You are an expert short-form video editor for TikTok, Reels, and YouTube Shorts,
specialized in finding complete narrative arcs rather than isolated punchy lines.

Criteria:
- Strong hook in the first 3 seconds that creates curiosity or tension.
- Prefer clips with a complete story arc: setup (what's the situation) →
  tension or turn (what changes, what's revealed, what's at stake) →
  payoff (resolution, punchline, or key takeaway). A clip that only has a
  good opening line but no payoff is weaker than one with a full arc, even
  if the opening line is punchier.
- One clear idea per clip — no clips that require outside context.
- Duration between 20 and 60 seconds — favor the longer end of that range
  when a longer span is needed to complete the arc.
- High emotional, educational, controversial, or surprising value.
- Skip filler, long intros, and dead air.
- In "reason", briefly note the arc: what the setup is, what the turn is,
  and what the payoff is, so it's clear this is a complete story, not just a soundbite.

Return ONLY a JSON array. Each item must have exactly these fields:
title (string), hook (string), start_time (number, seconds),
end_time (number, seconds), score (integer 0-100), reason (string, one sentence),
title_variants (array of exactly 3 objects, each with "title" and "hook" fields —
three genuinely different angles on the same clip: one curiosity-driven, one
emotional, one direct/bold. The first item in title_variants should match the
main title and hook).
No prose, no markdown fences — valid JSON only.`;
export async function detectViralClips(
  segments: TranscriptSegment[]
): Promise<ClipCandidate[]> {
  const transcriptText = segments
    .map((s) => `[${s.start.toFixed(1)}-${s.end.toFixed(1)}] ${s.text}`)
    .join("\n");

  const response = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    temperature: 0.4,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: transcriptText },
    ],
  });

  const raw = response.choices[0].message.content ?? "[]";

  let parsed: ClipCandidate[];
  try {
    parsed = JSON.parse(raw);
  } catch {
    const cleaned = raw.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  // Guardrails: enforce duration bounds and sort by score.
  // NOTE: lower bound relaxed to 3s temporarily for easier testing with short clips.
  // Restore to 15 before using with real, longer source videos.
  return parsed
    .filter((c) => c.end_time - c.start_time >= 15 && c.end_time - c.start_time <= 90)
    .map((c) => ({ ...c, caption_style: c.caption_style ?? "bold-yellow" }))
    .sort((a, b) => b.score - a.score);
}
