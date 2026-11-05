// 示例（不会被渲染，供复制）：系统 02 EP3 的封面
import React from "react";
import { CoverFrame, Hl, K } from "../lib/Cover";
import { MONO } from "../lib/theme";

export const CoverExample: React.FC = () => (
  <CoverFrame series="图解计算机系统" ep="EP3" leftWidth={820} hookSize={150}
    hook={[<>32 个 <Hl>A</Hl></>, "改写了", <span style={{ color: K.red }}>返回地址</span>]}
    note="缓冲区溢出，从栈帧讲起"
    visual={
      <div style={{ width: "100%", fontFamily: MONO, fontSize: 52, display: "grid", gap: 16 }}>
        <div style={{ border: `5px solid ${K.red}`, background: `${K.red}22`, padding: "24px 30px", borderRadius: 14 }}>ret <b style={{ color: K.red }}>0x4141414141</b></div>
        <div style={{ border: `5px solid ${K.yellow}`, background: `${K.yellow}22`, padding: "24px 30px", borderRadius: 14, color: K.yellow }}>AAAAAAAAAAAAAAAA</div>
        <div style={{ border: `5px solid ${K.yellow}`, background: `${K.yellow}22`, padding: "24px 30px", borderRadius: 14, color: K.yellow }}>AAAAAAAAAAAAAAAA</div>
        <div style={{ border: "4px solid #444", padding: "24px 30px", borderRadius: 14, color: "#777" }}>char buf[16]</div>
      </div>
    } />
);
