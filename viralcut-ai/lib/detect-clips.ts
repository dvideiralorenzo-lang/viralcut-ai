// lib/detect-clips.ts
// Analyzes a transcript and returns scored, timestamped viral clip candidates.

import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface ClipCandidate {
  title: string;
  hook: string;
  start_time: number;
  end_time: number;
  score: number; // 0-100
  reason: string;
  caption_style: "bold-yellow" | "bold-white" | "karaoke";
}

const SYSTEM_PROMPT = `You are an expert short-form video editor for TikTok, Reels, and YouTube Shorts.
Given a timestamped transcript, identify the strongest standalone clips.

Criteria:
- Strong hook in the first 3 seconds.
- One clear idea per clip — no clips that require outside context.
- Duration between 20 and 60 seconds.
- High emotional, educational, controversial, or surprising value.
- Skip filler, long intros, and dead air.

Return ONLY a JSON array. Each item must have exactly these fields:
title (string), hook (string), start_time (number, seconds),
end_time (number, seconds), score (integer 0-100), reason (string, one sentence).
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
    // Model occasionally wraps in fences despite instructions — strip and retry.
    const cleaned = raw.replace(/```json|```/g, "").trim();
    parsed = JSON.parse(cleaned);
  }

  // Guardrails: enforce duration bounds and sort by score.
  return parsed
    .filter((c) => c.end_time - c.start_time >= 15 && c.end_time - c.start_time <= 90)
    .map((c) => ({ ...c, caption_style: c.caption_style ?? "bold-yellow" }))
    .sort((a, b) => b.score - a.score);
}
