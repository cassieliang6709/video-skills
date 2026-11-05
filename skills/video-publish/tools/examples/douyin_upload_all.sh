#!/bin/zsh
# 抖音批量上传（由用户在自己的终端运行）：按 douyin_queue.tsv（章	集	标题≤30字	简介）顺序上传。
# 成功：从队列删掉并记入 douyin_queue.log；失败：停下，保留在队首，修好后重跑本脚本会从这一集接着传。
# 用法：zsh ~/Videos/nudgecode-算法/douyin_upload_all.sh
cd ~/Videos/nudgecode-算法; ROOT=$PWD; Q=douyin_queue.tsv
export DOUYIN_COOKIE_AUTH_HEADLESS=false   # 无头检查登录偶尔超时，误判 cookie 失效
TAGS="算法,LeetCode,Python,数据结构,刷题,编程"
CK=~/tools/social-auto-upload/cookies/douyin_YOUR_ACCOUNT.json
if [ ! -f $CK ]; then
  echo "还没登录抖音：马上弹出 Chrome，请用抖音 App 扫码登录。"
  (cd ~/tools/social-auto-upload && .venv/bin/sau douyin login --account YOUR_ACCOUNT --headed) || { echo "✗ 登录失败，把上面的输出发给 Claude"; exit 1; }
  [ -f $CK ] || { echo "✗ 没有生成登录文件，把上面的输出发给 Claude"; exit 1; }
fi
while [ -s $Q ]; do
  IFS=$'\t' read -r c k title desc < $Q
  f=$ROOT/$c/out/ep$k.mp4; cov=$ROOT/$c/out/covers/ep${k}_43.jpg
  [ $k = full ] && { f=$ROOT/$c/out/chapter.mp4; cov=$ROOT/$c/out/covers/ep1_43.jpg; }   # 整章合集
  echo "▶ $(date +%H:%M) 上传 $c ep$k：$title"
  ok=1
  for try in 1 2; do   # 第一次若被误判"cookie 失效"，等 20 秒再试一次
    (cd ~/tools/social-auto-upload && .venv/bin/sau douyin upload-video --account YOUR_ACCOUNT \
       --file $f --title "$title" --desc "$desc" --tags "$TAGS" \
       --thumbnail-landscape $cov --headed) && { ok=0; break; }
    [ $try = 1 ] && { echo "↻ 20 秒后重试一次"; sleep 20; }
  done
  if [ $ok -eq 0 ]; then
    echo "$(date +%H:%M) OK $c ep$k $title" >> douyin_queue.log
    tail -n +2 $Q > $Q.tmp && mv $Q.tmp $Q; sleep 60
  else
    echo "✗ $c ep$k 失败，已停下。处理完（如滑块验证、重新登录）后重跑本脚本即可。"; exit 1
  fi
done
echo "✓ 抖音队列已全部传完"
