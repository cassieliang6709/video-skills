"""逐句配音并生成 src/timeline.json 与字幕。voice: volc（默认，火山引擎），或 edge-tts 音色名（如 zh-CN-XiaoyiNeural）。
火山默认用预置音色 zh_female_vv_uranus_bigtts（seed-tts-2.0）；front matter 的 volc_speaker / volc_resource 可以换。
火山凭证缺失时自动退回 edge-tts 晓伊。
usage: python3 tools/tts.py [--force] [--only epK]"""
import asyncio, json, subprocess, pathlib, sys, hashlib
import base64, os, urllib.request, uuid
ROOT = pathlib.Path(__file__).resolve().parent.parent
script = json.loads((ROOT / "script/script.json").read_text())
FPS, PAD = 30, 0.45
VOICE, RATE = script.get("voice", "volc"), script.get("rate", "+0%")
audio_dir = ROOT / "public/audio"; audio_dir.mkdir(parents=True, exist_ok=True)
force = "--force" in sys.argv

VOLC_DEFAULT_SPEAKER, VOLC_DEFAULT_RESOURCE = "zh_female_vv_uranus_bigtts", "seed-tts-2.0"
def key(text): return hashlib.md5(f"{VOICE}|{script.get('volc_speaker', VOLC_DEFAULT_SPEAKER)}|{RATE}|{text}".encode()).hexdigest()[:10]
ONLY = None
if "--only" in sys.argv:                       # --only ep1：只合成这一集用到的章节，其他章节沿用已有音频
    ep = sys.argv[sys.argv.index("--only") + 1]
    ONLY = set(next(e["chapters"] for e in script.get("episodes", []) if e["id"] == ep))

def load_env(path="~/.volc_tts.env"):
    env = {}
    p = pathlib.Path(path).expanduser()
    if p.exists():
        for line in p.read_text().splitlines():
            if "=" in line and not line.strip().startswith("#"):
                k, v = line.split("=", 1); env[k.strip()] = v.strip().strip('"')
    env = {**env, **{k: v for k, v in os.environ.items() if k.startswith("VOLC_")}}
    if script.get("volc_speaker"):                     # 逐字稿里指定音色（预置音色或 S_ 开头的复刻音色）
        env["VOLC_SPEAKER_ID"] = script["volc_speaker"]
        env["VOLC_RESOURCE"] = env.get("VOLC_RESOURCE", "seed-icl-2.0") if script["volc_speaker"].startswith("S_") else VOLC_DEFAULT_RESOURCE
    else:                                              # 默认预置音色，不用 env 里的复刻音色
        env["VOLC_SPEAKER_ID"], env["VOLC_RESOURCE"] = VOLC_DEFAULT_SPEAKER, VOLC_DEFAULT_RESOURCE
    if script.get("volc_resource"): env["VOLC_RESOURCE"] = script["volc_resource"]
    return env

VOLC_KEYS = ["VOLC_APPID", "VOLC_TOKEN", "VOLC_SPEAKER_ID"]
if VOICE == "volc" and not all(load_env().get(k) for k in VOLC_KEYS):
    print("⚠️  ~/.volc_tts.env 缺少火山引擎凭证，本次改用 edge-tts zh-CN-XiaoyiNeural", flush=True)
    VOICE = "zh-CN-XiaoyiNeural"

def volc_tts(text, mp3):
    """火山引擎语音合成。凭证放在 ~/.volc_tts.env：VOLC_APPID=...  VOLC_TOKEN=...
    音色和资源见 load_env：默认预置音色 + seed-tts-2.0；复刻音色用 seed-icl-2.0；resource 写 v1 则走旧版 volcano_icl 接口"""
    env = load_env()
    for k in VOLC_KEYS:
        if not env.get(k): raise SystemExit(f"缺少 {k}，请写入 ~/.volc_tts.env")
    speed = float(env.get("VOLC_SPEED", "1.0"))
    if env.get("VOLC_RESOURCE", "seed-icl-2.0") == "v1":
        body = {"app": {"appid": env["VOLC_APPID"], "token": env["VOLC_TOKEN"], "cluster": env.get("VOLC_CLUSTER", "volcano_icl")},
                "user": {"uid": "explainer-video"},
                "audio": {"voice_type": env["VOLC_SPEAKER_ID"], "encoding": "mp3", "speed_ratio": speed},
                "request": {"reqid": str(uuid.uuid4()), "text": text, "operation": "query"}}
        req = urllib.request.Request("https://openspeech.bytedance.com/api/v1/tts", data=json.dumps(body).encode(),
                                     headers={"Authorization": f"Bearer;{env['VOLC_TOKEN']}", "Content-Type": "application/json"})
        res = json.loads(urllib.request.urlopen(req, timeout=60).read())
        if res.get("code") != 3000: raise RuntimeError(f"火山引擎 TTS 失败：{res.get('code')} {res.get('message')}")
        pathlib.Path(mp3).write_bytes(base64.b64decode(res["data"])); return
    # v3 单向流式 HTTP：逐行返回 JSON，data 字段是 base64 音频片段
    body = {"user": {"uid": "explainer-video"},
            "req_params": {"text": text, "speaker": env["VOLC_SPEAKER_ID"],
                           "audio_params": {"format": "mp3", "sample_rate": 24000, "speech_rate": int(round((speed - 1) * 100))}}}
    req = urllib.request.Request("https://openspeech.bytedance.com/api/v3/tts/unidirectional", data=json.dumps(body).encode(),
                                 headers={"X-Api-App-Id": env["VOLC_APPID"], "X-Api-Access-Key": env["VOLC_TOKEN"],
                                          "X-Api-Resource-Id": env.get("VOLC_RESOURCE", "seed-icl-2.0"),
                                          "X-Api-Request-Id": str(uuid.uuid4()), "Content-Type": "application/json"})
    audio, last = bytearray(), {}
    with urllib.request.urlopen(req, timeout=120) as r:
        for line in r:
            line = line.strip()
            if not line: continue
            last = json.loads(line)
            if last.get("code", 0) not in (0, 20000000):
                raise RuntimeError(f"火山引擎 TTS 失败：{last.get('code')} {last.get('message')}")
            if last.get("data"): audio += base64.b64decode(last["data"])
    if not audio: raise RuntimeError(f"火山引擎没有返回音频：{last}")
    pathlib.Path(mp3).write_bytes(bytes(audio))

def volc_retry(text, mp3):
    """火山引擎按账号限并发：多个项目同时配音会报 concurrency，退避重试"""
    import time
    for k in range(12):
        try:
            return volc_tts(text, mp3)
        except RuntimeError as e:
            if "concurrency" not in str(e).lower() or k == 11: raise
            time.sleep(5 + 5 * k)

async def synth(text, wav, sem):
    stamp = wav.with_suffix(".key")
    if not force and wav.exists() and stamp.exists() and stamp.read_text() == key(text):
        return
    async with sem:
        mp3 = wav.with_suffix(".mp3")
        for attempt in range(4):
            try:
                if VOICE == "volc":
                    await asyncio.to_thread(volc_retry, text, mp3)
                else:
                    import edge_tts
                    await edge_tts.Communicate(text, VOICE, rate=RATE).save(str(mp3))
                break
            except Exception as e:
                if attempt == 3: raise
                await asyncio.sleep(2)
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(mp3), "-ar", "48000", str(wav)], check=True)
        mp3.unlink(); stamp.write_text(key(text))

def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)]).strip())

PUNCT = "，。；：？！、"
def width(t): return sum(0.5 if ord(c) < 128 else 1 for c in t)

def split_cues(text, max_w=22):
    """把一句字幕按标点拆成若干短条（每条不超过 max_w 个汉字宽），返回 [(条文本, 权重)]"""
    pieces, buf = [], ""
    for c in text:
        buf += c
        if c in PUNCT: pieces.append(buf); buf = ""
    if buf: pieces.append(buf)
    cues, cur = [], ""
    for pc in pieces:
        if cur and width(cur + pc) > max_w: cues.append(cur); cur = pc
        else: cur += pc
    if cur: cues.append(cur)
    out = []
    for c in cues:                                   # 超长的单段（无标点）再按宽度硬切
        while width(c) > max_w * 1.4:
            k, w = 0, 0
            while w < max_w: w += 0.5 if ord(c[k]) < 128 else 1; k += 1
            out.append(c[:k]); c = c[k:]
        out.append(c)
    show = [c.rstrip("，、；：。") for c in out]
    return [(sh, max(width(c), 1)) for sh, c in zip(show, out)]

def ts(sec):
    h, r = divmod(sec, 3600); m, s = divmod(r, 60)
    return f"{int(h):02}:{int(m):02}:{int(s):02},{int(round((s % 1) * 1000)) % 1000:03}"

async def main():
    sem = asyncio.Semaphore(2); jobs = []  # 火山并发上限按账号算，别的项目可能同时在配音
    for ch in script["chapters"]:
        if ONLY is not None and ch["id"] not in ONLY: continue
        for i, b in enumerate(ch["beats"]):
            jobs.append(synth(b.get("tts", b["text"]), audio_dir / f"{ch['id']}_{i:02}.wav", sem))
    await asyncio.gather(*jobs)
asyncio.run(main())

missing = []
timeline = {"fps": FPS, "title": script.get("title", ""), "subtitle": script.get("subtitle", ""), "episodes": script.get("episodes", []), "chapters": []}
(ROOT / "out").mkdir(exist_ok=True)
for ch in script["chapters"]:
    beats, start, srt = [], 0, []
    for i, b in enumerate(ch["beats"]):
        wav = audio_dir / f"{ch['id']}_{i:02}.wav"
        if wav.exists(): d = dur(wav)
        else: d = max(1.0, width(b.get("tts", b["text"])) / 4.5); missing.append(wav.name)   # 没配音（--only 跳过的章节）：按字数估算
        frames = round((d + PAD) * FPS)
        parts = split_cues(b["text"]); total = sum(w for _, w in parts); acc = 0.0; cues = []
        for txt, w in parts:
            a = acc / total * d; acc += w; e = acc / total * d
            cues.append({"text": txt, "from": round(a * FPS), "to": round(e * FPS)})
            srt.append(f"{len(srt)+1}\n{ts(start/FPS + a)} --> {ts(start/FPS + e)}\n{txt}\n")
        beats.append({"text": b["text"], "audio": f"audio/{wav.name}", "from": start, "frames": frames, "cues": cues})
        start += frames
    timeline["chapters"].append({"id": ch["id"], "title": ch["title"], "beats": beats, "frames": start})
    (ROOT / f"out/{ch['id']}.srt").write_text("\n".join(srt))
    print(ch["id"], f"{start / FPS:.1f}s")
if missing: print(f"注意：{len(missing)} 句还没有配音，时长按字数估算（渲染前要补配）")
(ROOT / "src/timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=1))
