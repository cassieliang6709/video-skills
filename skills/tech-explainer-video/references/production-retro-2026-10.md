# 复盘：nudgecode 算法 13 章 + 知识库系列（2026-10-23 ~ 10-24）

一个主会话调度 12–20 个子 session，两天做完 13 章算法课（约 40 集）并发到 B 站 / YouTube / 抖音，同时起步知识库 25 篇。
这里记**做成了什么流程**和**踩过的坑**，规则已经写回 SKILL.md / video-publish / 模板；这份是来龙去脉。

## 跑通的流程
1. **试点一章**（数组）：大纲 → 代码+逐字稿 → 零基础检查 → 用户批注 → 定画风 → 4 个画面 agent 并行 → 复查 → 渲染 → 上传。
2. **其余章节各开一个 session**，共用 `STAGE3_NOTES.md`（试点的坑和已定画风），用户逐个确认大纲/逐字稿。
3. **主会话只做调度**：转达用户确认（引用原话）、恢复撞限额/断网的 session、统一上传和清理、发现共性问题就改模板。
4. 用户给了长期授权（"渲完直接传、传完删"）后，上传走后台队列脚本，不再逐条问。

## 坑与对策
| 现象 | 原因 | 对策（已落地） |
|---|---|---|
| 12 个 session 同时跑，全部撞用量上限 | 并发太高 | 同时 3–4 个 session；画面 agent 多的阶段更要少开 |
| 火山 TTS 报 concurrency | 账号级并发上限 | tts.py 退避重试、并发 2 |
| 磁盘写满（17 GB） | 每次 stills/render 在 `$TMPDIR` 新建 ~90 MB 打包 | `bundle.mjs` 打包一次复用 `out/bundle` |
| 3 个项目同时渲染反而更慢 | CPU 已满 | render.sh 全机 `lockf` 锁，自动排队 |
| `react-dom` 缺文件 | 两个 npm install 并发写坏 | 系列共享一份 node_modules + 软链；install 不并发 |
| bundle.mjs 输出空、每集仍临时打包 | 路径含中文，`import.meta.url` 被 URL 编码 | 用 `fileURLToPath` 比较 |
| 用 bash 跑 render.sh 只出第一集、退出码 0 | 脚本是 zsh 写的 | render.sh 开头检测 bash 就 `exec zsh` |
| 子 shell 里 `cd` 后用相对路径/`${c:A}`/`$PWD` | 先 cd 后展开 | 进 `$(cd …)` 之前先算好绝对路径 |
| 修改正在运行的 zsh 脚本 | zsh 边执行边读 | 先停进程再改，或改完重启 |
| 后台任务被杀（退出码 144） | 会话的后台任务被回收 | 长队列用 `nohup … & disown` |
| B 站 21566 投稿过于频繁 | 每天约 7 个新稿件 | 一章打成一个分 P 稿件；已有稿件用 `biliup append` 追加不受限 |
| bili_upload.sh `--cover` 被当成一个参数 | zsh 的 `${X:+…}` 不分词 | 用数组 `COVER_ARGS` |
| YouTube `sau check` 说 invalid | 无头浏览器 + 只等 3 秒 | cookie_auth 改有界面 + 等 `/channel/` 跳转 |
| YouTube 播放列表从没加上 | 选择器点错了下拉框，异常被吞 | 定位 `Select playlists` 按钮，失败打印 `PLAYLIST_FAILED` |
| YouTube 上传卡在草稿 | 进程被杀 / 当日上限 | 到 Studio 补发草稿，不要重传造成重复 |
| YouTube API 上传会被锁私有 | 未审核项目 | 先用浏览器自动化；API 要 Google 审核（需隐私政策页等，见 video-publish） |
| 一集 7–8 分钟超出约定 | 时长只在大纲估了 | 写稿时按集核时长；后来用户把默认改成 8–12 分钟/集 |
| 观众听不懂"累加器""ISA" | 受众设定太高 | 默认受众"学过但忘了"：前置概念先 2–3 句加例子帮回忆 |
| 封面不吸引人 | 渐变底 + 长标题 | 新封面规范 cover-guide.md |
| 画面 agent 自己编屏幕文件名/命令 | 想把画面做满 | brief 里禁止；只显示 tutorial.py 里真有的 |
| 长代码行被面板截断 | fontSize 32 下 >55 字符 | 缩字号或加宽，拼图里查 |
| rm 被权限拦 | 用户的权限设置 | 把清理写成脚本（cleanup_uploaded.sh）交给用户跑 |

## 主会话调度的规矩
- 转达确认时引用用户原话；用户一句"可以"覆盖哪些 session 要说清，拿不准就问。
- 同一文件不要两个进程/会话同时改（这次 fork 会话改了 YouTube 队列，主会话的旧进程还在用旧逻辑跑）。
- 每批开工前看 `df -h`；子 session 的报告只是报告，交付前自己看产物（拼图、时长、响度、封面）。
