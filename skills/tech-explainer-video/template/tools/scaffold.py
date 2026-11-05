"""根据 script/script.json 生成缺失的章节占位组件和 src/chapters/index.ts（已有章节文件不覆盖）
chN -> ChN.tsx（章节编号 N）；epK_start / epK_end -> 通用片头/片尾卡 EpCard（不编号、无标题卡）"""
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
s = json.loads((ROOT / "script/script.json").read_text())
d = ROOT / "src/chapters"; d.mkdir(parents=True, exist_ok=True)
imports, rows, card = [], [], False
for ch in s["chapters"]:
    cid = ch["id"]
    if re.fullmatch(r"ep\d+_(start|end)", cid):
        card = True
        rows.append(f'  {{ id: "{cid}", no: -1, C: makeEpCard("{cid}") }},')
        continue
    m = re.fullmatch(r"ch(\d+)", cid)
    name = f"Ch{m.group(1)}" if m else "Ch" + cid.capitalize()
    f = d / f"{name}.tsx"
    if not f.exists():
        f.write_text(f'import React from "react";\nimport {{ AbsoluteFill }} from "remotion";\nexport const {name}: React.FC = () => <AbsoluteFill />;\n')
    imports.append(f'import {{ {name} }} from "./{name}";')
    rows.append(f'  {{ id: "{cid}", no: {int(m.group(1)) if m else -1}, C: {name} }},')
if card: imports.append('import { makeEpCard } from "../lib/EpCard";')
(d / "index.ts").write_text("import React from \"react\";\n" + "\n".join(imports) +
    "\n\nexport const CHAPTERS: { id: string; no: number; C: React.FC }[] = [\n" + "\n".join(rows) + "\n];\n")
print("chapters:", ", ".join(c["id"] for c in s["chapters"]))
