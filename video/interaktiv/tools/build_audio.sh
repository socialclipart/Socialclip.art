#!/usr/bin/env bash
# Stimme + Musik + SFX -> audio/<hook>_mix.wav (ca. -15 LUFS, True Peak <= ~-1,5 dBFS). Aufruf aus dem Projektordner.
set -euo pipefail
declare -A DUR=( [slot]=13.0 [gold]=14.0 )
# Sprecher-Einsätze (Sekunden) – passend zu T in src/scenes/<hook>.js
declare -A VO=( [slot]="slot_stopp:0.10 slot_pause:0.75 slot_was:10.55 slot_komm:11.50" [gold]="gold_eins:0.20 gold_regel:1.75 gold_bereit:4.75 gold_und:11.15 gold_komm:12.45" )
for h in slot gold; do
  python3 -I tools/music.py $h cache/music_$h.wav
  python3 -I tools/sfx.py $h ${DUR[$h]} cache/sfx_$h.wav
  ins=""; fil=""; i=0
  for e in ${VO[$h]}; do k=${e%%:*}; s=${e#*:}; ins="$ins -i audio/vo/$k.wav"; ms=$(python3 -c "print(int($s*1000))"); fil="$fil[$i:a]adelay=${ms}:all=1[v$i];"; i=$((i+1)); done
  mix=$(for j in $(seq 0 $((i-1))); do printf "[v$j]"; done)
  ffmpeg -hide_banner -loglevel error -y $ins -filter_complex "${fil}${mix}amix=inputs=$i:normalize=0,apad,atrim=0:${DUR[$h]},volume=2dB,aformat=channel_layouts=stereo[vo]" -map "[vo]" -c:a pcm_s24le cache/vo_$h.wav
  ffmpeg -hide_banner -loglevel error -y -i cache/vo_$h.wav -i cache/music_$h.wav -i cache/sfx_$h.wav -filter_complex "\
[0:a]asplit=2[vo][sc];[sc]asplit=2[sc1][sc2];\
[1:a]volume=-9dB[mu];[mu][sc1]sidechaincompress=threshold=0.03:ratio=6:attack=15:release=300[mud];\
[2:a]volume=0dB[fx];[fx][sc2]sidechaincompress=threshold=0.05:ratio=3:attack=10:release=200[fxd];\
[vo][mud][fxd]amix=inputs=3:normalize=0[m]" -map "[m]" -c:a pcm_s24le cache/pre_$h.wav
  I=$(ffmpeg -hide_banner -nostats -i cache/pre_$h.wav -af ebur128 -f null - 2>&1 | grep -A6 Summary | awk '/I:/{print $2}')
  G=$(python3 -c "print(round(-15-(${I}),2))")
  ffmpeg -hide_banner -loglevel error -y -i cache/pre_$h.wav -af "volume=${G}dB,alimiter=limit=0.82:attack=2:release=60:level=false" -c:a pcm_s24le audio/${h}_mix.wav
  echo "$h I_pre=$I gain=$G -> $(ffmpeg -hide_banner -nostats -i audio/${h}_mix.wav -af ebur128=peak=true -f null - 2>&1 | grep -A14 Summary | grep -E 'I:|Peak:' | awk '{print $2}' | paste -sd' ')"
done
