#!/usr/bin/env python3
"""Lay a voiceover onto a reel built by make_reel.py, one sentence per text card.

Usage:
    python3 tools/add_voice.py REEL.mp4 VOICE.mp3 OUTPUT.mp4 [LINES.json]

The voice file must contain the reel's text cards in order,
separated by short pauses. Pauses are detected with silencedetect, the take
is cut into one clip per sentence, and each clip starts just after its text
fades in. The video stream is copied untouched.
"""
import re
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from make_reel import load_lines  # noqa: E402

LEAD = 0.15  # seconds between text fade-in and first spoken syllable


def speech_spans(voice):
    log = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", voice,
         "-af", "silencedetect=noise=-38dB:d=0.18", "-f", "null", "-"],
        capture_output=True, text=True).stderr
    dur = float(subprocess.check_output([
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=nw=1:nk=1", voice]).decode())
    starts = [float(x) for x in re.findall(r"silence_start: ([\d.]+)", log)]
    ends = [float(x) for x in re.findall(r"silence_end: ([\d.]+)", log)]
    spans, pos = [], 0.0
    for s, e in zip(starts, ends):
        if s > pos + 0.05:
            spans.append((pos, s))
        pos = e
    if dur > pos + 0.05:
        spans.append((pos, dur))
    return spans


def main():
    reel, voice, out = sys.argv[1:4]
    lines = load_lines(sys.argv[4] if len(sys.argv) > 4 else None)
    spans = speech_spans(voice)
    if len(spans) != len(lines):
        sys.exit(f"Found {len(spans)} spoken phrases, expected {len(lines)}.")

    parts, labels = [], []
    for i, ((a, b), line) in enumerate(zip(spans, lines)):
        a, b = max(a - 0.04, 0), b + 0.12
        delay = int((line[0] + LEAD) * 1000)
        parts.append(f"[1:a]atrim={a}:{b},asetpts=PTS-STARTPTS,"
                     f"afade=t=out:st={b - a - 0.06}:d=0.06,"
                     f"adelay={delay}|{delay}[v{i}]")
        labels.append(f"[v{i}]")
    parts.append(
        "".join(labels) + f"amix=inputs={len(labels)}:normalize=0,"
        # a little room and warmth for the trailer feel, then loudness for IG
        "aecho=0.8:0.6:60|120:0.18|0.10,"
        "bass=g=3:f=110,"
        "loudnorm=I=-14:TP=-1.5:LRA=11,apad[a]")

    subprocess.run([
        "ffmpeg", "-v", "error", "-y", "-i", reel, "-i", voice,
        "-filter_complex", ";".join(parts),
        "-map", "0:v", "-map", "[a]", "-c:v", "copy",
        "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-shortest",
        "-movflags", "+faststart", out,
    ], check=True)
    print(out)


if __name__ == "__main__":
    main()
