#!/usr/bin/env bash
# Baut SFX + Mix für alle Regeln und Stimmen. Aufruf aus dem Projektordner.
set -euo pipefail
mkdir -p cache/tl audio/mix
node -e "
import('./src/data.js').then(m=>{const fs=require('fs');
for(const v of ['karlsson','thorsten'])for(let n=1;n<=5;n++){const t=m.timeline(n,v);
fs.writeFileSync('cache/tl/'+v+'_'+n+'.json',JSON.stringify({n,dur:t.dur,lines:t.lines.map(({next,...l})=>({...l,next:isFinite(next)?next:null}))}));}})"
for v in karlsson thorsten; do
  for n in 1 2 3 4 5; do
    python3 -I tools/sfx_series.py cache/tl/${v}_${n}.json cache/sfx_${v}_${n}.wav
    DUR=$(node -e "console.log(require('./cache/tl/${v}_${n}.json').dur)")
    ffmpeg -hide_banner -loglevel error -y -i audio/vo_${v}/regel${n}.wav -i cache/sfx_${v}_${n}.wav -filter_complex "\
[0:a]adelay=700:all=1,apad,atrim=0:${DUR},volume=12dB,acompressor=threshold=-18dB:ratio=2.5:attack=8:release=120,aformat=channel_layouts=stereo,asplit=2[vo][sc];\
[1:a]volume=-2dB[fx];[fx][sc]sidechaincompress=threshold=0.05:ratio=4:attack=10:release=250[fxd];\
[vo][fxd]amix=inputs=2:normalize=0[m]" -map "[m]" -c:a pcm_s24le cache/pre_${v}_${n}.wav
    I=$(ffmpeg -hide_banner -nostats -i cache/pre_${v}_${n}.wav -af ebur128 -f null - 2>&1 | grep -A6 Summary | awk '/I:/{print $2}')
    G=$(python3 -c "print(round(-16-(${I}),2))")
    ffmpeg -hide_banner -loglevel error -y -i cache/pre_${v}_${n}.wav -af "volume=${G}dB,alimiter=limit=0.79:attack=3:release=60:level=false" -c:a pcm_s24le audio/mix/${v}_regel${n}.wav
    echo "$v $n I_pre=$I gain=$G"
  done
done
