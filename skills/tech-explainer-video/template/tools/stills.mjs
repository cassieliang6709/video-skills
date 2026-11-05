// usage: node tools/stills.mjs <compId> [frames...]   (default: middle of every beat)
import { ensureBundle } from "./bundle.mjs";
import { renderStill, selectComposition } from "@remotion/renderer";
import fs from "node:fs";
import path from "node:path";
const [comp, ...fr] = process.argv.slice(2);
const tl = JSON.parse(fs.readFileSync("src/timeline.json", "utf8"));
const ch = tl.chapters.find((c) => c.id === comp.replace(/-/g, "_"));
const TF = /^ep\d+-/.test(comp) ? 0 : 60;
const frames = fr.length ? fr.map(Number) : ch.beats.map((b) => TF + b.from + Math.floor(b.frames * 0.8));
const serveUrl = await ensureBundle();  // 复用 out/bundle，不再每次在 $TMPDIR 新建
const composition = await selectComposition({ serveUrl, id: comp });
fs.mkdirSync(`out/check/${comp}`, { recursive: true });
for (const [i, frame] of frames.entries()) {
  await renderStill({ composition, serveUrl, frame, output: `out/check/${comp}/${String(i).padStart(2, "0")}.jpg`, imageFormat: "jpeg", scale: Number(process.env.SCALE ?? 0.5) });
}
console.log("done", frames.length);
