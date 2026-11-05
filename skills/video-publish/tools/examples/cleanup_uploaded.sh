#!/bin/zsh
# 清理已上传 B 站（有 BV 号）的成片和中间文件。由 Claude 维护，用户运行：zsh ~/Videos/nudgecode-算法/cleanup_uploaded.sh
# 只删 upload_meta.md 里"结果"有 BV 号的那一集的 mp4；章节全部集都传完才删 out/check、out/bundle 和独立 node_modules。
cd ~/Videos/nudgecode-算法
for c in */; do c=${c%/}; m=$c/out/upload_meta.md; [ -f $m ] || continue
  all=1
  for k in 1 2 3 4 5; do
    [ -f $c/out/ep$k.mp4 ] || continue
    if awk -v k="## EP$k" '$0==k{f=1;next} /^## /{f=0} f&&/结果：BV/{ok=1} END{exit !ok}' $m; then
      rm -f $c/out/ep$k.mp4 $c/out/ep$k.raw.mp4 && echo "删除 $c/out/ep$k.mp4"
    else all=0; fi
  done
  if [ $all = 1 ] && ! ls $c/out/ep*.mp4 >/dev/null 2>&1; then
    rm -rf $c/out/check $c/out/bundle && echo "删除 $c/out/check、out/bundle"
    if [ -d $c/node_modules ] && [ ! -L $c/node_modules ]; then rm -rf $c/node_modules && ln -s ../node_modules $c/node_modules && echo "$c/node_modules → 共享软链"; fi
  fi
done
rm -rf "${TMPDIR:-/tmp}"/remotion-webpack-bundle-* 2>/dev/null
df -h /System/Volumes/Data | tail -1
