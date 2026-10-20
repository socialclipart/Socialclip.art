# Hook-Pack – Action-Intros für Reels

Drei kurze Action-Hooks (1080×1920, 30 fps, ohne Stimme, nur Bild + Sound) im socialclip.art-Look. Jeder endet mit einem weißen Blitz, damit der Schnitt ins eigentliche Reel knallt.

| Datei | Länge | Inhalt |
|---|---|---|
| `renders/Hook 1 Glas-Crash v1.mp4` | 3,2 s | Feed scrollt → Display zersplittert → **STOPP. NICHT WEITERWISCHEN.** |
| `renders/Hook 2 Countdown-Bombe v1.mp4` | 3,6 s | Bombe 3-2-1 → Explosion mit Geldregen → **DEIN MARKETING IST LANGWEILIG?** |
| `renders/Hook 3 Kino-Trailer v1.mp4` | 4,0 s | Trailer-Hits: **IN EINER WELT, IN DER JEDER POSTET, GEWINNT NUR EINER.** → Logo |
| `renders/Beispiel Glas-Crash + Wolf-Regel 2 v1.mp4` | 30,7 s | Beispiel: Hook vor ein Reel geschnitten |

Lautheit ca. −15 LUFS (etwas lauter als die Reels mit −16 LUFS, damit der Einstieg knallt).

## Vor ein Reel schneiden
In CapCut/InShot/Instagram: Hook als ersten Clip, Reel direkt dahinter, **ohne Übergang** (harter Schnitt). Per ffmpeg:
```bash
ffmpeg -i "Hook 1 Glas-Crash v1.mp4" -i "MEIN REEL.mp4" -filter_complex "[0:v][0:a][1:v][1:a]concat=n=2:v=1:a=1[v][a]" -map "[v]" -map "[a]" -c:v libx264 -crf 18 -c:a aac out.mp4
```

## Neu bauen
`./tools/build.sh` (SFX + Lautheit), dann rendern:
`NODE_PATH=/opt/node22/lib/node_modules node src/render.js --hook glass|bomb|trailer --out renders --name "…" --audio audio/<hook>.wav`

Szenen: `src/scenes/glass.js`, `bomb.js`, `trailer.js`; Zeiten/Einschläge: `src/data.js`; Sounds: `tools/sfx_hooks.py` (prozedural, keine Fremd-Samples).
Schriften: Playfair Display, Oswald (SIL OFL 1.1).
