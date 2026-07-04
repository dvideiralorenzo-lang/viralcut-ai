"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

interface Project {
  id: string;
  title: string;
  status: string;
  created_at: string;
}

interface Usage {
  clips_used: number;
  clips_limit: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [plan, setPlan] = useState("free");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabaseBrowser.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const [{ data: projectsData }, { data: usageData }, { data: profileData }] = await Promise.all([
        supabaseBrowser
          .from("projects")
          .select("id, title, status, created_at")
          .order("created_at", { ascending: false }),
        supabaseBrowser
          .from("usage_limits")
          .select("clips_used, clips_limit")
          .eq("user_id", user.id)
          .single(),
        supabaseBrowser
          .from("profiles")
          .select("plan")
          .eq("id", user.id)
          .single(),
      ]);

      setProjects(projectsData ?? []);
      setUsage(usageData ?? null);
      setPlan(profileData?.plan ?? "free");
      setLoading(false);
    }
    load();
  }, [router]);

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-dim">Loading your dashboard…</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-10">
        <div>
          <h1 className="font-display text-2xl font-bold">Your projects</h1>
          <p className="text-dim text-sm mt-1 capitalize">{plan} plan</p>
        </div>
        <a
          href="/upload"
          className="bg-ink text-base font-semibold rounded-lg px-5 py-3 hover:opacity-90 transition"
        >
          + New project
        </a>
      </div>

      {usage && (
        <div className="bg-raised border border-line rounded-xl p-5 mb-8 flex items-center justify-between">
          <div>
            <p className="text-sm text-dim">Clips this month</p>
            <p className="text-xl font-bold mt-1">
              {usage.clips_used} <span className="text-dim font-normal">/ {usage.clips_limit}</span>
            </p>
          </div>
          {plan === "free" && (
            <a href="/pricing" className="text-sm text-cyan underline">
              Upgrade for more clips
            </a>
          )}
        </div>
      )}

      {projects.length === 0 ? (
        <div className="border border-dashed border-line rounded-xl p-16 text-center">
          <p className="font-semibold mb-1">Start your first project</p>
          <p className="text-dim text-sm mb-6">Upload a video or paste a link to get your first AI-detected clips.</p>
          <a
            href="/upload"
            className="inline-block bg-ink text-base font-semibold rounded-lg px-5 py-3 hover:opacity-90 transition"
          >
            Create project
          </a>
        </div>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <a
              key={project.id}
              href={`/editor/${project.id}`}
              className="flex items-center justify-between bg-raised border border-line rounded-xl px-5 py-4 hover:border-dimmer transition"
            >
              <div>
                <p className="font-medium">{project.title}</p>
                <p className="text-dim text-xs mt-1">
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-violet/15 text-cyan capitalize">
                {project.status}
              </span>
            </a>
          ))}
        </div>
      )}
    </main>
  );
}
