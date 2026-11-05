# video-skills

两个给 coding agent（Claude Code 等支持 Agent Skills 的工具）用的 skill：用代码做技术讲解视频，再发布到视频平台。

我用它们在不到一个月里做了一千多分钟的讲解视频，没有打开过剪辑软件。

| skill | 做什么 |
|---|---|
| [`tech-explainer-video`](skills/tech-explainer-video/SKILL.md) | 从笔记到成片：大纲 → 逐字稿 → 视频三道关，每关由人确认。逐句配音生成时间轴，Remotion 按节拍渲染画面，屏幕上的数字全部来自真实运行的代码，模型截图自查后再渲染。 |
| [`video-publish`](skills/video-publish/SKILL.md) | 把做好的视频发到 B 站（主）、YouTube、抖音、快手、小红书：准备标题/简介/标签/封面，逐条确认后上传。 |

## 安装

```bash
git clone https://github.com/cassieliang6709/video-skills.git
cp -r video-skills/skills/* ~/.claude/skills/
```

之后在 Claude Code 里说"做一个讲解视频""把这个视频传到 B 站"就会用到。

## 依赖

**tech-explainer-video**
- Node.js 18+、ffmpeg、Python 3
- [Remotion](https://www.remotion.dev)（模板里的 `package.json`，项目里 `npm install`）。注意 Remotion 对 3 人及以上的公司要求购买许可，见其官网。
- 配音：默认火山引擎语音合成，凭证放在 `~/.volc_tts.env`（`VOLC_APPID`、`VOLC_TOKEN`，需要自己申请）；没有凭证时自动退回免费的 edge-tts。

**video-publish**
- [dreammis/social-auto-upload](https://github.com/dreammis/social-auto-upload)（`sau` 命令行）
- [biliup](https://github.com/biliup/biliup-rs)（B 站投稿，sau 会自动下载）
- 示例脚本里的 `YOUR_ACCOUNT` 换成你在 sau 里登录时起的账号名。

## 安全边界

- 登录一律由人自己在终端扫码，agent 不输入账号密码、不读取或打印 cookie。
- 抖音、快手、小红书的上传命令由人在自己的终端运行；agent 只负责准备命令和投稿信息。
- 发布、删除前都要人确认。

## 说明

- 这两个 skill 是我按自己的工作流写的，里面有一些我的偏好和踩坑记录（`references/production-retro-*.md`），按需删改。
- 写法参考了几位 UP 主的公开视频，分析笔记在 `references/` 里，只记录手法，不含他们的素材。
- 动效部分可以配合 [ConardLi/garden-skills](https://github.com/ConardLi/garden-skills) 里的 motion-showreel 一起用。

## License

MIT
