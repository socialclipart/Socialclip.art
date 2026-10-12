#!/usr/bin/env python3
"""Build a dark, cinematic 9:16 Instagram reel with centred German text.

Usage:
    python3 tools/make_reel.py INPUT.mp4 OUTPUT.mp4 [--slow 1.5]

Text lines and their timing live in LINES below. Each entry is shown on
its own, faded in and out, centred on the frame. Lines are upper-cased and
auto-sized to fit the safe width. The source audio is dropped (add a
licensed track in the Instagram app instead) and replaced by silence.
"""
import argparse
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import ImageFont

W, H = 1080, 1920
FONT = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
MAX_TEXT_W = 900          # keeps text inside Instagram's safe area
LINE_GAP = 1.12           # line height as a multiple of font size
FADE_IN, FADE_OUT = 0.35, 0.30

# (start, end, [rows], max font size)
LINES = [
    (0.6,  4.6,  ["NIEMAND KOMMT,", "UM DICH", "ZU RETTEN."], 120),
    (5.0,  8.0,  ["KEIN RETTER."], 130),
    (8.4,  11.6, ["KEIN", "PERFEKTER", "MOMENT."], 130),
    (12.0, 14.6, ["NUR DU."], 160),
    (15.0, 18.0, ["STEH AUF."], 190),
]


def fit_size(rows, max_size):
    size = max_size
    while size > 40:
        font = ImageFont.truetype(FONT, size)
        if max(font.getlength(r) for r in rows) <= MAX_TEXT_W:
            return size
        size -= 2
    return size


def esc(text):
    return text.replace("\\", "\\\\").replace(":", "\\:").replace("'", "\\'").replace(",", "\\,").replace("%", "\\%")


def drawtext_filters(tmp):
    out = []
    for i, (a, b, rows, max_size) in enumerate(LINES):
        size = fit_size(rows, max_size)
        alpha = (f"if(lt(t,{a}),0,if(lt(t,{a + FADE_IN}),(t-{a})/{FADE_IN},"
                 f"if(lt(t,{b - FADE_OUT}),1,if(lt(t,{b}),({b}-t)/{FADE_OUT},0))))")
        block_h = size * LINE_GAP * len(rows)
        for j, row in enumerate(rows):
            # one drawtext per row so every row is centred individually
            txt = Path(tmp) / f"l{i}_{j}.txt"
            txt.write_text(row, encoding="utf-8")
            y = f"(h-{block_h:.0f})/2+{j * size * LINE_GAP:.0f}"
            out.append(
                f"drawtext=fontfile={FONT}:textfile={esc(str(txt))}:fontsize={size}"
                f":fontcolor=white:x=(w-text_w)/2:y={y}"
                f":shadowcolor=black@0.65:shadowx=0:shadowy=6"
                f":borderw=3:bordercolor=black@0.55"
                f":alpha='{alpha}':enable='between(t,{a},{b})'"
            )
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("output")
    ap.add_argument("--slow", type=float, default=1.5,
                    help="slow-motion factor to stretch short clips")
    args = ap.parse_args()

    dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", args.input]).decode())
    total = min(round(dur * args.slow, 2), 30.0)
    if total < 15:
        sys.exit(f"Clip would only be {total}s long; raise --slow.")

    with tempfile.TemporaryDirectory() as tmp:
        vf = ",".join([
            f"setpts={args.slow}*PTS",
            "fps=30",
            f"scale={W}:{H}:force_original_aspect_ratio=increase",
            f"crop={W}:{H}",
            # dark, cool, low-saturation trailer grade
            "eq=brightness=-0.07:contrast=1.18:saturation=0.75:gamma=0.92",
            "colorbalance=rs=-0.05:gs=-0.01:bs=0.06:rh=0.03:bh=-0.03",
            "vignette=angle=PI/4.2",
            "noise=alls=3:allf=t",
            *drawtext_filters(tmp),
            "fade=t=in:st=0:d=0.6",
            f"fade=t=out:st={total - 0.8}:d=0.8",
            "format=yuv420p",
        ])
        subprocess.run([
            "ffmpeg", "-v", "error", "-y", "-i", args.input,
            "-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo",
            "-filter_complex", f"[0:v]{vf}[v]",
            "-map", "[v]", "-map", "1:a", "-t", str(total),
            "-c:v", "libx264", "-preset", "slow", "-crf", "21",
            "-profile:v", "high", "-r", "30",
            "-c:a", "aac", "-b:a", "128k",
            "-movflags", "+faststart", args.output,
        ], check=True)
    print(f"{args.output}: {total}s")


if __name__ == "__main__":
    main()
