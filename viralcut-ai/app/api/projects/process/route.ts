// app/api/projects/process/route.ts
// Orchestrates: transcribe -> detect viral clips -> queue rendering.
// This runs on the server, using the service-role Supabase client since it
// writes to tables (transcripts, clips) beyond what the uploading user's
// session would normally touch directly.

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-server";
import { detectViralClips } from "@/lib/detect-clips";

// Swap this for your chosen provider (Deepgram shown; AssemblyAI works similarly).
async function transcribeVideo(videoUrl: string) {
  const response = await fetch("https://api.deepgram.com/v1/listen?punctuate=true&utterances=true", {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.DEEPGRAM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ url: videoUrl }),
  });

  const data = await response.json();
  const utterances = data.results?.utterances ?? [];

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
    // 1. Transcribe
    await supabaseAdmin.from("projects").update({ status: "transcribing" }).eq("id", projectId);

    const videoUrl = project.original_video_url ?? project.source_url;
    const { fullText, segments } = await transcribeVideo(videoUrl);

    await supabaseAdmin.from("transcripts").insert({
      project_id: projectId,
      full_text: fullText,
      segments,
    });

    // 2. Detect viral clips
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

    // 3. Rendering is handled by a separate worker process (see workers/render-short.ts)
    // because FFmpeg jobs run too long for a serverless function. In production,
    // push a message to a queue (e.g. Inngest, Trigger.dev, or a Redis queue)
    // here instead of rendering inline.
    await supabaseAdmin.from("projects").update({ status: "rendering" }).eq("id", projectId);

    return NextResponse.json({ success: true, clipsFound: candidates.length });
  } catch (err) {
    await supabaseAdmin.from("projects").update({ status: "failed" }).eq("id", projectId);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
