# ViralCut AI

AI-powered clipping tool — upload long videos, get viral vertical shorts with captions, ready for TikTok, Reels, and YouTube Shorts.

## What's in this package

- `landing-preview.html` — full marketing landing page, open directly in a browser to preview
- `database/schema.sql` — complete Supabase/Postgres schema with row-level security
- `lib/detect-clips.ts` — OpenAI-powered viral moment detection from a transcript
- `lib/stripe.ts` — subscription checkout and billing portal
- `app/api/webhooks/stripe/route.ts` — syncs Stripe subscriptions to your database
- `workers/render-short.ts` — FFmpeg pipeline: vertical crop + burned-in animated captions
- `.env.example` — every credential you need to fill in

## What this is NOT (yet)

This is the architecture and the core engine, not a deployed product. To go live you still need to:

1. **Scaffold a real Next.js app** (`npx create-next-app@latest`) and drop these files into it
2. **Create your own accounts**: Supabase (database), Stripe (payments — this is what routes subscriber money to *you*), OpenAI (clip detection), Deepgram or AssemblyAI (transcription), and a storage bucket (Cloudflare R2 or S3) for video files
3. **Run the schema** in your Supabase SQL editor
4. **Fill in `.env.local`** from `.env.example` with your keys
5. **Build the remaining pages**: dashboard, upload flow, editor, login/register — the landing page here sets the visual language to extend to those
6. **Deploy**: Vercel for the web app, a separate worker host (Railway, Render, or Fly.io) for FFmpeg rendering, since Vercel's serverless functions aren't suited to long video processing

## Local preview of the landing page

Just open `landing-preview.html` in any browser — no build step needed, it's self-contained.

## Why revenue routes to you

Subscription money flows through Stripe. Whichever Stripe account's secret key you put in `STRIPE_SECRET_KEY`, that's the account checkout sessions bill against and where payouts land — there's no shared or intermediary account. Same logic for Supabase (your data) and OpenAI (your usage bill).

## Suggested build order

1. Auth (Supabase Auth) + landing/pricing pages
2. Upload flow (file or URL) + storage
3. Transcription worker
4. Clip detection (already built — `lib/detect-clips.ts`)
5. Rendering worker (already built — `workers/render-short.ts`)
6. Dashboard + editor UI
7. Stripe checkout + webhook (already built)
8. Usage limits enforcement per plan
