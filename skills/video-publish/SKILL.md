---
name: video-publish
description: 把做好的视频发布到自媒体平台（B 站为主，YouTube / 抖音 / 快手 / 小红书辅助）：准备标题/简介/标签/封面，逐条给用户确认后上传，返回 BV 号。用户说"上传 B 站""传 YouTube""发抖音""发快手""发小红书""投稿""发布视频"时使用。通常接在 tech-explainer-video 之后。
---

# 视频发布（B 站 / YouTube / 抖音 / 快手 / 小红书）

## 铁律
- **每一条发布前**把平台、账号、文件、封面、标题、简介、标签、分区、发布方式列成表给用户，用户明确说"发"才执行。
  用户可以一次批准多条（例如"EP2–EP4 都发"），但只覆盖当时列出的那几条和那些内容；内容有任何改动都要重新确认。
- 登录只能用户自己来（终端扫码）。不替用户输入账号、密码、手机号、验证码，不读取或打印 cookie 内容。
- 抖音、快手、小红书的 sau 上传基于 patchright（隐藏自动化痕迹的浏览器）。用户决定使用它，但**由用户在自己的终端里运行上传命令**：
  Claude 负责准备好完整命令和投稿信息，不自己执行这几个平台的 login / upload，也不替用户过滑块验证码。

## 准备
0. 发布前过一遍 tech-explainer-video 的 `references/plotome-lessons.md` 合规清单：**勾选"含 AI 生成内容"**（旁白是 AI 也要勾）、音乐授权和署名写进简介、不用真人脸和商标。
1. 按 `references/upload-meta-template.md` 写 `out/upload_meta.md`。简介只写视频里确实讲到的内容，开头加"自用学习笔记。"（用户偏好）。
2. 封面：1920×1080、没有字幕；由 tech-explainer-video 的 `cover-epK` composition 生成。
3. 发给用户审（SendUserFile），问清楚：封面、是否需要代码链接（GitHub/Gist）、合集名。

## B 站
工具：dreammis/social-auto-upload（装在 `~/tools/social-auto-upload`），实际投稿用它自动下载的 biliup。

首次安装（先告诉用户来源、内容和大小，等用户同意再装）：
```bash
git clone --depth 1 https://github.com/dreammis/social-auto-upload.git ~/tools/social-auto-upload
cd ~/tools/social-auto-upload && uv venv --python 3.12 && uv pip install -e . && uv pip install playwright
cp conf.example.py conf.py
```

登录（让用户在自己的终端里运行，菜单选「扫码登录」，用 B 站 App 扫码；二维码显示不全就打开 `qrcode.png`）：
```bash
cd ~/tools/social-auto-upload && .venv/bin/sau bilibili login --account <账号名>
```
不要选短信登录：它会要求过滑块验证码并手动抄 challenge，很容易过期失败。
检查登录：`.venv/bin/sau bilibili check --account <账号名>`，输出 `valid` 即可。

上传：
1. 先测线路：`tools/probe_lines.sh`，取速度最快的那条（通常 tx 或 bda2）。不要让 biliup 自动测速，经过代理时会卡住。
2. 逐条投稿：
   ```bash
   ~/.claude/skills/video-publish/tools/bili_upload.sh <账号名> out/ep1.mp4 out/covers/ep1.jpg tx 231 "<标题>" "<简介>" "<标签,逗号分隔>"
   ```
   脚本会把路径转成绝对路径（它内部 cd 到 social-auto-upload），在视频项目目录里用相对路径调用即可。
   成功会打印 `投稿成功 BVxxxx 链接`，失败会打印日志末尾。多集按顺序一集一集传，每传完一集就告诉用户 BV 号。
3. 全部传完后提醒用户：在创作中心「合集管理」建合集并按顺序加入；审核通过后才公开。

网络排障：
- 上传极慢、`error sending request`、`connection reset`、服务器 500：多半是代理 TUN 把流量绕到了海外节点。
  让用户在代理规则里把 `DOMAIN-SUFFIX,bilibili.com,DIRECT`、`DOMAIN-SUFFIX,bilivideo.com,DIRECT` 放在靠前的位置，并重新加载配置；
  再跑一遍 `probe_lines.sh`，速度到每秒几百 KB 以上再传。
- 看进度：`nettop -p <biliup pid> -L 1 -x -J bytes_out`。biliup 日志在传完之前几乎没有输出，不要因为没日志就判断卡住。
- macOS 没有 `timeout` 命令。
- 首次运行 sau 下载 biliup 失败（GitHub Release 访问慢）：用 `https://gh-proxy.com/` 或 `https://gh-proxy.org/` 加在 release 地址前手动下载。
- 重传前先确认上一次没有投稿成功（日志里有没有 bvid），避免重复投稿。

## B 站：投稿上限与分 P
- 新建稿件每天约 7 个，超了返回 `21566 投稿过于频繁`，要等第二天。**一章打成一个分 P 稿件**（biliup `upload` 一次传多个文件，文件名就是分 P 标题，用硬链接 `out/parts/P<k> <集标题>.mp4` 起名不占空间）。
- 往已有稿件追加分 P 用 `biliup append --vid BV…`，不占新建额度。
- 标签最多 12 个，超了截断。线路先 `probe_lines.sh`；`bldsa` 出现过证书过期，失败换 `tx`/`bda2`。
- 队列脚本范例：`tools/examples/upload_chapters.sh`（21566 每小时重试，最多 24 次；成功把 `- 结果：BV… P<k>` 写回 upload_meta.md）。

## B 站：追加到已有稿件（系列合集，2026-10 ~ 11 知识库跑通）
- 一个系列一个分 P 稿件，之后每篇都 `biliup append --vid BV…` 追加；不新建稿件（用户明确不要新建时更不能建）。
- 队列脚本范例 `tools/examples/upload_append.sh`：每篇一行 `app <名字> <BV> <项目目录>`，按顺序追加 `out/parts/*.mp4`。
  - 幂等：成功写 `<名字> append <BV> <日期>` 到 `results.log`，再次运行自动跳过（"已追加过"），所以新一批只要在末尾加行、整份重跑。
  - 线路轮换 alia → tx → bda2，三条都失败就睡 30 分钟再来，最多 48 轮；成功判据是输出里有 `稿件修改成功`。
  - 用 `nohup <脚本> > upload_kbN.log 2>&1 & disown` 启动，日志按批编号；另起一个后台 until 循环等日志出现"队列完成"。
  - 常见失败 `client error (Connect)`：线路抖动，脚本会自己重试，不要手动重传（会重复分 P）。
- 分 P 标题就是文件名：`out/parts/P<k> <钩子>：<主题>.mp4`（硬链接到 `out/epK.mp4`，不占空间）。
- append 改不了简介：每批在 upload_meta.md 写一段"简介补充"，再追加到看板里一条"待作者"笔记，让用户在创作中心手动贴到原稿件简介末尾。
- 不同语言的版本（如英文配音版）不要追加进中文稿件，发到哪由用户定。

## YouTube
- 工具：同一个 sau（`sau youtube login/upload-video`，**必须 `--headed`**，无头模式 Google 不让进 Studio）。
  sau 自带的 YouTube 上传器有两个 bug，修法在 `tools/examples/sau-youtube-fixes.patch`：登录检查只等 3 秒且用无头（误报 invalid）；播放列表选择器点错（播放列表从没加上，且异常被吞）。新机器装完 sau 后先打这个补丁。
- 播放列表要先在 Studio 建好（否则 `--playlist` 不生效）；上传后抽查一集是否进了列表，没进就到 Studio 视频编辑页补选。
- 单日有上传上限：出现"未找到发布按钮"、视频停在草稿，多半是到上限了。**不要重传**（会留下重复草稿），到 Studio 把草稿补齐发布，剩下的第二天再传。
- 队列脚本范例：`tools/examples/youtube_queue.sh`（长队列用 `nohup … & disown`，会话的后台任务会被回收）。
- **API 方案（不开浏览器）**：youtubeuploader（`brew install youtubeuploader`）+ `tools/examples/youtube_api_upload.sh`。
  前提：Google Cloud 项目开 YouTube Data API v3、OAuth 同意屏幕（外部、加测试用户）、Web 应用凭据（回调 `http://localhost:8080/oauth2callback`）。
  **未通过审核的项目，API 传的视频一律锁为私有**；审核表单 https://support.google.com/youtube/contact/yt_api_form 要求公开的首页、隐私政策、服务条款
  （可用 GitHub Pages，范例 cassieliang6709/video-uploader）、首页/隐私页截图、OAuth 流程截图、架构图、用户流程图、完整上传脚本。审核前继续用浏览器自动化。

## 抖音 / 快手 / 小红书
工具：同一个 social-auto-upload 的 `sau douyin|kuaishou|xiaohongshu`，浏览器自动化（patchright）。
**命令由用户在自己的终端里运行**（见铁律），Claude 只准备命令、检查结果。

视频：这三个平台以竖屏为主，建议 1080×1920 或剪成 1 分钟左右的精华；需要的话回到 tech-explainer-video 另渲染竖版。
横版也能传，但会带黑边。

首次安装浏览器（用户运行）：
```bash
cd ~/tools/social-auto-upload && PLAYWRIGHT_DOWNLOAD_HOST="https://npmmirror.com/mirrors/playwright" .venv/bin/patchright install chromium
```

登录与检查（用户运行，`<平台>` 是 douyin / kuaishou / xiaohongshu）：
```bash
cd ~/tools/social-auto-upload && .venv/bin/sau <平台> login --account <账号名> --headed
.venv/bin/sau <平台> check --account <账号名>
```

上传（Claude 按 upload_meta.md 填好整条命令发给用户，用户确认内容后自己运行）：
```bash
cd ~/tools/social-auto-upload && .venv/bin/sau <平台> upload-video --account <账号名> \
  --file <mp4 绝对路径> --title "<标题>" --desc "<正文>" --tags <标签,逗号分隔> \
  [--thumbnail <封面>] [--schedule "YYYY-MM-DD HH:MM"] [--collection <已存在的合集名>]
```
- 抖音：`--thumbnail` 要 3:4 竖版，另有 `--thumbnail-landscape`（4:3）；标题不超过 30 字。
- 快手：`--thumbnail` 任意比例；脚本只填前 3 个标签，最重要的放前面。
- 小红书：标题不超过 20 字；不支持 `--collection`。
- 用户跑完把终端输出贴回来，Claude 判断是否成功、把链接写回 upload_meta.md。出现滑块验证码由用户自己处理。
- 抖音一章发一个**整章合集**（各集拼成 `out/chapter.mp4`，4:3 横版封面）比逐集发好管理；队列脚本范例 `tools/examples/douyin_upload_all.sh`（用户在自己终端跑，登录检查用有界面模式 `DOUYIN_COOKIE_AUTH_HEADLESS=false`）。

备选（不想用脚本时）：在用户已登录的 Chrome 里打开创作者平台的发布页，帮用户选好文件、填好标题和正文，停在发布按钮前截图，由用户自己点"发布"。

## 批量流水线（仅当用户明确授权）
用户可以对一个系列给出长期授权："渲完一批 → 直接上传 → 删成片"（例如 nudgecode 算法图解，2026-10-24 授权）。
这种授权只覆盖用户说过的那个系列，换系列或换平台要重新问。授权范围内：
1. 这一批每章渲完后，按该系列已有的 upload_meta.md 格式自己写标题、简介、标签（简介仍以"自用学习笔记。"开头，只写视频里有的内容），
   不再逐条给用户看；**仍然**先 `sau bilibili check` 确认登录、`probe_lines.sh` 选线路。
2. 按章、按集顺序上传，每章传完在对话里列"集 / 标题 / 链接"，BV 号写回 upload_meta.md。
3. 只有拿到 BV 号的那一集才删：`out/epK.mp4`、`out/*.raw.mp4`、`out/check/`、`out/bundle/`（以及该项目自己的 node_modules，共享的软链不动）。
   保留源码、配音、srt、封面、upload_meta.md，以便以后重渲。上传失败的集一律不删。
4. 删除命令被权限拦下时，把命令原样给用户自己运行，不换别的方式绕过。

## 清理
- 成片要**所有目标平台都拿到链接**才删；删除常被权限拦下，写成脚本交给用户跑，范例 `tools/examples/cleanup_uploaded.sh`（只删 upload_meta.md 里有结果的集，可反复跑）。

## 记录
发布完把每集的 BV 号写回 `out/upload_meta.md` 的"结果"一栏，并在对话里列一张"集 / 标题 / 链接"表。
