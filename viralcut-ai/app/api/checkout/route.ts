// app/api/checkout/route.ts
// Creates a Stripe Checkout session for the chosen plan.

import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession, PlanKey } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function POST(req: NextRequest) {
  const { userId, plan } = (await req.json()) as { userId: string; plan: PlanKey };

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    return NextResponse.json(
      { error: `Database error: ${profileError.message}` },
      { status: 500 }
    );
  }

  if (!profile) {
    return NextResponse.json(
      { error: `No profile found for user ID ${userId}. Try logging out and back in.` },
      { status: 404 }
    );
  }

  const session = await createCheckoutSession({
    userId,
    email: profile.email,
    plan,
  });

  return NextResponse.json({ url: session.url });
}
