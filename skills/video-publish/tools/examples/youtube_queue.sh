#!/bin/zsh
# 按 youtube_queue.tsv（章	集	标题	简介(\n 转义)	标签）顺序传 YouTube（浏览器自动化，带界面），全部公开、放进一个播放列表。
# 成功：链接写进该章 out/upload_meta.md 对应集的 "- YouTube：" 行，并从队列删掉；失败：挪到队尾，10 分钟后继续；连续失败 6 次就停。
cd ~/Videos/nudgecode-算法; ROOT=$PWD   # 子 shell 里会 cd，路径必须先固定
Q=youtube_queue.tsv; COMMON="算法,LeetCode,Python,数据结构,刷题,面试"; fails=0
while [ -s $Q ]; do
  IFS=$'\t' read -r c k title desc tags < $Q
  d=$(printf '%b' "$desc")
  f=$ROOT/$c/out/ep$k.mp4; cov=$ROOT/$c/out/covers/ep$k.jpg
  [ $k = full ] && { f=$ROOT/$c/out/chapter.mp4; cov=$ROOT/$c/out/covers/ep1.jpg; }   # 整章合集
  out=$(cd ~/tools/social-auto-upload && .venv/bin/sau youtube upload-video --account YOUR_ACCOUNT --file $f --title "$title" --desc "$d" --tags "$COMMON,$tags" --thumbnail $cov --playlist "nudgecode 算法图解" --visibility public --headed 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
  url=$(echo "$out" | grep -oE 'https://youtu\.be/[A-Za-z0-9_-]+' | tail -1)
  if [ -n "$url" ]; then
    echo "$(date +%H:%M) OK $c ep$k $url"; fails=0
    python3 - $c/out/upload_meta.md $k "$url" "$title" <<'P'
import sys,os;p,k,url,title=sys.argv[1:];t=open(p).read() if os.path.exists(p) else ""
i=t.rfind(f"## EP{k}\n")
if i<0: t+=f"\n## EP{k}\n- 标题：{title}\n- YouTube：{url}\n"
else:
    j=t.find("\n## ",i+1); j=len(t) if j<0 else j; sec=t[i:j].rstrip("\n")
    sec=sec+f"\n- YouTube：{url}\n" if "- YouTube：" not in sec else sec
    t=t[:i]+sec+("\n" if j<len(t) else "")+t[j:]
open(p,'w').write(t)
P
    tail -n +2 $Q > $Q.tmp && mv $Q.tmp $Q; sleep 30
  else
    fails=$((fails+1)); echo "$(date +%H:%M) FAIL $c ep$k: $(echo "$out" | tail -2 | tr '\n' ' ')"
    [ $fails -ge 6 ] && { echo "连续失败 6 次，停止"; exit 1; }
    { tail -n +2 $Q; head -1 $Q; } > $Q.tmp && mv $Q.tmp $Q; sleep 600
  fi
done
echo "$(date +%H:%M) YouTube 队列已清空"
