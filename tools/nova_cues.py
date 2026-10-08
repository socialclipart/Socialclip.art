"""Build subtitle cues for the Nova demo from the audio's speech segments.

usage: python3 -I nova_cues.py <wav> <index.html> [gap_seconds]

Make the WAV from the MP3 first (macOS):
  afconvert -f WAVE -d LEI16@16000 -c 1 audio/nova-demo.mp3 /tmp/nova.wav

Phrases below must match the recording. Each phrase gets one speech
segment (pauses >= gap); words inside a phrase are timed by length.
Writes the result between NOVA_CUES_START / NOVA_CUES_END in index.html.
"""
import sys, wave, struct, math, json, re

PHRASES = [
    "Hallo, ich bin Nova, deine persönliche Assistentin.",
    "Ich gehe ans Telefon, beantworte deine E-Mails",
    "und plane deine Termine.",
    "Auch nach Feierabend.",
    "Du kümmerst dich um dein Business.",
    "Ich mich um den Rest.",
]

# words that light up a skill chip when spoken
SKILLS = {"Telefon,": "calls", "E-Mails": "mail", "Termine.": "dates", "Feierabend.": "late"}

wav, html = sys.argv[1], sys.argv[2]
gap = float(sys.argv[3]) if len(sys.argv) > 3 else 0.18

w = wave.open(wav); sr = w.getframerate(); n = w.getnframes()
data = struct.unpack('<%dh' % n, w.readframes(n))
step = int(sr * 0.02)
env = [math.sqrt(sum(x * x for x in data[i:i + step]) / step) for i in range(0, n - step, step)]
thr = max(env) * 0.06
min_gap = int(gap / 0.02)

segs, start, silent, last = [], None, 0, 0
for i, e in enumerate(env):
    if e > thr:
        if start is None:
            start = i
        silent, last = 0, i
    elif start is not None:
        silent += 1
        if silent >= min_gap:
            segs.append([start * 0.02, (last + 1) * 0.02]); start, silent = None, 0
if start is not None:
    segs.append([start * 0.02, (last + 1) * 0.02])

# merge very short blips (< 0.3 s) into the following segment
merged = []
for s in segs:
    if merged and merged[-1][1] - merged[-1][0] < 0.3:
        merged[-1][1] = s[1]
    else:
        merged.append(s)
segs = merged

if len(segs) != len(PHRASES):
    sys.exit("found %d speech segments for %d phrases: %s" % (len(segs), len(PHRASES), segs))

cues = []
for (a, b), phrase in zip(segs, PHRASES):
    words = phrase.split()
    total = sum(len(x) + 1 for x in words)
    t, out = a, []
    for word in words:
        d = (b - a) * (len(word) + 1) / total
        item = {"w": word, "t": round(t, 2)}
        if word in SKILLS:
            item["s"] = SKILLS[word]
        out.append(item)
        t += d
    cues.append({"a": round(a, 2), "b": round(b, 2), "words": out})

js = "/* NOVA_CUES_START */\nconst NOVA_CUES = " + json.dumps(cues, ensure_ascii=False) + ";\n/* NOVA_CUES_END */"
src = open(html).read()
new, k = re.subn(r"/\* NOVA_CUES_START \*/.*?/\* NOVA_CUES_END \*/", lambda m: js, src, flags=re.S)
if k != 1:
    sys.exit("marker not found")
open(html, "w").write(new)
print("ok: %d cues, last ends at %.2f s" % (len(cues), cues[-1]["b"]))
