import React from "react";
import katex from "katex";
import "katex/dist/katex.min.css";
import { C, MONO } from "./theme";
import { useBeat } from "./beat";

const KW = new Set(["import", "from", "def", "return", "for", "in", "class", "self", "if", "else", "None", "True", "False", "as", "range", "lambda", "super"]);
const tokenRe = /(#.*$)|("[^"]*"|'[^']*')|(\b\d+(?:\.\d+)?\b)|([A-Za-z_][A-Za-z_0-9]*)(?=\s*\()|([A-Za-z_][A-Za-z_0-9]*)|(\S)/g;

export const highlight = (line: string) => {
  const out: React.ReactNode[] = [];
  let last = 0; let m: RegExpExecArray | null; let k = 0;
  tokenRe.lastIndex = 0;
  while ((m = tokenRe.exec(line))) {
    if (m.index > last) out.push(line.slice(last, m.index));
    const [tok, cm, str, num, fn, id] = m;
    let color = C.text;
    if (cm) color = "#6b7891";
    else if (str) color = "#a5e075";
    else if (num) color = "#f78c6c";
    else if (fn) color = "#82aaff";
    else if (id) color = KW.has(id) ? "#c792ea" : id === "torch" || id === "F" || id === "nn" ? "#ffcb6b" : C.text;
    else color = "#89ddff";
    out.push(<span key={k++} style={{ color }}>{tok}</span>);
    last = m.index + tok.length;
  }
  if (last < line.length) out.push(line.slice(last));
  return out;
};

export type CodeLine = { code: string; at: number; out?: string; delay?: number };

/** Code panel whose lines appear (typed) at their beat; output shown after typing. */
export const CodePanel: React.FC<{ lines: CodeLine[]; title?: string; width?: number; fontSize?: number; style?: React.CSSProperties; hideBefore?: boolean }> = ({ lines, title = "python", width = 820, fontSize = 27, style }) => {
  const { t, beat } = useBeat();
  const activeAt = Math.max(...lines.filter((l) => t(l.at) >= (l.delay ?? 0)).map((l) => l.at), -1);
  return (
    <div style={{ width, background: C.panel, borderRadius: 16, border: `1px solid ${C.line}`, boxShadow: "0 20px 60px rgba(0,0,0,.4)", overflow: "hidden", ...style }}>
      <div style={{ display: "flex", gap: 8, padding: "12px 18px", background: C.panel2, alignItems: "center" }}>
        {["#ff5f57", "#febc2e", "#28c840"].map((c) => <div key={c} style={{ width: 13, height: 13, borderRadius: 7, background: c }} />)}
        <div style={{ marginLeft: 12, fontFamily: MONO, fontSize: 18, color: C.dim }}>{title}</div>
      </div>
      <div style={{ padding: "18px 24px", fontFamily: MONO, fontSize, lineHeight: 1.55, minHeight: 60 }}>
        {lines.map((l, i) => {
          const el = t(l.at) - (l.delay ?? 0);
          if (el < 0) return null;
          const n = Math.min(l.code.length, Math.floor(el * 1.6));
          const typing = n < l.code.length;
          const active = l.at === activeAt && beat === l.at;
          return (
            <div key={i}>
              <div style={{ whiteSpace: "pre", background: active ? "rgba(91,155,255,0.10)" : "transparent", margin: "0 -24px", padding: "0 24px", borderLeft: active ? `4px solid ${C.q}` : "4px solid transparent" }}>
                {highlight(l.code.slice(0, n))}
                {typing && <span style={{ background: C.text, display: "inline-block", width: fontSize * 0.55, height: fontSize, verticalAlign: "middle", opacity: 0.7 }} />}
              </div>
              {l.out !== undefined && !typing && (
                <div style={{ whiteSpace: "pre", color: C.yellow, opacity: Math.min(1, (el - l.code.length / 1.6) / 8) }}>{l.out}</div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Fade: React.FC<{ at: number; until?: number; delay?: number; y?: number; style?: React.CSSProperties; children: React.ReactNode }> = ({ at, until, delay = 0, y = 20, style, children }) => {
  const { on } = useBeat();
  const a = on(at, 18, delay);
  const b = until === undefined ? 0 : on(until, 15);
  const o = a * (1 - b);
  if (o <= 0.001) return null;
  return <div style={{ opacity: o, transform: `translateY(${(1 - a) * y}px)`, ...style }}>{children}</div>;
};

export const Tag: React.FC<{ color?: string; children: React.ReactNode; size?: number; style?: React.CSSProperties }> = ({ color = C.accent, children, size = 26, style }) => (
  <span style={{ display: "inline-block", padding: "4px 14px", borderRadius: 8, border: `2px solid ${color}`, color, fontSize: size, fontFamily: MONO, background: `${color}18`, ...style }}>{children}</span>
);

/** Numeric matrix with optional labels; cells colored by value. */
export const Matrix: React.FC<{
  data: number[][]; rowLabels?: string[]; colLabels?: string[]; cell?: number; color?: string;
  digits?: number; reveal?: number; hlRows?: (i: number) => number; hlCell?: (i: number, j: number) => number; max?: number; fontSize?: number; mask?: (i: number, j: number) => boolean; maskText?: string;
}> = ({ data, rowLabels, colLabels, cell = 86, color = C.q, digits = 2, reveal = 1, hlRows, hlCell, max, fontSize, mask, maskText = "" }) => {
  const mx = max ?? Math.max(...data.flat().map(Math.abs), 1e-6);
  const fs = fontSize ?? cell * 0.3;
  return (
    <div style={{ display: "inline-block" }}>
      {colLabels && (
        <div style={{ display: "flex", marginLeft: rowLabels ? 100 : 0 }}>
          {colLabels.map((c, j) => <div key={j} style={{ width: cell, textAlign: "center", color: C.dim, fontSize: 22, marginBottom: 6 }}>{c}</div>)}
        </div>
      )}
      {data.map((row, i) => {
        const hr = hlRows ? hlRows(i) : 0;
        return (
          <div key={i} style={{ display: "flex", alignItems: "center" }}>
            {rowLabels && <div style={{ width: 100, textAlign: "right", paddingRight: 14, fontSize: 26, color: hr > 0.5 ? C.yellow : C.text }}>{rowLabels[i]}</div>}
            {row.map((v, j) => {
              const idx = i * row.length + j;
              const show = Math.max(0, Math.min(1, reveal * data.length * row.length - idx));
              const m = mask?.(i, j);
              const hc = hlCell ? hlCell(i, j) : 0;
              const a = m ? 0 : Math.abs(v) / mx;
              return (
                <div key={j} style={{
                  width: cell - 6, height: cell - 6, margin: 3, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
                  background: m ? "#222836" : `color-mix(in srgb, ${color} ${Math.round(12 + a * 60)}%, ${C.panel})`,
                  border: `2px solid ${hc > 0 || hr > 0 ? C.yellow : "transparent"}`,
                  boxShadow: hc > 0 ? `0 0 ${18 * hc}px ${C.yellow}` : "none",
                  fontFamily: MONO, fontSize: fs, color: m ? C.faint : C.text, opacity: show,
                  transform: `scale(${0.6 + 0.4 * show})`,
                }}>{m ? maskText : v.toFixed(digits)}</div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export const H: React.FC<{ children: React.ReactNode; color?: string }> = ({ children, color = C.yellow }) => <span style={{ color, fontWeight: 700 }}>{children}</span>;

// KaTeX 公式：<Tex>{String.raw`W^{UK}`}</Tex>
export const Tex: React.FC<{ children: string; size?: number; color?: string }> = ({ children, size = 44, color = C.text }) => (
  <span style={{ fontSize: size, color }}
    dangerouslySetInnerHTML={{ __html: katex.renderToString(children, { throwOnError: false, displayMode: false }) }} />
);
