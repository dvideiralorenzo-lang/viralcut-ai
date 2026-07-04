"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function UploadPage() {
  const router = useRouter();
  const [sourceType, setSourceType] = useState<"upload" | "youtube">("youtube");
  const [url, setUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    let original_video_url: string | null = null;

    if (sourceType === "upload" && file) {
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabaseBrowser.storage
        .from("videos")
        .upload(filePath, file);

      if (uploadError) {
        setError(uploadError.message);
        setLoading(false);
        return;
      }
      const { data: publicUrl } = supabaseBrowser.storage.from("videos").getPublicUrl(filePath);
      original_video_url = publicUrl.publicUrl;
    }

    const { data: project, error: insertError } = await supabaseBrowser
      .from("projects")
      .insert({
        user_id: user.id,
        title: sourceType === "youtube" ? "YouTube import" : file?.name ?? "Untitled",
        source_type: sourceType,
        source_url: sourceType === "youtube" ? url : null,
        original_video_url,
        status: "uploaded",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    // Kick off the processing pipeline (transcription -> clip detection -> render).
    await fetch("/api/projects/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });

    router.push(`/editor/${project.id}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-bold mb-1">New project</h1>
        <p className="text-dim text-sm mb-8">Paste a link or upload a file to get started.</p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => setSourceType("youtube")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              sourceType === "youtube" ? "border-violet bg-violet/10" : "border-line text-dim"
            }`}
          >
            Paste a link
          </button>
          <button
            type="button"
            onClick={() => setSourceType("upload")}
            className={`flex-1 py-2 rounded-lg text-sm font-medium border ${
              sourceType === "upload" ? "border-violet bg-violet/10" : "border-line text-dim"
            }`}
          >
            Upload a file
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {sourceType === "youtube" ? (
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              className="w-full bg-raised border border-line rounded-lg px-4 py-3 text-ink outline-none focus:border-violet"
            />
          ) : (
            <input
              type="file"
              required
              accept="video/*"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full bg-raised border border-line rounded-lg px-4 py-3 text-ink outline-none"
            />
          )}

          {error && <p className="text-pink text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-base font-semibold rounded-lg py-3 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Starting…" : "Find viral clips"}
          </button>
        </form>
      </div>
    </main>
  );
}
