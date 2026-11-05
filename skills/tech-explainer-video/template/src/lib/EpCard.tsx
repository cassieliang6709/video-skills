import React from "react";
import { AbsoluteFill } from "remotion";
import timeline from "../timeline.json";
import { useBeat } from "./beat";
import { C, MONO } from "./theme";

type Ep = { id: string; title: string; chapters: string[] };
const chTitle = (id: string) => timeline.chapters.find((c) => c.id === id)?.title ?? id;
const isCta = (t: string) => /点赞|关注/.test(t);

/** 三连卡：点赞 / 投币 / 收藏 / 关注，跟着旁白依次亮起 */
const Cta: React.FC<{ beat: number; note?: string }> = ({ beat, note }) => {
  const { on, len } = useBeat();
  const items = [["👍", "点赞"], ["🪙", "投币"], ["⭐", "收藏"], ["＋", "关注"]];
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column", gap: 56 }}>
      <div style={{ display: "flex", gap: 56 }}>
        {items.map(([icon, label], i) => {
          const a = on(beat, 14, (len(beat) * 0.15) + i * (len(beat) * 0.12));
          return (
            <div key={label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18, opacity: 0.25 + 0.75 * a, transform: `scale(${0.85 + 0.15 * a})` }}>
              <div style={{ width: 170, height: 170, borderRadius: 999, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 84, color: C.text, fontWeight: 900,
                background: `color-mix(in srgb, ${C.accent} ${Math.round(10 + 30 * a)}%, ${C.panel})`, border: `3px solid ${a > 0.5 ? C.accent : C.line}`,
                boxShadow: a > 0.5 ? `0 0 ${40 * a}px ${C.accent}88` : "none" }}>{icon}</div>
              <div style={{ fontSize: 38, fontWeight: 800 }}>{label}</div>
            </div>
          );
        })}
      </div>
      {note && <div style={{ fontSize: 30, color: C.dim, opacity: on(beat, 20, len(beat) * 0.6) }}>{note}</div>}
    </AbsoluteFill>
  );
};

/** 片头 / 片尾卡：epK_start = 第 K 集 + 本集目录；epK_end = 本集小结 + 下一集 + 三连 */
export const makeEpCard = (id: string): React.FC => () => {
  const { on, beat, len } = useBeat();
  const m = id.match(/^ep(\d+)_(start|end)$/)!;
  const k = Number(m[1]);
  const eps = ((timeline as any).episodes ?? []) as Ep[];
  const ep = eps[k - 1];
  const next = eps[k];
  const beats = timeline.chapters.find((c) => c.id === id)!.beats;
  const sections = (ep?.chapters ?? []).filter((c) => /^ch\d+$/.test(c) && c !== "ch0").map(chTitle);
  const ctaBeat = beats.findIndex((b) => isCta(b.text));
  if (ctaBeat >= 0 && beat >= ctaBeat) {
    return <Cta beat={ctaBeat} note={next ? `下一集：${next.title}` : "下个系列：FlashAttention · PagedAttention"} />;
  }
  const isStart = m[2] === "start";
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", flexDirection: "column" }}>
      <div style={{ opacity: on(0, 20), fontSize: 36, color: C.accent, fontWeight: 700, letterSpacing: 4 }}>{isStart ? `第 ${k} 集` : `第 ${k} 集 · 小结`}</div>
      <div style={{ opacity: on(0, 24, 6), fontSize: 76, fontWeight: 900, marginTop: 18, textAlign: "center", padding: "0 80px" }}>{ep?.title}</div>
      <div style={{ display: "flex", gap: 22, marginTop: 56, flexWrap: "wrap", justifyContent: "center", maxWidth: 1600 }}>
        {sections.map((t, i) => {
          const a = on(0, 16, len(0) * 0.35 + i * (len(0) * 0.5 / Math.max(1, sections.length)));
          return (
            <div key={t} style={{ opacity: a, transform: `translateY(${(1 - a) * 16}px)`, display: "flex", alignItems: "center", gap: 14, padding: "14px 26px", borderRadius: 14,
              background: C.panel, border: `2px solid ${C.line}`, fontSize: 32 }}>
              <span style={{ fontFamily: MONO, color: C.accent, fontWeight: 800 }}>{i + 1}</span>{t}
            </div>
          );
        })}
      </div>
      {!isStart && next && (
        <div style={{ opacity: on(0, 20, len(0) * 0.75), marginTop: 56, fontSize: 32, color: C.dim }}>下一集：<span style={{ color: C.text, fontWeight: 700 }}>{next.title}</span></div>
      )}
    </AbsoluteFill>
  );
};
