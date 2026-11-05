import React from "react";
// 每集定制封面：在本目录写 CoverEpK.tsx（用 ../lib/Cover 的 CoverFrame / Hl / CodeVisual / BigNumber 拼），
// 再在这里登记，例如：import { CoverEp1 } from "./CoverEp1";  export const COVERS = { 1: CoverEp1 };
// 没登记的集用兜底封面。
export const COVERS: Record<number, React.FC> = {};
