// 算法讲解通用组件：数组格子、dict 框、trace 表、问题卡片。各章共用。
import React from "react";
import { C, MONO } from "./theme";

export type Tone = "hl" | "ok" | "bad" | "dim" | "accent" | undefined;
const toneColor = (t: Tone) =>
  t === "hl" ? C.yellow : t === "ok" ? C.k : t === "bad" ? C.red : t === "accent" ? C.accent : C.line;

/** 一排数组格子，下方可标下标。tone(i) 决定边框颜色，op(i) 决定透明度。 */
export const Cells: React.FC<{
  vals: (number | string)[]; cell?: number; tone?: (i: number) => Tone; op?: (i: number) => number;
  idx?: boolean; idxLabel?: (i: number) => string; fontSize?: number; style?: React.CSSProperties;
}> = ({ vals, cell = 100, tone, op, idx = true, idxLabel, fontSize, style }) => (
  <div style={{ display: "flex", gap: 10, ...style }}>
    {vals.map((v, i) => {
      const t = tone?.(i);
      const col = toneColor(t);
      return (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", opacity: op ? op(i) : 1 }}>
          <div style={{
            width: cell, height: cell, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center",
            background: t && t !== "dim" ? `${col}22` : C.panel, border: `3px solid ${col}`,
            boxShadow: t === "hl" ? `0 0 22px ${C.yellow}88` : "none",
            fontFamily: MONO, fontSize: fontSize ?? cell * 0.4, color: t === "dim" ? C.faint : C.text,
          }}>{v}</div>
          {idx && <div style={{ marginTop: 8, fontFamily: MONO, fontSize: 26, color: C.dim }}>{idxLabel ? idxLabel(i) : i}</div>}
        </div>
      );
    })}
  </div>
);

/** dict / set 框：标题 + 若干 key: value 条目。hl 指定高亮条目，newKey 指定刚加入的条目。 */
export const DictBox: React.FC<{
  title: string; entries: [string, string][]; hl?: string; bad?: string; width?: number; style?: React.CSSProperties; empty?: string;
}> = ({ title, entries, hl, bad, width = 460, style, empty = "{ }" }) => (
  <div style={{ width, background: C.panel, borderRadius: 16, border: `2px solid ${C.line}`, padding: "16px 22px", ...style }}>
    <div style={{ fontSize: 28, color: C.dim, marginBottom: 12 }}>{title}</div>
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, minHeight: 56, alignItems: "center" }}>
      {entries.length === 0 && <span style={{ fontFamily: MONO, fontSize: 36, color: C.faint }}>{empty}</span>}
      {entries.map(([k, v]) => {
        const col = k === bad ? C.red : k === hl ? C.k : C.q;
        return (
          <span key={k} style={{
            fontFamily: MONO, fontSize: 36, padding: "8px 18px", borderRadius: 10,
            border: `2px solid ${col}`, background: `${col}22`,
            boxShadow: k === hl || k === bad ? `0 0 18px ${col}` : "none",
          }}>{k}: {v}</span>
        );
      })}
    </div>
  </div>
);

/** trace 表：前 shown 行可见，hl 行高亮。cell 内容是字符串，等宽字体。 */
export const Table: React.FC<{
  cols: string[]; rows: React.ReactNode[][]; shown: number; hl?: number; widths?: number[]; fontSize?: number; bad?: number; style?: React.CSSProperties;
}> = ({ cols, rows, shown, hl, widths, fontSize = 30, bad, style }) => {
  const w = widths ?? cols.map(() => 180);
  const Row: React.FC<{ cells: React.ReactNode[]; head?: boolean; i?: number }> = ({ cells, head, i }) => {
    const isHl = i !== undefined && i === hl;
    const isBad = i !== undefined && i === bad;
    return (
      <div style={{
        display: "flex", borderBottom: `1px solid ${C.line}`,
        background: isBad ? `${C.red}22` : isHl ? `${C.yellow}1c` : "transparent",
        borderLeft: `4px solid ${isBad ? C.red : isHl ? C.yellow : "transparent"}`,
      }}>
        {cells.map((c, j) => (
          <div key={j} style={{
            width: w[j], padding: "10px 14px", fontFamily: head ? undefined : MONO, fontSize: head ? fontSize - 4 : fontSize,
            color: head ? C.dim : C.text, whiteSpace: "nowrap",
          }}>{c}</div>
        ))}
      </div>
    );
  };
  return (
    <div style={{ background: C.panel, borderRadius: 14, border: `1px solid ${C.line}`, overflow: "hidden", ...style }}>
      <Row cells={cols} head />
      {rows.slice(0, shown).map((r, i) => <Row key={i} cells={r} i={i} />)}
    </div>
  );
};

/** 题面 / 问题卡片 */
export const Card: React.FC<{ label?: string; color?: string; children: React.ReactNode; style?: React.CSSProperties; size?: number }> = ({ label, color = C.accent, children, style, size = 34 }) => (
  <div style={{ background: C.panel, borderRadius: 16, border: `2px solid ${color}`, padding: "18px 28px", ...style }}>
    {label && <div style={{ fontSize: 22, color, fontWeight: 700, marginBottom: 8, letterSpacing: 1 }}>{label}</div>}
    <div style={{ fontSize: size, lineHeight: 1.45 }}>{children}</div>
  </div>
);

/** 等宽行内代码 */
export const M: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color }) => (
  <span style={{ fontFamily: MONO, color }}>{children}</span>
);

/** 大红叉 / 绿勾 */
export const Mark: React.FC<{ ok: boolean; size?: number }> = ({ ok, size = 56 }) => (
  <span style={{ color: ok ? C.k : C.red, fontSize: size, fontWeight: 900 }}>{ok ? "✓" : "✗"}</span>
);

/** dict 对象 → 条目列表 */
export const ent = (d: Record<string, number | string>): [string, string][] => Object.entries(d).map(([k, v]) => [k, String(v)]);
