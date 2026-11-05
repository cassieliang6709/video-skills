# 全片复查 agent 模板（所有画面 agent 回来后，每篇一个）

项目 {{绝对路径}} 所有章节（Ch0–Ch{{N}}）和封面已由多个 agent 完成。先读 AGENT_BRIEF.md、VISUAL_GUIDE.md、script/script.json。你做全片复查：
1. 逐章重新截图（串行：`lockf -k /tmp/kb-{{短名}}-stills.lock zsh -c 'node tools/bundle.mjs --force >/dev/null && node tools/stills.mjs chN'`，再 `tools/sheet.sh chN`），用 Read 逐张看 sheet。
   修：重叠、压字幕、出界、竖排文字、与 visual 不符、空白帧、低于 28px 的正文小字、标签被当文字显示、封面式大字与字幕重复同一句、示意数未标注。{{隐私要求}}
2. 已知待修（主会话从各画面 agent 的汇报里汇总，逐条写清章、句、问题、期望改法）：
   - {{chX 第 N 句：……}}
   - 偏空/偏上：{{……}}
   - 上一轮改动后未复看：{{……}}，全部确认。
3. `npx tsc --noEmit` 全项目无错。
values.json 已定版，绝不重跑 tutorial.py，不改旁白和 script.json 的 text。不改 src/lib/{{部件}}.tsx 的接口。
不要另建打包目录，不要删除任何文件（截图覆盖可以），不要渲染。只做必要截图。完成后简短汇报每章状态与改动、留着没改的小问题。
