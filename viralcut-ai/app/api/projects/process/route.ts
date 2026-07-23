// app/api/projects/process/route.ts
// Orchestrates: transcribe -> detect viral clips -> queue rendering.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { detectViralClips } from "@/lib/detect-clips";

async function transcribeVideo(videoUrl: string) {
  const response = await fetch("https://api.deepgram.com/v1/listen?punctuate=true&utterances=true&model=nova-2&smart_format=true&language=es", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: videoUrl }),
  });

  const data = await response.json();

  if (!response.ok || data.err_code || data.error) {
    throw new Error(
      `Deepgram error: ${JSON.stringify(data.err_msg ?? data.error ?? data)}`
    );
  }

  const utterances = data.results?.utterances ?? [];

  if (utterances.length === 0) {
    throw new Error(
      `Deepgram returned no utterances. Full response: ${JSON.stringify(data).slice(0, 500)}`
    );
  }

  return {
    fullText: data.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "",
    segments: utterances.map((u: any) => ({
      start: u.start,
      end: u.end,
      text: u.transcript,
    })),
  };
}

export async function POST(req: NextRequest) {
  const { projectId } = await req.json();

  const { data: project, error: projectError } = await supabaseAdmin
    .from("projects")
    .select("*")
    .eq("id", projectId)
    .single();

  if (projectError || !project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  try {
    await supabaseAdmin.from("projects").update({ status: "transcribing" }).eq("id", projectId);

    const videoUrl = project.original_video_url ?? project.source_url;
    const { fullText, segments } = await transcribeVideo(videoUrl);

    await supabaseAdmin.from("transcripts").insert({
      project_id: projectId,
      full_text: fullText,
      segments,
    });

    await supabaseAdmin.from("projects").update({ status: "analyzing" }).eq("id", projectId);

    const candidates = await detectViralClips(segments);

    await supabaseAdmin.from("clips").insert(
      candidates.map((c) => ({
        project_id: projectId,
        title: c.title,
        hook: c.hook,
        start_time: c.start_time,
        end_time: c.end_time,
        score: c.score,
        reason: c.reason,
        caption_style: c.caption_style,
        status: "pending",
      }))
    );

    await supabaseAdmin.from("projects").update({ status: "rendering" }).eq("id", projectId);

    return NextResponse.json({ success: true, clipsFound: candidates.length });
  } catch (err) {
    console.error("Processing pipeline failed:", err);
    await supabaseAdmin.from("projects").update({ status: "failed" }).eq("id", projectId);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Processing failed: ${message}` }, { status: 500 });
  }
}
