"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: signInError } = await supabaseBrowser.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold mb-1">Welcome back</h1>
        <p className="text-dim text-sm mb-8">Log in to your ViralCut AI account.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm text-dim block mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-raised border border-line rounded-lg px-4 py-3 text-ink outline-none focus:border-violet"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="text-sm text-dim block mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-raised border border-line rounded-lg px-4 py-3 text-ink outline-none focus:border-violet"
              placeholder="Your password"
            />
          </div>

          {error && <p className="text-pink text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-base font-semibold rounded-lg py-3 mt-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="text-sm text-dim mt-6 text-center">
          No account yet? <a href="/register" className="text-ink underline">Sign up</a>
        </p>
      </div>
    </main>
  );
}
