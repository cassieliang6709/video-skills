#!/bin/zsh
# 用 biliup 投稿一条 B 站视频。用法：
#   bili_upload.sh <账号名> <mp4> <封面jpg> <线路> <分区tid> <标题> <简介> <逗号分隔标签>
# 日志写到 <mp4 同目录>/upload_<文件名>.log；成功时打印 BV 号
set -u
ACC=$1; MP4=$2; COVER=$3; LINE=$4; TID=$5; TITLE=$6; DESC=$7; TAGS=$8
SAU=~/tools/social-auto-upload
BILIUP=$(ls ~/.social-auto-upload/tools/biliup/*/biliup 2>/dev/null | head -1)
[ -x "$BILIUP" ] || { echo "找不到 biliup：先运行一次 sau bilibili check --account $ACC 让它自动下载"; exit 1; }
# 脚本里会 cd 到 $SAU，所以文件一律转成绝对路径
MP4=${MP4:A}; [ -n "$COVER" ] && COVER=${COVER:A}
LOG="$(dirname "$MP4")/upload_$(basename "$MP4" .mp4).log"
# zsh 里 ${COVER:+--cover "$COVER"} 会变成一个参数，biliup 不认；用数组传
COVER_ARGS=(); [ -n "$COVER" ] && COVER_ARGS=(--cover "$COVER")
cd $SAU && $BILIUP -u cookies/bilibili_$ACC.json upload "$MP4" --line $LINE --copyright 1 --tid $TID \
  "${COVER_ARGS[@]}" --title "$TITLE" --desc "$DESC" --tag "$TAGS" < /dev/null > "$LOG" 2>&1
CODE=$?
BV=$(tr '\r' '\n' < "$LOG" | sed 's/\x1b\[[0-9;]*m//g' | grep -o -E 'BV[0-9A-Za-z]{10}' | head -1)
if [ $CODE -eq 0 ] && [ -n "$BV" ]; then echo "投稿成功 $BV https://www.bilibili.com/video/$BV"
else echo "投稿失败（exit $CODE），日志：$LOG"; tr '\r' '\n' < "$LOG" | sed 's/\x1b\[[0-9;]*m//g' | grep -v '^\s*$' | tail -6; exit 1; fi
