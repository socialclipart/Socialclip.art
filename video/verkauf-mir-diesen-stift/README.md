# Verkauf mir diesen Stift – socialclip.art

Motion-Graphics-Spot im Stil „Wall-Street-Broker“, 1080×1920 (9:16), 30 fps, 42 s, Deutsch.

**Finale Datei:** `renders/Verkauf mir diesen Stift v1.mp4` (H.264 + AAC 48 kHz, −15,9 LUFS, True Peak ca. −1,9 dBFS)

## Inhalt
| Ordner | Was |
|---|---|
| `audio/vo/` | ElevenLabs-Aufnahmen: Sprecher „Hans – Deep Warm German“ (Take 1 verwendet), zweite Stimme „Jan – Laid-back Storyteller“ |
| `audio/vo_master.wav` | Geschnittene Sprachspur (Take 1 + zweite Stimme in der Pause vor „Eben.“) |
| `audio/sfx.py` → `audio/sfx.wav` | Prozedural erzeugte, geseedete Sound-Effekte (keine Fremd-Samples) |
| `audio/mix_v1.wav` | Endmischung (Stimme + SFX mit Ducking) |
| `src/` | Deterministischer Canvas-Renderer, Szenen in `src/scenes/`, Timing in `src/beats.js` |
| `plan/beats.json` | Export der Timings (für `sfx.py`) |

## Neu rendern
```bash
node -e "import('./src/beats.js').then(m=>require('fs').writeFileSync('plan/beats.json',JSON.stringify({vo:m.VO,events:m.EV},null,1)))"
python3 -I audio/sfx.py
# Mischung siehe Befehle im Projektverlauf (ffmpeg: Sidechain-Ducking, Limiter, −16 LUFS)
NODE_PATH=/opt/node22/lib/node_modules node src/render.js --fps 30 --out renders --name "Verkauf mir diesen Stift v2" --audio audio/mix_v1.wav
```

## Lizenzen
- Schriften: Playfair Display und Oswald, SIL Open Font License 1.1 (`assets/fonts/LICENSE-*.txt`), via @fontsource 5.0.8.
- Logo: socialclip.art (eigene Marke, aus `/logo`).
- Stimmen: ElevenLabs-Generierung über das Konto des Kunden; Nutzungsrechte gemäß ElevenLabs-Bedingungen des jeweiligen Tarifs.
- SFX: vollständig prozedural erzeugt.
- Keine Filmausschnitte, Filmmusik oder Darsteller-Abbilder verwendet; nur eine Anspielung auf die bekannte Stift-Szene.
