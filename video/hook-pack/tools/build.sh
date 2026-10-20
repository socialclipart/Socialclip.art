#!/usr/bin/env bash
# SFX + Lautheit (-15 LUFS, Limiter) + Render für alle Hooks. Aufruf aus dem Projektordner.
set -euo pipefail
export NODE_PATH=/opt/node22/lib/node_modules
for h in glass bomb trailer; do
  D=$(node -e "import('./src/data.js').then(m=>console.log(m.HOOKS['$h'].dur))")
  python3 -I tools/sfx_hooks.py $h $D cache/sfx_$h.wav
  I=$(ffmpeg -hide_banner -nostats -i cache/sfx_$h.wav -af ebur128 -f null - 2>&1 | grep -A6 Summary | awk '/I:/{print $2}')
  G=$(python3 -c "print(round(-15-(${I}),2))")
  ffmpeg -hide_banner -loglevel error -y -i cache/sfx_$h.wav -af "volume=${G}dB,alimiter=limit=0.84:attack=2:release=50:level=false" -c:a pcm_s24le audio/$h.wav
  echo "$h I_pre=$I gain=$G"
done
