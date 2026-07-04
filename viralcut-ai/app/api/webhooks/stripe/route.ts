// app/api/webhooks/stripe/route.ts
// Receives Stripe events and syncs subscription + usage state in Supabase.
// Register this URL in your Stripe dashboard: https://yourdomain.com/api/webhooks/stripe

import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS, PlanKey } from "@/lib/stripe";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // service role: bypasses RLS for server-side writes
);

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature")!;

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as any;
      const userId = session.client_reference_id;
      const customerId = session.customer;

      const subscription = await stripe.subscriptions.retrieve(session.subscription);
      const priceId = subscription.items.data[0].price.id;
      const plan = (Object.keys(PLANS) as PlanKey[]).find(
        (key) => PLANS[key].priceId === priceId
      );

      if (!plan || !userId) break;

      await supabase.from("profiles").update({
        plan,
        stripe_customer_id: customerId,
      }).eq("id", userId);

      await supabase.from("subscriptions").upsert({
        user_id: userId,
        stripe_subscription_id: subscription.id,
        plan,
        status: subscription.status,
        current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      });

      await supabase.from("usage_limits").update({
        clips_limit: PLANS[plan].clipsLimit,
      }).eq("user_id", userId);

      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object as any;
      await supabase
        .from("subscriptions")
        .update({
          status: subscription.status,
          current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
        })
        .eq("stripe_subscription_id", subscription.id);

      if (event.type === "customer.subscription.deleted") {
        const { data: sub } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_subscription_id", subscription.id)
          .single();

        if (sub) {
          await supabase.from("profiles").update({ plan: "free" }).eq("id", sub.user_id);
          await supabase.from("usage_limits").update({ clips_limit: 3 }).eq("user_id", sub.user_id);
        }
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
