#!/usr/bin/env bash
set -euo pipefail
export NODE_PATH=/opt/node22/lib/node_modules
for v in karlsson thorsten; do
  for n in 1 2 3 4 5; do
    name="Wolf-Regel ${n} (${v}) v1"
    [ -f "renders/${name}.mp4" ] && continue
    node src/render.js --rule $n --voice $v --fps 30 --scale 1 --out renders --name "$name" --audio audio/mix/${v}_regel${n}.wav 2>&1 | tail -1
  done
done
