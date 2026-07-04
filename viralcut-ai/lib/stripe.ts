// lib/stripe.ts
// Stripe subscription setup. All revenue routes to the Stripe account tied
// to STRIPE_SECRET_KEY below — that's whichever account you create and
// connect these keys to. Set these as your own account's keys in your
// hosting provider's environment variables (e.g. Vercel project settings).

import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export const PLANS = {
  starter: { name: "Starter", priceId: process.env.STRIPE_PRICE_STARTER!, clipsLimit: 30 },
  creator: { name: "Creator", priceId: process.env.STRIPE_PRICE_CREATOR!, clipsLimit: 100 },
  agency: { name: "Agency", priceId: process.env.STRIPE_PRICE_AGENCY!, clipsLimit: 1000 },
} as const;

export type PlanKey = keyof typeof PLANS;

export async function createCheckoutSession({
  userId,
  email,
  plan,
}: {
  userId: string;
  email: string;
  plan: PlanKey;
}) {
  return stripe.checkout.sessions.create({
    mode: "subscription",
    customer_email: email,
    client_reference_id: userId,
    line_items: [{ price: PLANS[plan].priceId, quantity: 1 }],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=1`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pricing`,
  });
}

export async function createBillingPortalSession(customerId: string) {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  });
}
