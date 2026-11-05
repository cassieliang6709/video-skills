#!/bin/zsh
[ -n "$BASH_VERSION" ] && exec zsh "$0" "$@"   # 按 zsh 写的；用 bash 跑会只渲第一集且退出码为 0
# 渲染：有 episodes 时逐集渲染 out/epK.mp4 + out/epK.srt，否则渲染整片 out/final.mp4
# 渲染后做响度标准化（-16 LUFS，适合 B 站/小红书）。用法：tools/render.sh [ep1 ep2 ...]
# 全机同一时刻只渲染一集：多个项目同时渲染不会更快（CPU 已满），只会多占内存和磁盘。
# 别的项目在渲染时，这里会排队等锁（锁文件 $RENDER_LOCK，默认 /tmp/remotion-render.lock）。
set -e
LOCK=${RENDER_LOCK:-/tmp/remotion-render.lock}
BUNDLE=$(node tools/bundle.mjs | tail -1)   # 打包一次，各集复用
TARGETS=("$@")
if [ ${#TARGETS[@]} -eq 0 ]; then
  TARGETS=($(python3 -c "import json;t=json.load(open('src/timeline.json'));print(' '.join(e['id'] for e in t.get('episodes',[])) or 'full')"))
fi
for T in $TARGETS; do
  echo "等待渲染锁并渲染 $T ..."
  lockf -k $LOCK npx remotion render $BUNDLE $T out/$T.raw.mp4 --log=error
  ffmpeg -loglevel error -y -i out/$T.raw.mp4 -c:v copy -af loudnorm=I=-16:TP=-1.5:LRA=11 -c:a aac -b:a 192k out/$T.mp4 && rm out/$T.raw.mp4
  python3 - $T <<'PY'
import json, re, sys
T = sys.argv[1]
tl = json.load(open("src/timeline.json")); FPS = tl["fps"]
ids = next((e["chapters"] for e in tl.get("episodes", []) if e["id"] == T), [c["id"] for c in tl["chapters"]])
chs = {c["id"]: c for c in tl["chapters"]}
def ts(sec):
    h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)) % 1000:03}"
out, base = [], 0
for cid in ids:
    ch = chs[cid]; base += 0 if re.match(r"ep\d+_", cid) else 60
    for b in ch["beats"]:
        for c in b.get("cues", [{"text": b["text"], "from": 0, "to": b["frames"]}]):
            out.append(f"{len(out)+1}\n{ts((base + b['from'] + c['from']) / FPS)} --> {ts((base + b['from'] + c['to']) / FPS)}\n{c['text']}\n")
    base += ch["frames"]
open(f"out/{T}.srt", "w").write("\n".join(out)); print(f"out/{T}.mp4  {base / FPS / 60:.1f} 分钟  字幕 {len(out)} 条")
PY
done
# 封面：每集一张 out/covers/epK.jpg（1920×1080，无字幕）
for T in $TARGETS; do
  [[ $T == ep* ]] || continue
  mkdir -p out/covers && npx remotion still $BUNDLE cover-$T out/covers/$T.jpg --log=error && echo "out/covers/$T.jpg"
done
