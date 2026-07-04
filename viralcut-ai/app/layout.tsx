import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ViralCut AI — Turn long videos into viral shorts",
  description: "Upload a long video, get AI-detected viral clips ready for TikTok, Reels and YouTube Shorts.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
