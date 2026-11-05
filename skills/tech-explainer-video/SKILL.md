---
name: tech-explainer-video
description: 制作技术讲解视频（可组合二维、三维动画与真实运行的代码、配音和字幕），把技术主题从原理讲到代码实现，按每集 8–12 分钟拆成分集。用户提到做讲解视频、教学视频、动画讲解、把笔记做成视频时使用。流程三道关：大纲 → 逐字稿（用户逐行批注）→ 生成视频，每关都要用户确认。发布到 B 站/抖音/快手/小红书用 video-publish skill。
---

# 技术讲解视频

三道关，**每关都要用户明确说"可以"才进入下一关**。用户全局设置里的"不用确认直接做"不适用于这三道关，这是用户为这个 skill 特别要求的审阅流程。用户说"先别配音/先别做"就停在当前阶段。

默认值（用户没说就按这个，写进 script.md 的 front matter）：
- 受众：**会 Python、相关课程基本忘光了**的大学生。写法按 `references/kepu-style.md`：先具体后抽象，"如果让你来设计"，一张物理图贯穿全片，每集新术语不超过 6 个；寄存器、源码级细节放进每集末尾的"进阶"章
- 目标：看完能用 PyTorch 写出来
- 结构：三部分，数学原理 → 要用到的 PyTorch 工具 → 统一 coding
- 每集内部用"总—分—总"：开头先给本集要回答的问题和小节地图，主体逐节展开（画面角落显示路线图、当前小节高亮），结尾每节一句话收回结论再预告下一集
- 时长：每集 8–12 分钟（2026-10-24 用户改：集数少、投稿少、不易撞平台限额），一个主题通常 2 集，最多 3 集
- 比喻：允许，但只讲一个点：一句话讲完马上回到正题，一个概念最多一个（kepu-style.md 第 5 条）
- 音色：`voice: volc`（火山引擎预置音色 zh_female_vv_uranus_bigtts）；`~/.volc_tts.env` 缺凭证时 tts.py 自动退回 edge-tts 晓伊并提示

## 阶段 0：收集材料
用户提到笔记（如 Obsidian）就先找到并通读，以笔记的结构、结论和数字为准。

## 阶段 1：大纲（在对话里给）
第一行写一句话立项："这期让 X 的人看完能 Y"。每集再给一行**封面钩子 + 右侧视觉**（见 `references/cover-guide.md`），和大纲一起审。
按 `references/outline-template.md` 写简短表格：每章要解决的问题、新概念、落地的代码、时长，以及**分集方案**和**不讲的内容**。
先读 `references/kepu-style.md`。开头、节奏、术语和结尾按 `references/script-guide.md` 里的"开头公式""节奏""术语与门槛""结尾公式"来设计；大纲里就标出每个高潮点放在哪一章。
写数学部分时，先给出要计算的目标（例如 out_i = Σⱼ aᵢⱼ vⱼ），再推出每个组件，让点积、softmax、缩放都是"被需要才出现"。

## 阶段 2：代码 → 逐字稿 → 检查 → 批注 → 定稿
**写稿原则**：先讲设计动机，再讲机制，最后讲结果。优先讲清“原来遇到什么问题 → 设计者想解决什么 → 为什么选这个办法 → 它如何工作”。允许补步骤、例子和必要的精确性，但每次只引入理解当前原理所必需的新概念；新术语第一次出现时，用已有知识或具体例子解释。进阶章按该章预设的知识基础调整。

1. 写教程代码 `py/tutorial.py` 并真实运行，用 `show(key, value)` 导出 `py/values.json`。屏幕上的所有数值、形状、True/False 都从这里来。
   - 小例子要有可解释的含义时，手工设定权重，代码注释和旁白里都说明"手工设定，真实模型靠训练"。
   - 演示"为什么"时用真实对照：例如结合律有无 softmax 的 allclose、缩放前后 softmax 雅可比范数。
2. 按 `references/kepu-style.md` 和 `references/script-guide.md` 写 `script/script.md`（格式见下），过一遍两份自查清单。
   每句“画：”写清观众要看到的变化，以及这幅画帮助理解什么；先确定表达目标，不锁定制作工具。画面可用网页画布、Remotion、Manim、Blender 或更合适的工具实现，具体在定稿后按镜头选择。需要用到数值、代码或形状的画面仍须与 `py/values.json`、`py/tutorial.py` 一致。
   **按集核时长**：每集编号行字数 ÷ 4.5 ÷ 60，再加约 0.5 分钟章节卡和停顿，超过 12 分钟就在这一步调整分集（不要等配完音才发现超长）。
3. 完成初稿后，依次做零基础检查、事实核对和语言润色：
3b. **零基础门槛检查**（必做）：另起一个 agent，只给它 script.md 和一句设定"你会写 Python，本主题的课基本忘光了"，
   不给代码、不给笔记。让它逐句标出：①听不懂的词或推理跳步；②一句中引入太多新东西、需要倒回去重看的地方；③画面描述和旁白对不上的地方。
   要求指出**具体缺哪一步解释**，尤其检查能否顺着“问题 → 设计动机 → 机制 → 结果”听懂。可以建议补步骤、例子或必要的精确性，但不要为补细节引入与主线无关的新概念。逐条修改后，用相同条件再检查，直到没有①②类标记；③类也须修正。记录修改清单，发稿时一并给用户。进阶章按该章预设的知识基础检查。
3c. **事实核对**（必做）：另起一个 agent，给它 script.md 和笔记，只标事实错误或会造成错误理解的说法，并说明依据；不要求补充知识点、边界条件或额外细节。允许教学性简化；如果观众可能把简化说法当成严格定义，就在旁白里简短说明“这里做了简化”。修正时优先换成同样简单但准确的说法，不堆限定语。与 3b 冲突时，寻找既准确又好懂的表达；不能保留事实错误，也不要让精确性盖过讲解主线。事实修改影响了理解或画面时，重做相应的 3b 检查。
3d. 用 `humanizer-zh` skill 逐句润色编号行和"读："行（去 AI 味）。保留数值、术语、代码和"画："行的含义，**不擅自增删知识点**。润色后复核代码结果、画面描述和旁白是否一致，并重新核算每集时长。
4. 把文件发给用户（SendUserFile），请用户在句子下面用 `>` 开头写批注（Obsidian 的 `> [!批注]` 也行）。
   想在 Obsidian 里批注就复制到用户 vault，改完再读回。
5. 处理批注：逐条改 → 删掉已处理的批注行 → 在对话里列出每条怎么改的 → 再请用户看，直到用户说定稿。
6. 定稿前**不配音、不制作正式画面**。为验证复杂镜头能否实现，可以做短小样；小样不替代逐字稿审阅。

### script.md 格式
```markdown
---
title: Attention → MHA → GQA
subtitle: 从数学原理到 PyTorch 实现
audience: 有一定计算机基础的大学生
voice: volc
volc_speaker: zh_female_vv_uranus_bigtts
volc_resource: seed-tts-2.0
episodes: ch0,ch1,ch2,ep1_end | ep2_start,ch3,ch4,ep2_end | ep3_start,ch5,ch6
episode_titles: 第一集标题 | 第二集标题 | 第三集标题
---

## ch0 | 开场
1. 字幕原文，一句一个画面节拍。
   - 读：TTS 念法（和字幕不同时才写；符号写成读法，读 háng 的"行"写成"航"）
   - 画：这一句屏幕上出现什么（必填，画面 agent 照此实现）
> 批注：用户写在这里

## ep1_end | 下集预告
1. 下一集讲……
   - 画：EP1 结束卡
```
- 章节 id：`ch0, ch1, …`；分集的片头/片尾用 `epK_start` / `epK_end`，画面由通用 EpCard 自动生成，新增的句子也要给用户审。
- **总分总**：`epK_start` 写 2–3 句：①本集要回答的问题 ②"这一集讲 N 件事：……"（与本集的章节一一对应）；
  `epK_end` 写 2–3 句：每章一句结论 + 下一集预告。第 1 集的开场章节（ch0）同样要包含本集地图。
  front matter 的 `episodes` 决定地图里有哪些小节，小节名取各章标题。
- 字幕不用手动拆短，tts.py 会按标点拆成 ≤22 字宽的短条。

## 阶段 3：生成视频
逐镜头选择能把原理讲清的制作方式：二维关系、代码和数据可用网页画布、Remotion 或 Manim；空间结构和镜头运动可用 Blender 等三维工具。也可用更合适的新工具，不为使用某个工具增加讲解复杂度。现有 `template/` 是 Remotion 合成与交付管线；其他工具制作的镜头先输出视频或图像素材，验证能接入该管线并保持字幕、配音、节拍同步，再用于正式章节。`references/visual-guide.md` 和 `references/agent-brief.md` 中的组件、路径与命令只适用于 Remotion 章节，其他工具沿用其版式、配色、真实数据和画面自检原则。

1. 把 `template/` 复制到用户指定目录（默认 `~/Videos/<主题>`，先问一句），放入 `py/`、`script/`。
   **依赖只装一份**：系列（多个项目放在同一个父目录，如 `~/Videos/nudgecode-算法/<章>/`）在父目录装一次
   `node_modules`（拷一份 template 的 package.json 过去 `npm install`），各项目 `ln -s ../node_modules node_modules`；单个项目就在项目里装。
   `npm install` 同一时刻只跑一个，并发会把包装坏。装完检查 `node_modules/react-dom/index.js` 存在（npm 缓存里这个包坏过，缺文件就从别的项目拷一份同版本的）。
2. `python3 tools/md2json.py`（有未处理批注会拒绝）→ `python3 tools/scaffold.py` → `python3 tools/tts.py`
   生成 `public/audio/*`、`src/timeline.json`，配音会缓存，只重新合成改过的句子。
3. 自己先做开场和第 1 章，确立画风（**先做最难的那个镜头**；节奏、转场参考 `references/plotome-lessons.md`）。Remotion 镜头用 `node tools/stills.mjs ch1 && tools/sheet.sh ch1` 检查；外部工具制作的镜头检查原素材及接入后的合成帧，把预览发给用户看。
   系列里画风已经被用户确认过（例如同系列的第一个项目），就不再单独请用户看，直接继续。
   `stills.mjs` 复用 `out/bundle`（`tools/bundle.mjs`，源文件变了才重新打包），不再每次在 `$TMPDIR` 新建一个 ~90 MB 的打包目录。
4. 用户认可后，其余章节分给多个 agent **在一条消息里同时启动**（每个 1–2 章）：
   - Remotion 章节：把 `references/agent-brief.md` 填好写成项目根目录的 `AGENT_BRIEF.md`，把 `references/visual-guide.md` 复制成 `VISUAL_GUIDE.md`。外部工具镜头另写简短任务说明，约定素材格式、时长、文件位置和接入 Remotion 的责任，不套用只允许改 `ChN.tsx` 的限制。
   - 改了旁白就给相关 agent 发 SendMessage，说明哪几句变了、timeline 已更新。
5. 所有章节回来后，主会话逐章检查合成帧：重叠、压字幕、画面和"画："是否一致、数值是否来自 values.json；外部素材还要检查导入后的时长与节拍。
6. `npx tsc` 通过后，后台运行 `tools/render.sh`：逐集输出 `out/epK.mp4` + `out/epK.srt` + `out/covers/epK.jpg`，并标准化到 -16 LUFS，每分钟视频约需 1 分钟渲染。
   **渲染期间不要动音频和代码**：混音在最后一步才读音频，中途覆盖会把新旧音频混在一起。
   render.sh 用全机锁（`lockf /tmp/remotion-render.lock`）保证同一时刻只渲染一集：几个项目同时渲染不会更快（CPU 已满），
   只会多占内存和磁盘。多个项目可以同时启动 render.sh，它们会自动排队。
7. 封面：按 `references/cover-guide.md` 每集写 `src/covers/CoverEpK.tsx` 并在 `src/covers/index.ts` 登记（黑底、钩子大字 + 黄底高亮、右侧大视觉）；render.sh 会自动出 `out/covers/epK.jpg`，没登记的集用兜底版。把所有封面拼成一张图发给用户看。单独重出：`npx remotion still out/bundle cover-epK out/covers/epK.jpg`。
8. 交付：用 SendUserFile 发各集 mp4、srt、封面和 `py/tutorial.py`。请用户自己读一遍 srt，往往能发现问题。
9. 需要发布时，转到 `video-publish` skill。发布前过一遍 `references/plotome-lessons.md` 的合规清单（AI 标注、音乐授权、署名）。

## 系列批量制作（多个项目并行）
- 同时开的 session 控制在 3–4 个：开太多会很快撞到用量上限，火山 TTS 也会报并发超限（tts.py 已带退避重试、并发 2）。
- 并行只放在写稿和做画面；渲染交给 render.sh 的全机锁排队。
- 磁盘：每章 `out/bundle` 约 90 MB，截图 `out/check` 几十 MB，成片每集十几 MB。开新一批前看一眼 `df -h`，
  `$TMPDIR/remotion-webpack-bundle-*` 是旧版脚本留下的临时打包，可以清。
- 用户同意"渲完一批 → 直接上传 → 删成片"时，见 `video-publish` 的"批量流水线"。

### 主会话调度流水线（知识库 2026-10-30 ~ 11-03 跑通，两篇一批）
1. **写稿阶段 agent**（每篇一个，两篇同时）：大纲 → tutorial 真实运行导出 values.json → 逐字稿 → 零基础检查（另起 agent，最多 8 轮，之后按最后一轮全改）→ 事实核对（另起 agent 对照笔记）→ humanizer → 按集核时长 → 复制 template、软链 node_modules → md2json / scaffold / tts → 写 AGENT_BRIEF.md、VISUAL_GUIDE.md、共享物理图部件 `src/lib/<名>.tsx`（先定布局常量）→ 做 ch0、ch1。汇报里要列"笔记与实测不符处"。
2. **主会话看 ch0/ch1 拼图**，画风没问题就继续，不再等用户。
3. **画面 fan-out**：把 `references/agent-brief.md` 填成一份共享 brief 写到 `/tmp/claude-501/brief_<篇>.txt`（第二篇用 sed 换路径/部件名/锁名再追加"本项目补充"），
   每个 agent 的 prompt 只有一句"先用 Read 完整读 brief 并严格照做，你负责 chX、chY"，每个 2–3 章，封面交给最后一个 agent。一条消息里同时启动。
4. **收集已知问题**：每个画面 agent 回来时，把它报的"已知问题 / 不在 values.json 的数 / 改后未复看"记下来。
5. **全片复查 agent**（每篇一个，模板 `references/review-brief.md`）：把第 4 步汇总的问题逐条写进"已知待修"。
6. **渲染**：两篇各自后台起 `tools/render.sh`，全机锁自动排队；用一个后台 until 循环等 `out/ep3.mp4` 出现。
7. **抽查**（主会话自己做，不信报告）：每集 `ffmpeg -af volumedetect`（正常 mean 约 −19 dB、max ≤ −1.2 dB）；
   每篇取一集 `-vf "fps=1/60,scale=480:-1,tile=4x3"` 拼一张网格用 Read 看；确认 `out/covers/` 三张都在。
8. **上传**：`out/parts/P<k> <钩子>：<主题>.mp4` 硬链接 + `out/upload_meta.md`（含简介补充一段），再按 `video-publish` 的"追加到已有稿件"排队。传完更新 PROGRESS.md 和看板，把简介段落发给用户。

### 撞用量上限 / 中断
- 用量上限会把正在跑的 agent 全部杀掉。恢复后用 SendMessage 给每个 agent 发"继续"，它带着上下文接着做；不要重开新 agent（会重复劳动、互相覆盖）。
- 同时在跑的 agent 控制在 ~12 个以内（两篇 × 5–6 个画面 agent）。

### 笔记与实测不符
- 知识库笔记（vault）只读。实测和笔记对不上时，视频按实测讲，在汇报里逐条列给用户，由用户决定是否改笔记。

## 定稿后再改
- 改旁白：改 script.md → md2json → tts（只重新合成改过的句子）→ 检查受影响章节的画面。
- 句子数变了会让画面错位：已经做好画面的章节尽量只改措辞，不增删句子；要加内容就加成新的一句章节（如 epK_start）。
- 画面 agent 只按 `visual` 实现，有疑问向主会话汇报，不自行改旁白。

## 音色
- **火山引擎预置音色（默认，`voice: volc`）**：`zh_female_vv_uranus_bigtts`，资源 `seed-tts-2.0`，GQA 那期用户选定的，效果明显好于 edge-tts。
  front matter 不写 `volc_speaker` 就用它。凭证在 `~/.volc_tts.env`（已配好），只需要 `VOLC_APPID` / `VOLC_TOKEN`；可选 `VOLC_SPEED` 语速（1.0 正常）。
- 换音色：front matter 写 `volc_speaker: <音色 ID>`。预置音色自动用 `seed-tts-2.0`；`S_` 开头的复刻音色自动用 `seed-icl-2.0`（或 env 里的 `VOLC_RESOURCE`）。
  也可以用 `volc_resource` 显式指定；写 `v1` 走旧版接口，此时可再设 `VOLC_CLUSTER`（默认 volcano_icl）。
- 用户的复刻音色（env 里的 `VOLC_SPEAKER_ID`，S_ 开头）目前报 `resource ID is mismatched with speaker`，要先在火山控制台确认音色版本、训练状态、所属 appid，跑通前不要用。
- 不打印 env 文件内容。新项目先 `--only` 合成一集里的几句试听，再配全片。
- edge-tts（备选）：`voice: zh-CN-XiaoyiNeural`，其他可选 YunxiNeural、YunyangNeural、XiaoxiaoNeural。火山凭证缺失时 tts.py 自动用晓伊。
- 换音色只需重跑 tts.py，画面按节拍自动对齐，抽查拼图即可。

### 英文配音（2026-11-03）
- **edge-tts `en-US-AndrewMultilingualNeural`**：用户试听 9 个音色后选定。免费、不用 key，但走的是 Edge 朗读的非官方接口：会限流/断连（tts 要重试），条款上商用不明确，接口哪天变了就要换。front matter `voice: en-US-AndrewMultilingualNeural`。
- 火山 `seed-tts-2.0` 的 `en_male_tim_uranus_bigtts`、`en_female_dacey_uranus_bigtts` 可用（备选）；`seed-tts-1.0` 的 `*_mars_bigtts` 英文音色在本账号 403（未开通）。中文音色 vv 也能读英文，但口音明显。
- 试听：同一段 ~20 秒英文开场白，每个音色出一条 mp3，再用 ffmpeg concat（每条后 apad 1.2 秒）拼成一条合集发给用户。

### 中英双语（试点中）
- 试点项目 `~/Videos/知识库/llm-13-rag-agent-en`：新写的英文口语旁白（不是中译英），每句带中文译文，底部两行字幕（上英文、下中文略小），画面标签用英文。
- 字幕组件和 md2json 的具体改法等试点做完再写回这里和 template。
- 英文版不要追加进中文合集；发布去处（B 站新稿件 / YouTube）由用户定。

## 文件一览（template/）
| 文件 | 作用 |
|---|---|
| `tools/md2json.py` | script.md → script.json（检查批注、解析分集） |
| `tools/scaffold.py` | 生成章节占位组件和 `src/chapters/index.ts` |
| `tools/tts.py` | 逐句配音、拆短字幕、写 timeline.json；支持 edge-tts / 火山引擎 |
| `tools/stills.mjs` + `sheet.sh` | 每句 80% 处截图并拼成 3×3 拼图（`SCALE=1` 出全尺寸） |
| `tools/render.sh` | 逐集渲染 + 合并字幕 + 响度标准化 |
| `src/lib/beat.tsx` | 节拍同步（useBeat）、章节标题卡、字幕 |
| `src/lib/ui.tsx` | CodePanel / Matrix / Fade / Tag / H / Tex（KaTeX 公式） |
| `src/lib/EpCard.tsx` | 分集片头片尾卡 |
| `src/lib/Cover.tsx` + `src/covers/` | 封面部件（CoverFrame / Hl / CodeVisual / BigNumber）+ 每集定制封面登记 |
| `src/lib/algo.tsx` | 算法类组件：数组格子、dict、trace 表、题面卡 |
| `tools/bundle.mjs` | 打包一次复用 `out/bundle` |
| `src/lib/library.tsx` | 可选：张量"图书馆"比喻组件（Building / Corridor） |

## 参考文档
- `references/script-guide.md`：逐字稿写法；`outline-template.md`：大纲表
- `references/visual-guide.md` / `agent-brief.md`：画面规范、画面 agent 说明
- `references/cover-guide.md`：封面规范
- `references/plotome-lessons.md`：节奏、转场、音乐、合规（借鉴 plotome）
- `references/production-retro-2026-10.md`：nudgecode 13 章批量制作复盘，坑和对策
- `references/production-retro-2026-11.md`：知识库两篇一批的调度流水线复盘
- `references/review-brief.md`：全片复查 agent 模板
- `rethinkfun-style.md` / `cishoon-style.md`：用户喜欢的 UP 主分析

## 踩过的坑
- macOS `say` 太机械，用 edge-tts。
- 代码和符号要在"读："里写成读法；多音字"行"(háng) 写成"航"。
- 讲真实模型的数字前核对它的结构（例如 Llama-2-70B 本身是 GQA，按 64 头算 10 GB 要说"假设用 MHA"）。
- 随机初始化的注意力太平均，没有意义：要么手工设定权重，要么换随机种子挑对比明显的。
- 截图用 `tools/stills.mjs`（只打包一次），比 `remotion still` 快得多；首次渲染会下载 headless Chrome。
- Bash 里不要写没有输入的 `cat > file`，会一直等 stdin 卡住。
- 截图在每句 80% 处：80% 之后才出现的动画（红叉、晚出的大字）截不到，要单独截或把出现时间提前。
- 画面 agent 并行时，别人章节的语法错误会让 bundle 失败：等一两分钟重试，不要去改别人的文件。
- 复查 agent 曾"清理"旧截图：brief 里必须写"不删除任何文件（截图覆盖可以）"。
- 磁盘：每篇项目约 0.5 GB，成片每集十几 MB；渲染中写满会报 `No space left on device`。开新一批前 `df -h`，低于 ~15 GB 先列可清的分组（各工具缓存、conda clean 等）给用户选，删除要用户同意。
- 章节标题卡和片头片尾卡每集多出约 10 秒，按 TTS 实测时长 + 10 秒估成片时长。
- 画面 agent 会顺手登记 `src/covers/index.ts`：这是做封面必需的，允许。
- 后台等待渲染不要用 `pgrep -f render.sh`：等待命令自己的命令行里也有这个词，pgrep 永远匹配到自己，空转几个小时。只等 `out/epK.mp4` 出现（或日志里的报错）。
