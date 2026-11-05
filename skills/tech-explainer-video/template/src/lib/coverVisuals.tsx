import React from "react";
import { C, MONO } from "./theme";

/** 封面左侧的示意图。都画在 900×860 的 SVG 里，arg 是 script.md 里 `visual: arg` 的 arg 部分。 */
export const GOLD = "#ffc83d";
export const CYAN = "#3fd0ff";
const W = 900, H = 860;

const Svg: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} style={{ overflow: "visible" }}>
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="10" result="b" />
        <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
      <linearGradient id="beam" x1="0" x2="1">
        <stop offset="0" stopColor={GOLD} stopOpacity="0" />
        <stop offset="0.5" stopColor="#fff6c8" />
        <stop offset="1" stopColor={GOLD} stopOpacity="0" />
      </linearGradient>
    </defs>
    {children}
  </svg>
);

const shade = (hex: string, f: number) => {
  const n = parseInt(hex.slice(1), 16);
  const ch = (s: number) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * f)));
  return `rgb(${ch(16)},${ch(8)},${ch(0)})`;
};

/** 等距视角的一块板：左上角 (x,y)，宽 w、深 d、厚 t */
const Slab: React.FC<{ x: number; y: number; w: number; d: number; t: number; color: string }> = ({ x, y, w, d, t, color }) => {
  const dx = d * 0.87, dy = -d * 0.5;
  const top = `${x},${y} ${x + w},${y} ${x + w + dx},${y + dy} ${x + dx},${y + dy}`;
  const front = `${x},${y} ${x + w},${y} ${x + w},${y + t} ${x},${y + t}`;
  const side = `${x + w},${y} ${x + w + dx},${y + dy} ${x + w + dx},${y + dy + t} ${x + w},${y + t}`;
  const edge = shade(color, 1.35);
  return (
    <g stroke={edge} strokeWidth={2.5} strokeLinejoin="round">
      <polygon points={front} fill={shade(color, 0.75)} />
      <polygon points={side} fill={shade(color, 0.5)} />
      <polygon points={top} fill={color} />
      {[0.33, 0.66].map((f) => (
        <line key={f} x1={x + dx * f} y1={y + dy * f} x2={x + w + dx * f} y2={y + dy * f} stroke={shade(color, 0.6)} strokeWidth={2} />
      ))}
    </g>
  );
};

/** kv-stack[: 上层块数;下层块数]：上面一摞金色（多），下面一摞青色（少），中间一道光 */
const KvStack: React.FC<{ arg?: string }> = ({ arg }) => {
  const [a, b] = (arg ?? "6;2").split(";").map((s) => parseInt(s, 10));
  const t = 34, gap = 14, w = 470, d = 260;
  const slabs = (n: number, baseY: number, color: string) =>
    Array.from({ length: n }, (_, i) => <Slab key={i} x={110} y={baseY - i * (t + gap)} w={w} d={d} t={t} color={color} />);
  return (
    <Svg>
      <g transform="rotate(-6 450 430)">{slabs(a || 6, 90 + (a || 6) * (t + gap) + 40, GOLD)}</g>
      <rect x={-40} y={455} width={W + 80} height={14} fill="url(#beam)" filter="url(#glow)" transform="rotate(-8 450 460)" />
      {Array.from({ length: 22 }, (_, i) => {
        const px = 120 + ((i * 197) % 640), py = 420 + ((i * 89) % 90);
        return <line key={i} x1={px} y1={py} x2={px + 18} y2={py - 10} stroke={GOLD} strokeWidth={3} opacity={0.8} filter="url(#glow)" />;
      })}
      <g filter="url(#glow)" opacity={0.95}>{slabs(b || 2, 560 + (b || 2) * (t + gap), CYAN)}</g>
    </Svg>
  );
};

/** bar-compare: 大数;小数[;左标签;右标签]：两根横条对比 */
const BarCompare: React.FC<{ arg?: string }> = ({ arg }) => {
  const [big, small, la = "", lb = ""] = (arg ?? "100;10").split(";");
  const r = Math.max(0.04, Math.min(1, parseFloat(small) / parseFloat(big)));
  const bar = (y: number, frac: number, color: string, num: string, label: string) => (
    <g>
      {label && <text x={60} y={y - 26} fill={C.dim} fontSize={44} fontFamily={MONO}>{label}</text>}
      <rect x={60} y={y} width={780 * frac} height={150} rx={22} fill={color} filter="url(#glow)" />
      <text x={60 + 780 * frac + (frac > 0.6 ? -30 : 30)} y={y + 108} fill={frac > 0.6 ? "#111" : color}
        textAnchor={frac > 0.6 ? "end" : "start"} fontSize={92} fontWeight={900} fontFamily="Impact, sans-serif">{num}</text>
    </g>
  );
  return <Svg>{bar(180, 1, GOLD, big, la)}{bar(520, r, CYAN, small, lb)}</Svg>;
};

/** token-draft: tok1;tok2;tok3!;tok4：一排草稿 token，末尾带 ! 的被拒绝，之后的全部作废 */
const TokenDraft: React.FC<{ arg?: string }> = ({ arg }) => {
  const toks = (arg ?? "the;cat;sat!;on").split(";");
  const rej = toks.findIndex((t) => t.endsWith("!"));
  const n = toks.length, bw = Math.min(200, 780 / n - 20), x0 = (W - n * (bw + 20) + 20) / 2;
  return (
    <Svg>
      <text x={W / 2} y={170} textAnchor="middle" fill={C.dim} fontSize={46} fontFamily={MONO}>draft ×{n} → verify ×1</text>
      {toks.map((raw, i) => {
        const t = raw.replace(/!$/, "");
        const state = rej < 0 || i < rej ? "ok" : i === rej ? "no" : "dead";
        const col = state === "ok" ? C.k : state === "no" ? C.red : C.faint;
        const x = x0 + i * (bw + 20);
        return (
          <g key={i} opacity={state === "dead" ? 0.45 : 1}>
            <rect x={x} y={300} width={bw} height={bw} rx={20} fill={C.panel2} stroke={col} strokeWidth={6} filter={state === "dead" ? undefined : "url(#glow)"} />
            <text x={x + bw / 2} y={300 + bw / 2 + 22} textAnchor="middle" fill={C.text} fontSize={Math.min(64, bw / Math.max(2, t.length) * 1.6)} fontFamily={MONO} fontWeight={700}>{t}</text>
            <text x={x + bw / 2} y={300 + bw + 130} textAnchor="middle" fill={col} fontSize={110} fontWeight={900}>
              {state === "ok" ? "✓" : state === "no" ? "✗" : "·"}
            </text>
          </g>
        );
      })}
      <path d={`M${x0} ${720} H${x0 + n * (bw + 20) - 20}`} stroke={GOLD} strokeWidth={8} strokeLinecap="round" filter="url(#glow)" />
    </Svg>
  );
};

/** code-window: 文件名;行1;行2…：+ 开头高亮成金色加星，- 开头划红线 */
const CodeWindow: React.FC<{ arg?: string }> = ({ arg }) => {
  const [file, ...lines] = (arg ?? "model.py;q = x @ W_q;+ keep: kv cache;- old: full KV").split(";");
  return (
    <Svg>
      <rect x={70} y={120} width={240} height={64} rx={12} fill={C.k} />
      <text x={190} y={165} textAnchor="middle" fill="#0b1a12" fontSize={38} fontWeight={800} fontFamily={MONO}>{file}</text>
      <rect x={40} y={176} width={820} height={560} rx={30} fill={C.panel} stroke={C.line} strokeWidth={4} />
      {lines.map((raw, i) => {
        const y = 300 + i * 118, s = raw.trim();
        const hi = s.startsWith("+"), del = s.startsWith("-"), t = hi || del ? s.slice(1).trim() : s;
        return (
          <g key={i}>
            {hi && <text x={70} y={y} fill={GOLD} fontSize={56}>★</text>}
            <text x={130} y={y} fill={hi ? GOLD : del ? C.dim : C.text} fontSize={60} fontFamily={MONO} fontWeight={700}>{t}</text>
            {del && <line x1={120} y1={y - 20} x2={150 + t.length * 36} y2={y - 14} stroke={C.red} strokeWidth={9} strokeLinecap="round" />}
          </g>
        );
      })}
    </Svg>
  );
};

export const VISUALS: Record<string, React.FC<{ arg?: string }>> = {
  "kv-stack": KvStack,
  "bar-compare": BarCompare,
  "token-draft": TokenDraft,
  "code-window": CodeWindow,
};
