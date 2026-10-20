#!/usr/bin/env bash
# TTS (Piper) für beide Stimmen + Nachbearbeitung + src/timing.js. Aufruf aus dem Projektordner.
set -euo pipefail
V=/root/.cache/motion-video-director/whisper-venv/bin/python; M=/root/.cache/motion-video-director/models/piper
node -e "import('./src/rules.js').then(m=>require('fs').writeFileSync('plan/script.json',JSON.stringify({rules:m.RULES.map(r=>r.lines.map(l=>[l.say,l.pause]))},null,1)))"
$V -I tools/tts_piper.py plan/script.json audio/vo_karlsson $M/de_DE-karlsson-low.onnx
$V -I tools/tts_piper.py plan/script.json audio/vo_thorsten $M/de_DE-thorsten-high.onnx
for n in 1 2 3 4 5; do
  ffmpeg -hide_banner -loglevel error -y -i audio/vo_karlsson/regel${n}_raw.wav -af "aresample=48000:resampler=soxr,asetrate=48000*0.96,aresample=48000,atempo=1.0416667,highpass=f=70,equalizer=f=160:t=q:w=1:g=3,equalizer=f=3000:t=q:w=1.2:g=2.5,acompressor=threshold=-20dB:ratio=3:attack=5:release=100:makeup=2" -c:a pcm_s24le audio/vo_karlsson/regel${n}.wav
  ffmpeg -hide_banner -loglevel error -y -i audio/vo_thorsten/regel${n}_raw.wav -af "asetrate=22050*0.92,aresample=48000,atempo=1.0869565,highpass=f=60,equalizer=f=140:t=q:w=1:g=3,equalizer=f=3500:t=q:w=1.2:g=2,equalizer=f=7500:t=q:w=1:g=-2,acompressor=threshold=-20dB:ratio=3:attack=5:release=100:makeup=2" -c:a pcm_s24le audio/vo_thorsten/regel${n}.wav
done
node -e "
const fs=require('fs');const T={};
for(const v of ['karlsson','thorsten']){T[v]={};for(let n=1;n<=5;n++)T[v][n]=JSON.parse(fs.readFileSync('audio/vo_'+v+'/regel'+n+'_raw.json'));}
fs.writeFileSync('src/timing.js','// Generiert aus audio/vo_*/regelN_raw.json (Satz-Zeiten der TTS).\nexport const TIMING = '+JSON.stringify(T)+';\n');"
