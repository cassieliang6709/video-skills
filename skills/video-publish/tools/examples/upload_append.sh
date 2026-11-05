#!/bin/zsh
# 追加分 P 到已有 B 站稿件（不占新建额度）。用法：改 Q/ACCOUNT，末尾每篇一行 app <名字> <BV> <项目目录>，
# 然后 nohup ./upload_append.sh > upload_N.log 2>&1 & disown。results.log 里有记录的自动跳过，可反复跑。
Q=${Q:-$HOME/Videos/_bili_queue}; ACCOUNT=${ACCOUNT:-YOUR_ACCOUNT}
B=$(ls ~/.social-auto-upload/tools/biliup/*/biliup | head -1); CK=~/tools/social-auto-upload/cookies/bilibili_$ACCOUNT.json
mkdir -p $Q
app() {  # app <名字> <BV> <项目目录>
  local name=$1 bv=$2 P=$3
  grep -q "^$name append " $Q/results.log 2>/dev/null && { echo "$name 已追加过"; return 0; }
  local files=("$P/out/parts/"*.mp4(N)); [ ${#files} -eq 0 ] && { echo "$name 没有 parts 文件"; return 1; }
  for i in {1..48}; do
    for line in alia tx bda2; do
      out=$(cd ~/tools/social-auto-upload && $B -u $CK append --vid $bv --line $line "${files[@]}" < /dev/null 2>&1 | sed 's/\x1b\[[0-9;]*m//g')
      if echo "$out" | grep -q '稿件修改成功'; then
        echo "$name append $bv $(date '+%m-%d %H:%M')" >> $Q/results.log
        printf '\n- 结果：追加到 %s https://www.bilibili.com/video/%s（%dP）\n' $bv $bv ${#files} >> $P/out/upload_meta.md
        echo "$(date '+%m-%d %H:%M') OK $name -> $bv"; return 0
      fi
      echo "$(date '+%m-%d %H:%M') $name 线路 $line 失败：$(echo "$out" | grep -E 'code|Error|error' | tail -1 | cut -c1-200)"
    done
    sleep 1800
  done; return 1
}
# app demo01 BV1xxxxxxxxx $HOME/Videos/系列/demo-01
echo "$(date '+%m-%d %H:%M') 队列完成"
