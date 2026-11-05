import React from "react";
import { C, MONO } from "./theme";

export const BW = 10, BH = 34, BG = 2, SP = 6;
export const shelfW = (books: number) => books * (BW + BG) - BG + SP * 2;
export const bookColor = (l: number, f: number, alpha = 1) => {
  const hue = l === 0 ? 215 : 340;
  const light = [52, 64, 78, 58, 70, 46, 62, 74][f % 8];
  return `hsla(${hue}, 85%, ${light}%, ${alpha})`;
};

type HL = (l: number, f: number, s: number, b: number) => number; // 0 dim .. 1 normal .. 2 highlight

/** One building: floors stacked bottom-up. */
export const Building: React.FC<{
  l: number; floors: number; shelves: number; books: number; x: number; y: number;
  hl?: HL; shelfGap?: number; merge?: number; ghost?: (f: number) => number; label?: string; outline?: number; floorLabel?: boolean;
}> = ({ l, floors, shelves, books, x, y, hl, shelfGap = 8, merge = 0, ghost, label, outline = 0, floorLabel = true }) => {
  const sw = shelfW(books);
  const gap = shelfGap * (1 - merge);
  const fw = shelves * sw + (shelves - 1) * gap + 32;
  const fh = BH + 18;
  const roofH = 46;
  const H = floors * (fh + 10) + roofH;
  return (
    <g transform={`translate(${x},${y})`}>
      <path d={`M ${-10} ${roofH} L ${fw / 2} 6 L ${fw + 10} ${roofH} Z`} fill={C.panel2} stroke={outline > 0 ? C.yellow : C.line} strokeWidth={2 + outline * 2} />
      {label && <text x={fw / 2} y={roofH - 10} textAnchor="middle" fontSize={22} fill={C.text}>{label}</text>}
      {Array.from({ length: floors }).map((_, fi) => {
        const f = floors - 1 - fi; // top floor drawn first
        const fy = roofH + 6 + fi * (fh + 10);
        const g = ghost ? ghost(f) : 0;
        return (
          <g key={f} transform={`translate(0,${fy})`} opacity={1}>
            <rect x={0} y={0} width={fw} height={fh} rx={6} fill={g > 0.5 ? "transparent" : C.panel} stroke={g > 0.5 ? C.dim : C.line} strokeDasharray={g > 0.5 ? "8 6" : undefined} strokeWidth={2} />
            {floorLabel && <text x={-14} y={fh / 2 + 8} textAnchor="end" fontSize={20} fill={C.dim} fontFamily={MONO}>{f + 1}F</text>}
            {Array.from({ length: shelves }).map((_, s) => {
              const sx = 16 + s * (sw + gap);
              return (
                <g key={s} transform={`translate(${sx},9)`}>
                  <rect x={0} y={-3} width={sw} height={BH + 6} rx={3} fill="none" stroke={C.faint} strokeOpacity={1 - merge} strokeWidth={1.5} />
                  {Array.from({ length: books }).map((_, b) => {
                    const h = hl ? hl(l, f, s, b) : 1;
                    const base = g > 0.5 ? 0.18 : 1;
                    return (
                      <rect key={b} x={SP + b * (BW + BG)} y={0} width={BW} height={BH} rx={2}
                        fill={h >= 2 ? C.yellow : bookColor(l, f, base * (h <= 0 ? 0.18 : 1))}
                        stroke={h >= 2 ? "#fff" : "none"} strokeWidth={1.5} />
                    );
                  })}
                </g>
              );
            })}
          </g>
        );
      })}
      <rect x={-6} y={roofH} width={fw + 12} height={H - roofH + 4} rx={8} fill="none" stroke={C.yellow} strokeOpacity={outline} strokeWidth={4} />
    </g>
  );
};

export const buildingSize = (floors: number, shelves: number, books: number, shelfGap = 8) => ({
  w: shelves * shelfW(books) + (shelves - 1) * shelfGap + 32,
  h: floors * (BH + 28) + 46,
});

/** Linear memory strip. order[i] = (lib, floor) for coloring element at memory slot i. */
export const Corridor: React.FC<{
  n: number; x: number; y: number; width: number; color: (i: number) => string; hl?: (i: number) => number; label?: string; h?: number; ticks?: number[];
}> = ({ n, x, y, width, color, hl, label, h = 44, ticks = [] }) => {
  const cw = width / n;
  return (
    <g transform={`translate(${x},${y})`}>
      {label && <text x={0} y={-12} fontSize={22} fill={C.dim}>{label}</text>}
      <rect x={-4} y={-4} width={width + 8} height={h + 8} rx={6} fill={C.panel} stroke={C.line} />
      {Array.from({ length: n }).map((_, i) => {
        const v = hl ? hl(i) : 1;
        return <rect key={i} x={i * cw} y={0} width={Math.max(cw - 0.8, 0.5)} height={h} fill={v >= 2 ? C.yellow : color(i)} opacity={v <= 0 ? 0.2 : 1} />;
      })}
      {ticks.map((tk) => (
        <g key={tk}>
          <line x1={tk * cw} x2={tk * cw} y1={h + 4} y2={h + 14} stroke={C.dim} />
          <text x={tk * cw} y={h + 34} fontSize={18} fill={C.dim} textAnchor="middle" fontFamily={MONO}>{tk}</text>
        </g>
      ))}
    </g>
  );
};
