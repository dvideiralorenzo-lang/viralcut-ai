export default function HomePage() {
  return (
    <main className="min-h-screen">
      <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 py-5 border-b border-line bg-base/80 backdrop-blur">
        <div className="flex items-center gap-2 font-bold text-lg">
          <div
            className="w-5 h-5"
            style={{
              background: "linear-gradient(135deg, #7C5CFC, #FF4D8D)",
              clipPath: "polygon(0 20%, 100% 0, 100% 80%, 0 100%)",
            }}
          />
          ViralCut AI
        </div>
        <div className="hidden md:flex gap-9 text-sm text-dim">
          <a href="#workflow" className="hover:text-ink">How it works</a>
          <a href="#pricing" className="hover:text-ink">Pricing</a>
        </div>
        <div className="flex items-center gap-4">
          <a href="/login" className="text-sm border border-dimmer rounded-lg px-4 py-2 text-dim hover:text-ink">
            Log in
          </a>
          <a href="/register" className="text-sm bg-ink text-base font-semibold rounded-lg px-4 py-2 hover:opacity-90">
            Start free
          </a>
        </div>
      </nav>

      <section className="px-6 pt-24 pb-16 max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 text-sm text-dim border border-dimmer rounded-full px-4 py-1.5 mb-7">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan" />
          Now with automatic hook detection
        </div>
        <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-none">
          Turn long videos into{" "}
          <span
            style={{
              background: "linear-gradient(90deg, #3DDBFF, #FF4D8D 55%, #7C5CFC)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            viral shorts
          </span>{" "}
          in minutes
        </h1>
        <p className="text-dim text-lg max-w-xl mx-auto mt-6">
          Paste a link or drop a file. ViralCut finds the moments people will stop scrolling for,
          cuts them vertical, and captions them automatically.
        </p>
        <div className="flex justify-center gap-3 mt-9">
          <a href="/register" className="bg-ink text-base font-semibold rounded-xl px-7 py-4 hover:opacity-90">
            Create your first clip
          </a>
          <a href="#pricing" className="border border-dimmer rounded-xl px-7 py-4 text-dim hover:text-ink">
            See pricing
          </a>
        </div>
        <p className="text-xs text-dimmer mt-4">No credit card required · 3 free clips every month</p>
      </section>

      <section id="workflow" className="px-6 py-20 max-w-5xl mx-auto">
        <h2 className="font-display text-3xl font-bold text-center mb-14">
          From raw footage to ready-to-post in three steps
        </h2>
        <div className="grid md:grid-cols-3 gap-px bg-line border border-line rounded-2xl overflow-hidden">
          {[
            { n: "01", title: "Upload or paste a link", desc: "Drop a video file, or paste a YouTube link. No format wrangling." },
            { n: "02", title: "AI finds the moments", desc: "ViralCut transcribes the audio and scores every segment for hook strength." },
            { n: "03", title: "Export, ready to post", desc: "Vertical crop and animated captions applied automatically." },
          ].map((step) => (
            <div key={step.n} className="bg-base p-8">
              <p className="font-mono text-sm text-dimmer mb-6">{step.n}</p>
              <p className="font-bold mb-2">{step.title}</p>
              <p className="text-sm text-dim leading-relaxed">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="pricing" className="px-6 py-20 max-w-5xl mx-auto text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Plans that scale with how much you post</h2>
        <p className="text-dim mb-12">Cancel anytime. Prices in EUR.</p>
        <a href="/pricing" className="inline-block bg-ink text-base font-semibold rounded-xl px-8 py-4 hover:opacity-90">
          View full pricing
        </a>
      </section>

      <footer className="border-t border-line px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-dimmer max-w-5xl mx-auto">
        <span>© 2026 ViralCut AI</span>
        <div className="flex gap-6">
          <a href="#" className="hover:text-dim">Privacy</a>
          <a href="#" className="hover:text-dim">Terms</a>
        </div>
      </footer>
    </main>
  );
}
