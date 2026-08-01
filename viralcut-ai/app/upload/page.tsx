"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

function NavBar() {
  const router = useRouter();
  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.push("/login");
  }
  return (
    <nav className="flex items-center justify-between px-6 md:px-12 py-5 border-b border-line">
      <a href="/dashboard" className="flex items-center gap-2 font-bold text-lg">
        <div
          className="w-5 h-5"
          style={{
            background: "linear-gradient(135deg, #7C5CFC, #FF4D8D)",
            clipPath: "polygon(0 20%, 100% 0, 100% 80%, 0 100%)",
          }}
        />
        ViralCut AI
      </a>
      <div className="flex items-center gap-4 text-sm">
        <a href="/dashboard" className="text-dim hover:text-ink">Projects</a>
        <a href="/pricing" className="text-dim hover:text-ink">Pricing</a>
        <button onClick={handleLogout} className="text-dim hover:text-ink">Log out</button>
      </div>
    </nav>
  );
}

export default function UploadPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrag(e: React.DragEvent, active: boolean) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(active);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) setFile(e.dataTransfer.files[0]);
  }

  function formatSize(bytes: number) {
    return bytes < 1024 * 1024
      ? `${Math.round(bytes / 1024)} KB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setError(null);

    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

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

    const { data: project, error: insertError } = await supabaseBrowser
      .from("projects")
      .insert({
        user_id: user.id,
        title: file.name,
        source_type: "upload",
        original_video_url: publicUrl.publicUrl,
        status: "uploaded",
      })
      .select()
      .single();

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await fetch("/api/projects/process", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });

    router.push(`/editor/${project.id}`);
  }

  return (
    <main className="min-h-screen">
      <NavBar />
      <div className="flex items-center justify-center px-6 py-20">
        <div className="w-full max-w-lg">
          <h1 className="font-display text-2xl font-bold mb-1">New project</h1>
          <p className="text-dim text-sm mb-8">Drop a video and ViralCut will find the best moments.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div
              onDragOver={(e) => handleDrag(e, true)}
              onDragLeave={(e) => handleDrag(e, false)}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`rounded-2xl border-2 border-dashed p-10 text-center cursor-pointer transition ${
                dragActive ? "border-violet bg-violet/5" : "border-line hover:border-dimmer"
              }`}
            >
              <input
                ref={inputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
              {file ? (
                <div>
                  <p className="font-semibold text-sm">{file.name}</p>
                  <p className="text-dim text-xs mt-1">{formatSize(file.size)}</p>
                  <p className="text-cyan text-xs mt-3">Click to choose a different file</p>
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-sm mb-1">Drop your video here</p>
                  <p className="text-dim text-xs">or click to browse — MP4, up to 50MB</p>
                </div>
              )}
            </div>

            {error && <p className="text-pink text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading || !file}
              className="w-full bg-ink text-base font-semibold rounded-lg py-3 hover:opacity-90 transition disabled:opacity-40"
            >
              {loading ? "Starting…" : "Find viral clips"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
