// 打包一次，截图和渲染都复用 out/bundle（固定目录，覆盖写，不在 $TMPDIR 里越堆越多）。
// 源文件（src/、public/、py/values.json）比打包新时才重新打包。用法：node tools/bundle.mjs [--force]
import { bundle } from "@remotion/bundler";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve("out/bundle");
const newest = (p) => {
  if (!fs.existsSync(p)) return 0;
  const s = fs.statSync(p);
  if (!s.isDirectory()) return s.mtimeMs;
  return Math.max(s.mtimeMs, ...fs.readdirSync(p).map((f) => newest(path.join(p, f))));
};
export async function ensureBundle(force = false) {
  const stamp = path.join(OUT, "index.html");
  const src = Math.max(newest("src"), newest("public"), newest("py/values.json"));
  if (!force && fs.existsSync(stamp) && fs.statSync(stamp).mtimeMs > src) return OUT;
  fs.rmSync(OUT, { recursive: true, force: true });
  await bundle({ entryPoint: path.resolve("src/index.ts"), outDir: OUT });
  return OUT;
}
// 路径含中文时 import.meta.url 是 URL 编码的，必须转回文件路径再比
if (fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  console.log(await ensureBundle(process.argv.includes("--force")));
}
