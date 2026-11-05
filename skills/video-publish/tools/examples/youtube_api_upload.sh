#!/bin/zsh
# 用 YouTube Data API（youtubeuploader）上传一集，不开浏览器（第一次授权除外）。
# 用法：upload_api.sh <mp4> <封面jpg> <标题> <简介，\n 表示换行> <逗号分隔标签> [播放列表名]
# 前提：本目录有 client_secrets.json（Google Cloud 下载）；第一次运行会弹浏览器授权一次，之后用 request.token。
# 注意：项目没通过 Google 审核前，API 传的视频会被强制设为私有。
set -e
cd ${0:A:h}
MP4=${1:A}; COVER=${2:A}; TITLE=$3; DESC=$4; TAGS=$5; PL=${6:-nudgecode 算法图解}
META=$(mktemp -t ytmeta).json
python3 - "$META" "$TITLE" "$DESC" "$TAGS" "$PL" <<'P'
import json,sys;out,t,d,tags,pl=sys.argv[1:]
json.dump({"title":t,"description":d.replace("\\n","\n"),"tags":[x for x in tags.split(",") if x],
  "privacyStatus":"public","categoryId":"27","language":"zh-Hans","madeForKids":False,
  "playlistTitles":[pl]},open(out,"w"),ensure_ascii=False)
P
youtubeuploader -filename "$MP4" -thumbnail "$COVER" -metaJSON "$META" -secrets client_secrets.json -cache request.token
rm -f "$META"
