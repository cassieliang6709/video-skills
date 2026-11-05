#!/bin/zsh
# 测 B 站各上传线路的实际上传速度（上传 1 MB 随机数据），按速度从高到低排序
F=$(mktemp); head -c 1000000 /dev/urandom > $F
for l in tx bda2 alia txa bldsa; do
  r=$(curl -s -o /dev/null -w "%{http_code} %{speed_upload}" -m 20 -X POST --data-binary @$F "https://upos-cs-upcdn$l.bilivideo.com/OK" 2>/dev/null)
  echo "$l $r"
done | awk '$2==200 {printf "%-6s %7.0f KB/s\n", $1, $3/1024} $2!=200 {printf "%-6s 不可用\n", $1}' | sort -k2 -nr
rm -f $F
