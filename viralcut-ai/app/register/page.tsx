"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { data, error: signUpError } = await supabaseBrowser.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Create the profile row and starting usage limits.
      await supabaseBrowser.from("profiles").insert({
        id: data.user.id,
        email: data.user.email,
        plan: "free",
      });
      await supabaseBrowser.from("usage_limits").insert({
        user_id: data.user.id,
        clips_used: 0,
        clips_limit: 3,
      });
    }

    router.push("/dashboard");
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-bold mb-1">Create your account</h1>
        <p className="text-dim text-sm mb-8">3 free clips a month, no card required.</p>

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
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-raised border border-line rounded-lg px-4 py-3 text-ink outline-none focus:border-violet"
              placeholder="At least 8 characters"
            />
          </div>

          {error && <p className="text-pink text-sm">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ink text-base font-semibold rounded-lg py-3 mt-2 hover:opacity-90 transition disabled:opacity-50"
          >
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="text-sm text-dim mt-6 text-center">
          Already have an account? <a href="/login" className="text-ink underline">Log in</a>
        </p>
      </div>
    </main>
  );
}
