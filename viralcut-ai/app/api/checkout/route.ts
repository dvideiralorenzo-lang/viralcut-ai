// app/api/checkout/route.ts
// Creates a Stripe Checkout session for the chosen plan.

import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, PlanKey } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, plan } = (await req.json()) as { userId: string; plan: PlanKey };

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const session = await createCheckoutSession({
    userId,
    email: profile.email,
    plan,
  });

  return NextResponse.json({ url: session.url });
}
