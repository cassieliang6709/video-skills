# 封面规范（2026-10-24 用户确认）

参考的是用户挑的高点击技术视频封面（YouTube：Kimi 896 Experts、LoRA Tiny Adapters、Learn from its own MISTAKES；B 站：图解大模型推理、21 分钟注意力机制）。
旧版"渐变底 + 系列名 + 第 K 集 + 长标题"不够吸引人，已废弃。

## 规则
1. **一个钩子，2–6 个字或一个问题**，不是章节标题。例："32 个 A 改写了返回地址""同一个循环，快 3 倍""多人同时问，模型怎么接？"。
2. **一处黄底黑字高亮**（`<Hl>`），只框最关键的词或数字；可以再有一个红字（反常/危险）。
3. **右侧一个大视觉物，占右半屏以上**：这一集真实出现的东西——栈帧、四行代码、一个巨大的数字、一张小图。缩到 320px 宽也要认得出。
4. 左上系列名（粉色，如"图解计算机系统""图解大模型""nudgecode 算法图解"），右上白底集号 `EP3`。
5. 纯黑底 `#0b0b0d`、强对比，不放渐变光晕，不放副标题；最多左下一行小字补充。
6. 不放真人脸、商标 logo（见 compliance）。

## 怎么做
- 组件在 `template/src/lib/Cover.tsx`：`CoverFrame`（骨架）、`Hl`（高亮）、`CodeVisual`（右侧代码）、`BigNumber`（右侧大数字）、`K`（配色）。
  示例：`src/covers/CoverExample.tsx`（系统 02 EP3），Root 里注册为 `cover-example`，`npx remotion still out/bundle cover-example out/x.png` 可看。
- 每集写 `src/covers/CoverEpK.tsx`，在 `src/covers/index.ts` 的 `COVERS` 里登记；没登记的集用兜底 `<Cover k>`（左边集名，冒号后半句标黄，右边空）。
- **大纲阶段**每集就给一行"封面钩子 + 右侧视觉"，和大纲一起让用户审；渲染后把所有封面拼成一张图发给用户。
- 只改封面不用重渲视频：`npx remotion still out/bundle cover-epK out/covers/epK.jpg`。已经上传的要到平台后台手动换。
