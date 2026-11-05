"""script/script.md (逐字稿, 人工审阅的唯一来源) -> script/script.json
格式:
  ---                       (front matter: title / audience / voice / rate)
  ## ch1 | 章节标题
  1. 字幕文本（屏幕上显示的原话）
     - 读：朗读文本（可选，TTS 念的版本，符号要写成读法）
     - 画：这一句对应的画面说明
  > 批注……                  (审阅批注；存在未处理批注时拒绝转换)
usage: python3 tools/md2json.py [--ignore-notes]
"""
import json, re, sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
md = (ROOT / "script/script.md").read_text()
meta = {}
m = re.match(r"^---\n(.*?)\n---\n", md, re.S)
if m:
    for line in m.group(1).splitlines():
        if ":" in line:
            k, v = line.split(":", 1); meta[k.strip()] = v.strip()
    md = md[m.end():]
notes = [(i + 1, l) for i, l in enumerate(md.splitlines()) if l.lstrip().startswith(">")]
if notes and "--ignore-notes" not in sys.argv:
    print(f"还有 {len(notes)} 条未处理的批注，先处理后再转换：")
    for n, l in notes[:20]: print(f"  L{n}: {l.strip()}")
    sys.exit(1)
chapters, ch, beat = [], None, None
for raw in md.splitlines():
    line = raw.rstrip()
    if h := re.match(r"^##\s+(\w+)\s*\|\s*(.+)$", line):
        ch = {"id": h.group(1), "title": h.group(2).strip(), "beats": []}; chapters.append(ch); beat = None
    elif (b := re.match(r"^\d+\.\s+(.+)$", line)) and ch is not None:
        beat = {"text": b.group(1).strip()}; ch["beats"].append(beat)
    elif (sub := re.match(r"^\s+-\s*(读|画)[：:]\s*(.+)$", line)) and beat is not None:
        beat["tts" if sub.group(1) == "读" else "visual"] = sub.group(2).strip()
if "episodes" in meta:
    titles = [t.strip() for t in meta.pop("episode_titles", "").split("|")]
    meta["episodes"] = [{"id": f"ep{i+1}", "title": titles[i] if i < len(titles) else "", "chapters": [c.strip() for c in e.split(",")]}
                        for i, e in enumerate(meta["episodes"].split("|"))]
    ids = {c["id"] for c in chapters}
    for e in meta["episodes"]:
        for c in e["chapters"]: assert c in ids, f"episodes 里的 {c} 不存在"
out = {**meta, "chapters": chapters}
(ROOT / "script/script.json").write_text(json.dumps(out, ensure_ascii=False, indent=1))
print(f"{len(chapters)} 章, {sum(len(c['beats']) for c in chapters)} 句 -> script/script.json")
