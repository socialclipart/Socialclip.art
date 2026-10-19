#!/usr/bin/env bash
# Komplett-Build: ./build.sh <scene.html> <arbeitsordner> <ausgabe.mp4> [glitch-intensitaet]
set -euo pipefail
DIR="$(cd "$(dirname "$0")" && pwd)"; SCENE="$1"; WORK="$2"; OUT="$3"; AMT="${4:-1.0}"
mkdir -p "$WORK"; rm -rf "$WORK/frames"
NODE_PATH="$(npm root -g)" node "$DIR/render.js" "$SCENE" "$WORK/frames" 30
python3 -I "$DIR/sound.py" "$WORK/music.wav"
python3 -I "$DIR/post.py" "$WORK/frames" "$WORK/music.wav" "$WORK/master.mp4" "$AMT"
# Handytaugliche Größe (~20 MB bei 25 s): Filmkorn bläht CRF-Encodes auf über 200 MB auf
ffmpeg -loglevel error -y -i "$WORK/master.mp4" -c:v libx264 -b:v 7M -pass 1 -passlogfile "$WORK/x264" -preset slow -an -f mp4 /dev/null
ffmpeg -loglevel error -y -i "$WORK/master.mp4" -c:v libx264 -b:v 7M -maxrate 9M -bufsize 14M -pass 2 -passlogfile "$WORK/x264" -preset slow \
  -pix_fmt yuv420p -profile:v high -level 4.2 -c:a aac -b:a 192k -movflags +faststart "$OUT"
ls -la "$OUT"
