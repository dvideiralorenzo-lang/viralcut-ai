"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Clip {
  id: string;
  title: string;
  hook: string;
  score: number;
  reason: string;
  start_time: number;
  end_time: number;
  status: string;
  output_video_url: string | null;
}

interface Project {
  id: string;
  title: string;
  status: string;
}

export default function EditorPage() {
  const params = useParams();
  const projectId = params.projectId as string;

  const [project, setProject] = useState<Project | null>(null);
  const [clips, setClips] = useState<Clip[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: projectData } = await supabaseBrowser
        .from("projects")
        .select("id, title, status")
        .eq("id", projectId)
        .single();

      const { data: clipsData } = await supabaseBrowser
        .from("clips")
        .select("*")
        .eq("project_id", projectId)
        .order("score", { ascending: false });

      setProject(projectData);
      setClips(clipsData ?? []);
      setLoading(false);
    }
    load();

    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [projectId]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-dim">Loading your project…</p>
      </main>
    );
  }

  if (!project) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-dim">Project not found.</p>
      </main>
    );
  }

  const isProcessing = ["uploaded", "transcribing", "analyzing"].includes(project.status);

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <a href="/dashboard" className="text-sm text-dim hover:text-ink">← Back to projects</a>

      <div className="flex items-center justify-between mt-4 mb-10">
        <h1 className="font-display text-2xl font-bold">{project.title}</h1>
        <span className="text-xs px-3 py-1 rounded-full bg-violet/15 text-cyan capitalize">
          {project.status}
        </span>
      </div>

      {isProcessing && (
        <div className="border border-dashed border-line rounded-xl p-12 text-center">
          <p className="font-semibold mb-1">Finding your best moments…</p>
          <p className="text-dim text-sm">
            This page updates automatically — transcribing audio and analyzing for viral potential.
          </p>
        </div>
      )}

      {!isProcessing && clips.length === 0 && (
        <div className="border border-dashed border-line rounded-xl p-12 text-center">
          <p className="font-semibold mb-1">No clips found</p>
          <p className="text-dim text-sm">
            The AI couldn't find a strong standalone moment in this video. Try a longer source video.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-5">
        {clips.map((clip) => (
          <div key={clip.id} className="bg-raised border border-line rounded-xl overflow-hidden flex flex-col">
            <div className="aspect-[9/16] bg-black flex items-center justify-center">
              {clip.output_video_url ? (
                <video src={clip.output_video_url} controls className="w-full h-full object-cover" />
              ) : (
                <p className="text-xs text-dim capitalize">{clip.status}…</p>
              )}
            </div>
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono text-cyan">Score {clip.score}</span>
                <span className="text-xs text-dimmer">
                  {Math.round(clip.end_time - clip.start_time)}s
                </span>
              </div>
              <p className="font-semibold text-sm mb-1">{clip.title}</p>
              <p className="text-xs text-dim mb-3">"{clip.hook}"</p>
              <p className="text-xs text-dimmer mt-auto">{clip.reason}</p>
             {clip.output_video_url && (
                
                  href={clip.output_video_url}
                  download
                  className="mt-3 text-center text-xs bg-ink text-base font-semibold rounded-lg py-2 hover:opacity-90"
                >
                >
                  Download
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
