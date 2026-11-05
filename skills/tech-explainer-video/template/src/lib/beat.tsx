import React, { createContext, useContext } from "react";
import { AbsoluteFill, Audio, Easing, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import timeline from "../timeline.json";
import { C, FONT } from "./theme";

export const TITLE_FRAMES = 60;
/** 片头/片尾卡（epK_start / epK_end）没有章节标题卡 */
export const titleFrames = (id: string) => (/^ep\d+_/.test(id) ? 0 : TITLE_FRAMES);
type Cue = { text: string; from: number; to: number };

type Ctx = { frame: number; beat: number; starts: number[]; lens: number[] };
const BeatCtx = createContext<Ctx>({ frame: 0, beat: 0, starts: [0], lens: [1] });

export const chapterFrames = (id: string) => {
  const ch = timeline.chapters.find((c) => c.id === id)!;
  return titleFrames(id) + ch.frames;
};

export const useBeat = () => {
  const c = useContext(BeatCtx);
  /** frames since beat b started (negative before) */
  const t = (b: number) => c.frame - c.starts[Math.min(b, c.starts.length - 1)];
  /** eased 0→1 progress beginning at beat b (+delay frames) */
  const on = (b: number, dur = 18, delay = 0) =>
    interpolate(t(b) - delay, [0, dur], [0, 1], {
      extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.out(Easing.cubic),
    });
  /** fade in at a, fade out at b */
  const span = (a: number, b?: number, dur = 15) => (b === undefined ? on(a, dur) : on(a, dur) * (1 - on(b, dur)));
  return { ...c, t, on, span, len: (b: number) => c.lens[b] };
};

/** 顶部目录：本集的各章（epK_start/end 不列），当前章高亮，之前的打勾 */
const Toc: React.FC<{ id: string; no: number; title: string }> = ({ id, no, title }) => {
  const eps = ((timeline as any).episodes ?? []) as { id: string; chapters: string[] }[];
  const ep = eps.find((e) => e.chapters.includes(id));
  if (no < 0) return null;
  if (!ep || id === "ch0") {
    return (
      <div style={{ position: "absolute", left: 60, top: 36, fontSize: 24, color: C.dim, letterSpacing: 1 }}>
        <span style={{ color: C.accent, fontWeight: 700 }}>{no === 0 ? (timeline as any).title ?? "" : `第 ${no} 章`}</span>
        {no > 0 && <><span style={{ margin: "0 12px", color: C.faint }}>|</span>{title}</>}
      </div>
    );
  }
  const k = eps.indexOf(ep) + 1;
  const items = ep.chapters.filter((c) => !/^ep\d+_/.test(c) && c !== "ch0").map((c) => timeline.chapters.find((x) => x.id === c)!);
  const cur = items.findIndex((c) => c.id === id);
  return (
    <div style={{ position: "absolute", left: 48, right: 48, top: 22, height: 48, display: "flex", alignItems: "center", gap: 10, fontSize: 21, whiteSpace: "nowrap" }}>
      <span style={{ color: C.accent, fontWeight: 800, marginRight: 6 }}>EP{k}</span>
      {items.map((c, i) => {
        const state = i < cur ? "done" : i === cur ? "cur" : "todo";
        return (
          <React.Fragment key={c.id}>
            {i > 0 && <span style={{ width: 18, height: 2, background: i <= cur ? C.accent : C.line, display: "inline-block" }} />}
            <span style={{
              padding: "5px 14px", borderRadius: 999,
              border: `1.5px solid ${state === "cur" ? C.accent : state === "done" ? C.line : C.line}`,
              background: state === "cur" ? `${C.accent}33` : "transparent",
              color: state === "cur" ? C.text : state === "done" ? C.dim : "#6f7a90",
              fontWeight: state === "cur" ? 700 : 500,
            }}>{state === "done" ? "✓ " : ""}{c.title}</span>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export const Chapter: React.FC<{ id: string; no: number; children: React.ReactNode }> = ({ id, no, children }) => {
  const ch = timeline.chapters.find((c) => c.id === id)!;
  const f = useCurrentFrame();
  const TF = titleFrames(id);
  const frame = f - TF;
  const starts = ch.beats.map((b) => b.from);
  const lens = ch.beats.map((b) => b.frames);
  let beat = 0;
  starts.forEach((s, i) => { if (frame >= s) beat = i; });
  const titleOp = TF === 0 ? 0 : interpolate(f, [0, 12, TF - 12, TF], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const contentOp = TF === 0 ? 1 : interpolate(f, [TF - 10, TF + 5], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const cur = ch.beats[beat];
  const local = frame - cur.from;
  const cues: Cue[] = (cur as any).cues ?? [{ text: cur.text, from: 0, to: cur.frames }];
  const cue = cues.find((c, i) => local < (i + 1 < cues.length ? cues[i + 1].from : c.to + 8)) ?? cues[cues.length - 1];
  const subOp = interpolate(local, [cue.from, cue.from + 4, cue.to + 4, cue.to + 8], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })
    * (cues.indexOf(cue) > 0 ? 1 : interpolate(local, [0, 4], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: FONT, color: C.text }}>
      <AbsoluteFill style={{ background: "radial-gradient(1200px 700px at 30% 0%, #1a2240 0%, transparent 70%)" }} />
      {ch.beats.map((b, i) => (
        <Sequence key={i} from={TF + b.from} durationInFrames={b.frames}>
          <Audio src={staticFile(b.audio)} />
        </Sequence>
      ))}
      <AbsoluteFill style={{ opacity: contentOp }}>
        <BeatCtx.Provider value={{ frame, beat, starts, lens }}>{children}</BeatCtx.Provider>
        <Toc id={id} no={no} title={ch.title} />
        {frame >= 0 && (
          <div style={{ position: "absolute", left: 0, right: 0, bottom: 34, display: "flex", justifyContent: "center", opacity: subOp }}>
            <div style={{ maxWidth: 1500, padding: "10px 26px", borderRadius: 10, background: "rgba(8,10,16,0.78)", fontSize: 36, lineHeight: 1.4, textAlign: "center", whiteSpace: "nowrap" }}>
              {cue.text}
            </div>
          </div>
        )}
      </AbsoluteFill>
      {/* 章节标题卡：与封面同一套视觉——纯黑底、黄底黑字章号、白色粗体大标题 */}
      <AbsoluteFill style={{ opacity: titleOp, justifyContent: "center", alignItems: "center", flexDirection: "column", background: "#0b0b0d" }}>
        <div style={{ fontSize: 44, fontWeight: 900, color: "#0b0b0d", background: "#ffd400", padding: "6px 26px", borderRadius: 10, marginBottom: 30 }}>{no === 0 ? (timeline as any).subtitle ?? "" : `第 ${no} 章`}</div>
        <div style={{ fontSize: 96, fontWeight: 900, letterSpacing: -2, textAlign: "center", padding: "0 120px", lineHeight: 1.15 }}>{no === 0 ? (timeline as any).title ?? ch.title : ch.title}</div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
