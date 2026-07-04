// workers/render-short.ts
// Cuts a vertical short from the source video and burns in animated captions.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink } from "node:fs/promises";

const execFileAsync = promisify(execFile);

interface CaptionWord {
  word: string;
  start: number; // seconds, relative to clip start
  end: number;
}

interface RenderShortInput {
  inputPath: string;      // path to the source (long) video
  outputPath: string;     // where the final .mp4 short is written
  startTime: number;      // seconds into the source video
  endTime: number;
  captionWords?: CaptionWord[];
  captionStyle?: "bold-yellow" | "bold-white" | "karaoke";
}

const STYLE_OVERRIDES: Record<string, string> = {
  "bold-yellow": "FontName=Archivo Black,FontSize=20,PrimaryColour=&H00E6FF&,OutlineColour=&H000000&,BorderStyle=1,Outline=3,Bold=1,Alignment=2,MarginV=180",
  "bold-white": "FontName=Archivo Black,FontSize=20,PrimaryColour=&HFFFFFF&,OutlineColour=&H000000&,BorderStyle=1,Outline=3,Bold=1,Alignment=2,MarginV=180",
  karaoke: "FontName=Archivo Black,FontSize=20,PrimaryColour=&HFFFFFF&,SecondaryColour=&H00E6FF&,OutlineColour=&H000000&,BorderStyle=1,Outline=3,Bold=1,Alignment=2,MarginV=180",
};

function toAssTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const cs = Math.floor((seconds % 1) * 100);
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

function buildAssSubtitles(words: CaptionWord[], style: string): string {
  const styleLine = STYLE_OVERRIDES[style] ?? STYLE_OVERRIDES["bold-white"];
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920

[V4+ Styles]
Format: Name, ${styleLine.split(",").map((kv) => kv.split("=")[0]).join(", ")}
Style: Default,${styleLine.split(",").map((kv) => kv.split("=")[1]).join(",")}

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  const events = words
    .map(
      (w) =>
        `Dialogue: 0,${toAssTimestamp(w.start)},${toAssTimestamp(w.end)},Default,,0,0,0,,${w.word.toUpperCase()}`
    )
    .join("\n");

  return header + events;
}

export async function renderVerticalClip({
  inputPath,
  outputPath,
  startTime,
  endTime,
  captionWords,
  captionStyle = "bold-yellow",
}: RenderShortInput): Promise<void> {
  const duration = endTime - startTime;
  let assPath: string | null = null;

  const filters = ["scale=-2:1920", "crop=1080:1920"];

  if (captionWords && captionWords.length > 0) {
    assPath = `/tmp/captions-${Date.now()}.ass`;
    await writeFile(assPath, buildAssSubtitles(captionWords, captionStyle));
    filters.push(`ass=${assPath}`);
  }

  try {
    await execFileAsync("ffmpeg", [
      "-y",
      "-ss", String(startTime),
      "-i", inputPath,
      "-t", String(duration),
      "-vf", filters.join(","),
      "-c:v", "libx264",
      "-preset", "fast",
      "-crf", "20",
      "-c:a", "aac",
      "-b:a", "192k",
      "-movflags", "+faststart",
      outputPath,
    ]);
  } finally {
    if (assPath) await unlink(assPath).catch(() => {});
  }
}
