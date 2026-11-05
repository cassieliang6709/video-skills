import React from "react";
import { AbsoluteFill } from "remotion";
import timeline from "../timeline.json";
import { FONT, MONO } from "./theme";

/**
 * 投稿封面（1920×1080，无字幕）。风格参考 YouTube/B 站高点击技术视频：
 * 纯黑底 + 左侧 2–3 行钩子大字（关键词黄底黑字）+ 右侧占半屏的视觉物（这一集真实出现的图/代码/数字），
 * 左上系列名、右上集号，不放副标题。缩到手机上的 320px 宽也要一眼认出。
 *
 * 每集的定制封面写在 src/covers/CoverEpK.tsx，用这里的部件拼；没写的集用 <Cover k> 兜底（左边集名，右边空）。
 */
export const K = { bg: "#0b0b0d", yellow: "#ffd400", red: "#ff5c5c", pink: "#ff5c8a", cyan: "#9fe3ff", green: "#3ddc97", dim: "#8a8f9a" };

/** 黄底黑字高亮块 */
export const Hl: React.FC<{ children: React.ReactNode; mono?: boolean }> = ({ children, mono }) => (
  <span style={{ background: K.yellow, color: K.bg, padding: "0 18px", borderRadius: 10, display: "inline-block", fontFamily: mono ? MONO : undefined, letterSpacing: mono ? 0 : undefined }}>{children}</span>
);

/** 封面骨架：series 系列名，ep 集号，hook 左侧大字（每行一个元素），visual 右侧视觉物，note 左下一行小字（可选） */
export const CoverFrame: React.FC<{
  series?: string; ep?: string; hook: React.ReactNode[]; hookSize?: number; visual?: React.ReactNode; note?: string; leftWidth?: number;
}> = ({ series, ep, hook, hookSize = 150, visual, note, leftWidth = 900 }) => (
  <AbsoluteFill style={{ background: K.bg, fontFamily: FONT, color: "#fff" }}>
    {series && <div style={{ position: "absolute", left: 70, top: 52, fontSize: 42, fontWeight: 800, color: K.pink, letterSpacing: 2 }}>{series}</div>}
    {ep && <div style={{ position: "absolute", right: 70, top: 48, fontSize: 44, fontWeight: 900, color: K.bg, background: "#fff", padding: "6px 24px", borderRadius: 10 }}>{ep}</div>}
    <div style={{ position: "absolute", left: 70, top: 150, bottom: note ? 150 : 80, width: leftWidth, display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
      {hook.map((line, i) => (
        <div key={i} style={{ fontSize: hookSize, fontWeight: 900, lineHeight: 1.05, letterSpacing: -2 }}>{line}</div>
      ))}
    </div>
    {visual && (
      <div style={{ position: "absolute", left: leftWidth + 110, right: 60, top: 140, bottom: 60, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {visual}
      </div>
    )}
    {note && <div style={{ position: "absolute", left: 70, bottom: 64, fontSize: 46, fontWeight: 700, color: "#b5b5b5" }}>{note}</div>}
  </AbsoluteFill>
);

/** 右侧常用视觉：一段代码（大字号，关键行可高亮） */
export const CodeVisual: React.FC<{ lines: string[]; hl?: number[]; strike?: number[]; size?: number }> = ({ lines, hl = [], strike = [], size = 46 }) => (
  <div style={{ fontFamily: MONO, fontSize: size, lineHeight: 1.6, borderLeft: `8px solid ${K.yellow}`, paddingLeft: 36, width: "100%" }}>
    {lines.map((l, i) => (
      <div key={i} style={{ color: strike.includes(i) ? "#666" : hl.includes(i) ? K.yellow : K.cyan, textDecoration: strike.includes(i) ? "line-through" : undefined, whiteSpace: "pre" }}>{l}</div>
    ))}
  </div>
);

/** 右侧常用视觉：一个巨大的数字 + 说明 */
export const BigNumber: React.FC<{ value: string; label: string; color?: string }> = ({ value, label, color = K.yellow }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontFamily: MONO, fontSize: 260, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
    <div style={{ marginTop: 20, fontSize: 52, color: K.dim, fontWeight: 700 }}>{label}</div>
  </div>
);

/** 兜底封面：没有定制封面的集用它 */
export const Cover: React.FC<{ k: number }> = ({ k }) => {
  const eps = (timeline as any).episodes as { title: string }[];
  const title: string = eps[k - 1]?.title ?? (timeline as any).title;
  const [a, b] = title.split(/[：:]/);
  return (
    <CoverFrame series={(timeline as any).series ?? (timeline as any).title} ep={`EP${k}`} leftWidth={1700}
      hook={b ? [a, <Hl>{b}</Hl>] : [<Hl>{a}</Hl>]} hookSize={120} />
  );
};
