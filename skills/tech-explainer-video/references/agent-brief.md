# 章节画面 agent 说明（填好后写成项目根目录的 AGENT_BRIEF.md）

项目：{{视频标题}}，受众：{{受众}}。
项目根目录：{{绝对路径}}
你负责：{{chN, chM}}

1. 先读 `VISUAL_GUIDE.md`（版式、节拍 API、组件、自检方法），再读 `script/script.json` 里你负责章节的每一句：
   `text` 是字幕，`visual` 是用户已确认的画面说明。**逐句按 visual 实现，不自行加戏，也不省略。**
2. 只改你负责的 `src/chapters/ChN.tsx`，可以新建 `src/chapters/chN_parts.tsx`；做封面的 agent 可以写 `src/covers/CoverEpK.tsx` 并登记 `src/covers/index.ts`。
   不要改 `src/lib/*`（确需改动先在汇报里说明，不要动别人在用的接口）、`src/Root.tsx`、`src/chapters/index.ts`、`script/*`、`src/timeline.json`、`py/*`、`public/*` 和其他章节；
   不要运行 tts.py / md2json.py / scaffold.py / tutorial.py，不要渲染整片。values.json 已定版，不改旁白。
3. 数值、形状、True/False 只能来自 `py/values.json`（`import v from "../../py/values.json"`，键名如 `v["p1.A"]`）；
   屏幕代码必须和 `py/tutorial.py` 一致（可以截取片段、省略注释），不要自己编文件名、命令或输出。
   不得不用的其他数：示意数标"示意"，玩具实验标"玩具实验"，论文/报告里的数标"报告值"。
4. 物理图用 `src/lib/{{部件}}.tsx`；风格参考已完成的 {{Ch0.tsx、Ch1.tsx}}。比喻：{{只允许出现在 chX / 不使用}}。
   配色按 VISUAL_GUIDE.md 的全片固定配色（注意力类如 Q=C.q 蓝、K=C.k 绿、V=C.v 橙、强调 C.accent、错误 C.red、高亮 C.yellow），每个张量都标形状。
5. 版式：画面铺满，主体放大、落在画面中部到下半屏，别只占上半屏；正文字号不低于 28px，标题 `whiteSpace: nowrap`；
   封面式大字（≥96px）别和底部字幕说同一句话。隐私：MAC、公网 IP 不得完整出现。
6. 必须自检：`npx tsc --noEmit` 对你的文件无错；截图**串行**：
   `lockf -k /tmp/kb-{{项目短名}}-stills.lock zsh -c 'node tools/bundle.mjs --force >/dev/null && node tools/stills.mjs chN'`，再 `tools/sheet.sh chN`，
   用 Read 逐张看 `out/check/chN/sheet_*.jpg`，修到没有重叠、压字幕、出界，且每格画面和该句 visual 一致；改完重新截图确认。
   80% 之后才出现的元素要单独确认。别人的章节编译不过导致打包失败时，等一两分钟再试，不要改别人的文件。
7. 不要另建打包目录，**不要删除任何文件（包括截图，覆盖可以）**。磁盘有限，只做必要截图。
8. 完成后简短汇报：每句对应的画面、自检结果、不在 values.json 里的数（说明来源）、已知问题、改后未复看的帧。
