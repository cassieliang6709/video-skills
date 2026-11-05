#!/bin/zsh
# 按章分 P 上传 B 站：chapter_queue.tsv 每行一章
#   upload	<章目录>	-	<稿件标题>	<共用标签>	<P1 标题|P2 标题|...>	<P1 简介|P2 简介|...>
#   append	<章目录>	<BV号>	-	-	<要追加的集号，空格分隔>	-
# 每集用硬链接 out/parts/P<k> <集标题>.mp4（biliup 用文件名当分 P 标题，不占额外空间）。
# 成功：每集写 "- 结果：<BV> P<k>" 进 out/upload_meta.md（cleanup_uploaded.sh 认这个），并从队列删掉这一行。
# 21566 投稿过于频繁：每小时重试，最多 24 次。其他错误：换线路一次，仍失败就把这一行挪到队尾、10 分钟后继续。
cd ~/Videos/nudgecode-算法
Q=chapter_queue.tsv; COMMON="算法,LeetCode,Python,数据结构,刷题,面试"
B=$(ls ~/.social-auto-upload/tools/biliup/*/biliup | head -1); CK=~/tools/social-auto-upload/cookies/bilibili_YOUR_ACCOUNT.json
mark() {  # mark <章> <BV> <k> <集标题> <简介>
  local m=$1/out/upload_meta.md
  if [ -f $m ] && grep -q "^## EP$3\$" $m; then
    python3 - $m $3 "$2" <<'P'
import sys,re;p,k,bv=sys.argv[1:];t=open(p).read();i=t.rfind(f"## EP{k}\n");j=t.find("\n## ",i+1);j=len(t) if j<0 else j
sec=re.sub(r"- 结果：.*",f"- 结果：{bv} P{k} https://www.bilibili.com/video/{bv}?p={k}",t[i:j]) if "- 结果：" in t[i:j] else t[i:j].rstrip("\n")+f"\n- 结果：{bv} P{k} https://www.bilibili.com/video/{bv}?p={k}\n"
open(p,'w').write(t[:i]+sec+t[j:])
P
  else
    { echo; echo "## EP$3"; echo "- 分 P 标题：$4"; echo "- 分 P 简介：$5"; echo "- 结果：$2 P$3 https://www.bilibili.com/video/$2?p=$3"; } >> $m
  fi
}
waits=0
while [ -s $Q ]; do
  IFS=$'\t' read -r kind c vid title tags ptitles pdescs < $Q
  if [ $kind = append ]; then ks=(${=ptitles}); else ks=(${(s:|:)ptitles}); ks=({1..${#ks}}); fi
  pt=(${(s:|:)ptitles}); pd=(${(s:|:)pdescs})
  mkdir -p $c/out/parts; files=()
  for k in $ks; do
    n=$(grep -E '^episode_titles:' $c/script/script.md | sed 's/^episode_titles: *//' | awk -F' *\\| *' -v k=$k '{print $k}' | tr '/' '／')
    f="$c/out/parts/P$k $n.mp4"; [ -e "$f" ] || ln $c/out/ep$k.mp4 "$f"; files+=("${f:A}")
  done
  alltags=$(echo "$COMMON,$tags" | tr ',' '\n' | awk 'NF && !s[$0]++' | head -12 | paste -sd, -)   # B 站最多 12 个标签
  desc="自用学习笔记。"; [ $kind = upload ] && for i in {1..${#pt}}; do desc+=$'\n'"P$i ${pt[$i]}：${pd[$i]}"; done
  cover=${c:A}/out/covers/ep1.jpg   # 必须在 cd 之前算绝对路径
  out=""; bv=""
  for line in tx bda2; do
    if [ $kind = append ]; then
      out=$(cd ~/tools/social-auto-upload && $B -u $CK append --vid $vid --line $line "${files[@]}" < /dev/null 2>&1); bv=$( echo "$out" | grep -qiE 'code: 0|成功' && echo $vid )
    else
      out=$(cd ~/tools/social-auto-upload && $B -u $CK upload "${files[@]}" --line $line --copyright 1 --tid 231 --cover "$cover" --title "$title" --desc "$desc" --tag "$alltags" < /dev/null 2>&1)
      bv=$(echo "$out" | sed 's/\x1b\[[0-9;]*m//g' | grep -oE 'BV[0-9A-Za-z]{10}' | head -1)
    fi
    [ -n "$bv" ] && break; echo "$out" | grep -q 21566 && break
  done
  echo "$out" | sed 's/\x1b\[[0-9;]*m//g' | tr '\r' '\n' | grep -v '^\s*$' | tail -4 >> upload_chapters.raw.log
  if [ -n "$bv" ]; then
    echo "$(date +%H:%M) OK $kind $c $bv P${(j:,:)ks}"
    i=0; for k in $ks; do i=$((i+1)); mark $c $bv $k "${pt[$i]:-}" "${pd[$i]:-}"; done
    tail -n +2 $Q > $Q.tmp && mv $Q.tmp $Q; waits=0; sleep 300
  elif echo "$out" | grep -q 21566; then
    waits=$((waits+1)); [ $waits -gt 24 ] && { echo "$(date +%H:%M) 限流超过 24 小时，停止"; exit 1; }
    echo "$(date +%H:%M) 投稿过于频繁，1 小时后重试 $kind $c"; sleep 3600
  else
    echo "$(date +%H:%M) FAIL $kind $c: $(echo "$out" | sed 's/\x1b\[[0-9;]*m//g' | tr '\r' '\n' | grep -v '^\s*$' | tail -2 | tr '\n' ' ')"
    { tail -n +2 $Q; head -1 $Q; } > $Q.tmp && mv $Q.tmp $Q; sleep 600
  fi
done
echo "$(date +%H:%M) 队列已清空"
