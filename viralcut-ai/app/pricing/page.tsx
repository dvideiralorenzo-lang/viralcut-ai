"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { useRouter } from "next/navigation";

const PLANS = [
  { key: "free", name: "Free", price: "€0", desc: "Try the workflow", features: ["3 clips / month", "720p export", "Watermark included"], featured: false },
  { key: "starter", name: "Starter", price: "€19", desc: "For consistent posting", features: ["30 clips / month", "1080p export", "Small watermark"], featured: false },
  { key: "creator", name: "Creator", price: "€39", desc: "For full-time creators", features: ["100 clips / month", "No watermark", "Priority processing"], featured: true },
  { key: "agency", name: "Agency", price: "€199", desc: "For teams and clients", features: ["1,000 clips / month", "Multiple seats", "Client workspaces"], featured: false },
] as const;

export default function PricingPage() {
  const router = useRouter();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  async function handleChoose(planKey: string) {
    if (planKey === "free") {
      router.push("/register");
      return;
    }

    setLoadingPlan(planKey);

    const { data: { user } } = await supabaseBrowser.auth.getUser();
    if (!user) {
      router.push(`/register?plan=${planKey}`);
      return;
    }

    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, plan: planKey }),
    });
    const { url } = await res.json();
    window.location.href = url;
  }

  return (
    <main className="min-h-screen px-6 py-16 max-w-5xl mx-auto">
      <div className="text-center mb-14">
        <h1 className="font-display text-4xl font-bold">Plans that scale with how much you post</h1>
        <p className="text-dim mt-3">Cancel anytime. Prices in EUR.</p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {PLANS.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl p-6 flex flex-col border ${
              plan.featured ? "border-violet bg-violet/5" : "border-line bg-raised"
            }`}
          >
            {plan.featured && (
              <span className="text-xs font-bold bg-violet text-white rounded-full px-3 py-1 w-fit mb-3">
                Most popular
              </span>
            )}
            <p className="font-bold">{plan.name}</p>
            <p className="text-dim text-sm mb-4">{plan.desc}</p>
            <p className="text-3xl font-extrabold mb-5">
              {plan.price}
              <span className="text-sm text-dim font-normal">/mo</span>
            </p>
            <ul className="space-y-2 mb-6 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="text-sm text-dim">✓ {f}</li>
              ))}
            </ul>
            <button
              onClick={() => handleChoose(plan.key)}
              disabled={loadingPlan === plan.key}
              className={`w-full rounded-lg py-3 font-semibold transition disabled:opacity-50 ${
                plan.featured ? "bg-ink text-base" : "border border-dimmer text-ink"
              }`}
            >
              {loadingPlan === plan.key ? "Redirecting…" : `Choose ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </main>
  );
}
