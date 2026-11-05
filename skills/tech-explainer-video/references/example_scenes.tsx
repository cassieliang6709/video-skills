// 参考用：MLA 那期（从 GQA 到 MLA）第 4–7 章的场景，来自 github.com/cassieliang6709/video-bilibili。
// 旧框架（帧数 + Appear + TimeScale），不能直接放进 template 运行；只借鉴构图和动画思路。
// 第 4–7 章：MLA 压缩、矩阵吸收、RoPE 冲突、解耦 RoPE
import React from "react";
import { interpolate } from "remotion";
import { Appear, C, Caption, Cell, ramp, Row, Scene, Tex, usePop, useCurrentFrame } from "../ui";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// ---------------- 第 4 章 MLA 压缩 ----------------
export const S4Compress: React.FC = () => {
  const frame = useCurrentFrame();
  const h = [1, 0, 2, 1];
  const into = ramp(frame, 60, 40); // h 飞进漏斗
  const cPop = usePop(110);
  const k1 = usePop(230);
  const k2 = usePop(260);
  return (
    <Scene chapter="第 4 章" title="MLA：先压缩，再解压">
      <div style={{ padding: "0 100px" }}>
        <Appear at={5}>
          <Tex size={46}>{String.raw`c^{KV}_t = W^{DKV}h_t,\qquad k^C_t = W^{UK}c^{KV}_t,\qquad v^C_t = W^{UV}c^{KV}_t`}</Tex>
        </Appear>
        <Row gap={50} style={{ marginTop: 60, alignItems: "center" }}>
          {/* 原始 h */}
          <div style={{ width: 170 }}>
            <div style={{ fontSize: 30, color: C.dim, marginBottom: 10 }}>h（4 维）</div>
            {h.map((v, i) => (
              <Cell
                key={i}
                v={v}
                size={80}
                style={{
                  marginBottom: 10,
                  transform: `translateX(${into * 220}px) scale(${1 - into * 0.6})`,
                  opacity: 1 - into,
                }}
              />
            ))}
          </div>
          {/* 漏斗 */}
          <svg width="200" height="380" style={{ opacity: ramp(frame, 20) }}>
            <polygon points="0,20 200,120 200,260 0,360" fill={C.panel} stroke={C.purple} strokeWidth="4" />
            <text x="100" y="200" fill={C.purple} fontSize="32" textAnchor="middle">下投影</text>
          </svg>
          {/* 缓存抽屉 */}
          <div
            style={{
              border: `4px dashed ${C.yellow}`,
              borderRadius: 20,
              padding: 24,
              opacity: ramp(frame, 100),
            }}
          >
            <div style={{ fontSize: 30, color: C.yellow, marginBottom: 12 }}>KV Cache（只存这个）</div>
            <Row gap={14} style={{ transform: `scale(${cPop})` }}>
              <Cell v={3} color={C.yellow} />
              <Cell v={1} color={C.yellow} />
            </Row>
          </div>
          {/* 解压到两个头 */}
          <div style={{ marginLeft: 30 }}>
            <Row gap={20} style={{ marginBottom: 40, opacity: k1 }}>
              <Tex size={34}>{String.raw`W^{UK}_1=[1,\,0]`}</Tex>
              <span style={{ fontSize: 40 }}>→</span>
              <Cell v={3} color={C.blue} />
              <span style={{ fontSize: 30 }}>头 1</span>
            </Row>
            <Row gap={20} style={{ opacity: k2 }}>
              <Tex size={34}>{String.raw`W^{UK}_2=[0,\,2]`}</Tex>
              <span style={{ fontSize: 40 }}>→</span>
              <Cell v={2} color={C.green} />
              <span style={{ fontSize: 30 }}>头 2</span>
            </Row>
          </div>
        </Row>
        <Appear at={330} style={{ marginTop: 50, fontSize: 36, color: C.dim }}>
          对比 GQA：同组的头 key 必须相同。这里同一份缓存解压出了<span style={{ color: C.green }}>不同</span>的 key。
        </Appear>
      </div>
      <Caption at={400}>缓存 512 个数，而不是 MHA 的 32768 个</Caption>
    </Scene>
  );
};

// ---------------- 第 5 章 矩阵吸收 ----------------
export const S5Absorb: React.FC = () => {
  const frame = useCurrentFrame();
  const partB = frame >= 260;
  const N = 10;
  // 朴素写法：一个一个解压
  const naiveDone = Math.floor(interpolate(frame, [300, 560], [0, N], clamp));
  // 吸收写法：翻译一次 query，然后同时连线
  const translated = ramp(frame, 300, 30);
  const linked = ramp(frame, 340, 30);
  return (
    <Scene chapter="第 5 章" title="矩阵吸收：解压这一步可以消失">
      {!partB && (
        <div style={{ padding: "20px 120px" }}>
          <Appear at={10}>
            <Tex size={46}>{String.raw`\text{score}_{t,s,i} = (W^{UQ}_i c^Q_t)^\top (W^{UK}_i c^{KV}_s)`}</Tex>
          </Appear>
          <Appear at={70} style={{ marginTop: 40 }}>
            <Tex size={46}>{String.raw`= (c^Q_t)^\top \underbrace{(W^{UQ}_i)^\top W^{UK}_i}_{\text{只和权重有关}}\, c^{KV}_s`}</Tex>
          </Appear>
          <Appear at={150} style={{ marginTop: 50 }}>
            <Tex size={46} color={C.green}>{String.raw`o_{t,i} = W^{UV}_i\Big(\textstyle\sum_s a_{t,s,i}\,c^{KV}_s\Big)`}</Tex>
          </Appear>
          <Appear at={200} style={{ marginTop: 40, fontSize: 40, color: C.yellow }}>
            结合律 + 分配律 → K、V 从头到尾都不需要算出来
          </Appear>
        </div>
      )}
      {partB && (
        <Row gap={0} style={{ padding: "10px 80px", alignItems: "flex-start" }}>
          {/* 左：朴素 */}
          <div style={{ width: 860 }}>
            <div style={{ fontSize: 40, color: C.red, marginBottom: 20 }}>朴素：先解压，再点积</div>
            <Row gap={12} style={{ flexWrap: "wrap", width: 760 }}>
              {Array.from({ length: N }).map((_, i) => (
                <Cell
                  key={i}
                  v={i < naiveDone ? "k" : "c"}
                  size={110}
                  color={i < naiveDone ? C.red : C.yellow}
                />
              ))}
            </Row>
            <div style={{ fontSize: 36, marginTop: 30 }}>已解压：{naiveDone} / {N}（真实场景是 10 万次）</div>
            <Appear at={580} style={{ marginTop: 20 }}>
              <Tex size={40}>{String.raw`q_1\cdot k_1 = 2\times3 = 6`}</Tex>
            </Appear>
          </div>
          {/* 右：吸收 */}
          <div style={{ width: 860 }}>
            <div style={{ fontSize: 40, color: C.green, marginBottom: 20 }}>吸收：只"翻译"一次 query</div>
            <Row gap={30}>
              <Cell v="q" size={110} color={translated > 0.5 ? C.green : C.blue} style={{ transform: `rotate(${translated * 360}deg)` }} />
              <div style={{ fontSize: 30, opacity: translated }}>
                <Tex size={34}>{String.raw`\tilde q_1=(W^{UK}_1)^\top q_1=[2,0]`}</Tex>
              </div>
            </Row>
            <Row gap={12} style={{ flexWrap: "wrap", width: 760, marginTop: 30 }}>
              {Array.from({ length: N }).map((_, i) => (
                <Cell key={i} v="c" size={80} color={C.yellow} style={{ boxShadow: `0 0 ${linked * 30}px ${C.green}` }} />
              ))}
            </Row>
            <Appear at={380} style={{ marginTop: 30 }}>
              <Tex size={40}>{String.raw`\tilde q_1\cdot c = 2\times3+0\times1 = 6`}</Tex>
            </Appear>
          </div>
        </Row>
      )}
      <Caption at={partB ? 600 : 9999}>数学上等价，代价完全不同。推理时的 MLA ≈ head_dim = 512 的 MQA</Caption>
    </Scene>
  );
};

// ---------------- 第 6 章 RoPE 冲突 ----------------
const Clock: React.FC<{ deg: number; color: string; label: string }> = ({ deg, color, label }) => {
  const rad = (deg * Math.PI) / 180;
  // 0° 指向右边，逆时针旋转（数学方向）
  const x = 150 + 110 * Math.cos(rad);
  const y = 150 - 110 * Math.sin(rad);
  return (
    <div style={{ textAlign: "center" }}>
      <svg width="300" height="300">
        <circle cx="150" cy="150" r="130" fill={C.panel} stroke={C.dim} strokeWidth="3" />
        <line x1="150" y1="150" x2={x} y2={y} stroke={color} strokeWidth="12" strokeLinecap="round" />
        <circle cx="150" cy="150" r="10" fill={color} />
      </svg>
      <div style={{ fontSize: 34, color }}>{label}</div>
    </div>
  );
};

export const S6RoPE: React.FC = () => {
  const frame = useCurrentFrame();
  const partB = frame >= 330;
  // 先把 q 转到位置 1，k 转到位置 3；之后两者一起再多转 5 步
  const shift = interpolate(frame, [200, 280], [0, 5], clamp);
  const qPos = interpolate(frame, [40, 80], [0, 1], clamp) + shift;
  const kPos = interpolate(frame, [80, 140], [0, 3], clamp) + shift;
  const qa = qPos * 90;
  const ka = kPos * 90;
  const dot = Math.cos(((ka - qa) * Math.PI) / 180);
  return (
    <Scene chapter="第 6 章" title="RoPE 的冲突">
      {!partB && (
        <div style={{ padding: "0 140px" }}>
          <Appear at={5}>
            <Tex size={46}>{String.raw`(R_m q)^\top(R_n k) = q^\top R_{n-m}\,k`}</Tex>
          </Appear>
          <Row gap={100} style={{ marginTop: 40, justifyContent: "center" }}>
            <Clock deg={qa} color={C.blue} label={`q：位置 ${qPos.toFixed(0)}`} />
            <Clock deg={ka} color={C.orange} label={`k：位置 ${kPos.toFixed(0)}`} />
            <div>
              <div style={{ fontSize: 34, color: C.dim }}>相对位置</div>
              <div style={{ fontSize: 80, fontWeight: 800 }}>{(kPos - qPos).toFixed(0)}</div>
              <div style={{ fontSize: 34, color: C.dim, marginTop: 20 }}>点积</div>
              <div style={{ fontSize: 80, fontWeight: 800, color: C.yellow }}>{dot.toFixed(0)}</div>
            </div>
          </Row>
        </div>
      )}
      {partB && (
        <div style={{ padding: "40px 140px" }}>
          <Appear at={335}>
            <Tex size={50}>{String.raw`(c^Q_t)^\top (W^{UQ}_i)^\top\ \boxed{R_{s-t}}\ W^{UK}_i\, c^{KV}_s`}</Tex>
          </Appear>
          <Appear at={390} style={{ marginTop: 60, fontSize: 42 }}>
            旋转矩阵<span style={{ color: C.red }}>夹在两个权重中间</span>，而且随位置变化
          </Appear>
          <Appear at={440} style={{ marginTop: 30, fontSize: 42 }}>
            矩阵乘法没有交换律 → <span style={{ color: C.red }}>无法提前合并</span> → 吸收失效
          </Appear>
        </div>
      )}
      <Caption at={partB ? 480 : 290}>{partB ? "每份档案的时间戳都不同，问题得翻译 10 万次" : "一起转 5 步：夹角不变，点积不变"}</Caption>
    </Scene>
  );
};

// ---------------- 第 7 章 解耦 RoPE ----------------
const Seg: React.FC<{ w: number; color: string; text: React.ReactNode; t: number }> = ({ w, color, text, t }) => (
  <div
    style={{
      width: w * t,
      height: 80,
      background: color,
      color: C.bg,
      fontSize: 32,
      fontWeight: 700,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
      whiteSpace: "nowrap",
    }}
  >
    {text}
  </div>
);

export const S7Decouple: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <Scene chapter="第 7 章" title="解耦 RoPE：内容和位置分开走">
      <div style={{ padding: "0 140px" }}>
        <Row gap={30} style={{ marginTop: 20 }}>
          <div style={{ width: 80, fontSize: 40 }}>q</div>
          <Seg w={800} color={C.blue} text={<><Tex size={34} color={C.bg}>{"q^C"}</Tex>　内容（可吸收）</>} t={ramp(frame, 20, 25)} />
          <Seg w={200} color={C.yellow} text={<><Tex size={34} color={C.bg}>{"q^R"}</Tex>　位置</>} t={ramp(frame, 50, 20)} />
        </Row>
        <Row gap={30} style={{ marginTop: 30 }}>
          <div style={{ width: 80, fontSize: 40 }}>k</div>
          <Seg w={800} color={C.blue} text={<><Tex size={34} color={C.bg}>{"k^C"}</Tex>　来自 <Tex size={34} color={C.bg}>{"c^{KV}"}</Tex></>} t={ramp(frame, 80, 25)} />
          <Seg w={200} color={C.yellow} text={<><Tex size={34} color={C.bg}>{"k^R"}</Tex>　共享</>} t={ramp(frame, 110, 20)} />
        </Row>
        <Appear at={150} style={{ marginTop: 50 }}>
          <Tex size={46}>{String.raw`\text{score}=\frac{(q^C_{t,i})^\top k^C_{s,i} + (q^R_{t,i})^\top k^R_s}{\sqrt{d_h+d_h^R}}`}</Tex>
        </Appear>
        <Appear at={220} style={{ marginTop: 30, fontSize: 36, color: C.dim }}>
          所有头共享同一个 k^R —— 这一小段就是 MQA。缩放除以 √192，不是 √128。
        </Appear>
        <Row gap={0} style={{ marginTop: 50 }}>
          <Seg w={1024} color={C.blue} text={<><Tex size={34} color={C.bg}>{"c^{KV}"}</Tex>：512</>} t={ramp(frame, 280, 30)} />
          <Seg w={128} color={C.yellow} text="64" t={ramp(frame, 320, 15)} />
          <div style={{ fontSize: 60, fontWeight: 800, marginLeft: 30, opacity: ramp(frame, 340) }}>= 576</div>
        </Row>
      </div>
      <Caption at={360}>档案正文不盖时间戳，只在上面贴一张"页码便签"</Caption>
    </Scene>
  );
};
