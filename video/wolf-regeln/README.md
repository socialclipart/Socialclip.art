# Wolf-Regeln für Social Media – Reel-Serie (5 Folgen)

Fünf Motion-Graphics-Reels im Look von „Verkauf mir diesen Stift“ (Schwarz/Gold), 1080×1920, 30 fps, je ca. 27–32 s, Deutsch.

**Fertige Videos:** `renders/`
- `Wolf-Regel N (karlsson) v1.mp4`: **Hauptversion**, Stimme „Karlsson“
- `Wolf-Regel N (thorsten) v1.mp4`: Reserve, Stimme „Thorsten“ (Lizenz sicher CC0, siehe unten)

**Instagram-Texte:** [`INSTAGRAM.md`](INSTAGRAM.md)

## Aufbau jeder Folge
1. Börsenglocke, „WOLF-REGEL #N“, die Regel als goldener Titel
2. Beispiel „falsch vs. richtig“ mit Illustration und Wort-für-Wort-Text
3. Logo + „Folge für Regel #N+1“ (Folge 5: „Link in der Bio“)

Oben links läuft eine Badge mit „#N“ mit, oben rechts zeigen 5 Punkte den Fortschritt in der Serie.

## Projekt
| Pfad | Inhalt |
|---|---|
| `src/rules.js` | **Einzige Quelle** für Sprechtext, Bildtext (`*gold*`, `~rot durchgestrichen~`), Pausen und Animations-Cues |
| `src/scenes/` | `text.js` (Intro/Titel/Text/Outro), `props.js` (Illustrationen je Regel), `bg.js`, `fx.js` |
| `tools/make_voice.sh`, `tools/tts_piper.py` | Lokale Sprachausgabe (Piper), Satz für Satz, mit Zeitstempeln → `src/timing.js` |
| `tools/sfx_series.py`, `tools/sfxlib.py` | Prozedurale Sound-Effekte aus der Zeitachse |
| `tools/build_audio.sh` | SFX + Mix (Ducking, −16 LUFS, True Peak ≈ −2 dBFS) für alle Folgen |
| `tools/render_all.sh` | Rendert alle 10 MP4s |
| `tools/transcribe.py` | Whisper-Kontrolle (lokal) |

### Neu bauen (nach Textänderung in `src/rules.js`)
```bash
./tools/make_voice.sh      # Stimmen + src/timing.js
./tools/build_audio.sh     # SFX + Mix
./tools/render_all.sh      # vorher alte renders/*.mp4 umbenennen oder Version im Skript erhöhen
```

## Lizenzen
- **Stimme Thorsten** (Piper `de_DE-thorsten-high`): Datensatz Thorsten-Voice, **CC0**. Kommerziell frei nutzbar.
- **Stimme Karlsson** (Piper `de_DE-karlsson-low`): Datensatz M-AILABS. Die Lizenz konnte von hier aus **nicht geprüft** werden (Website nicht erreichbar). **Vor kommerzieller Nutzung bitte prüfen:** https://www.caito.de/2019/01/03/the-m-ailabs-speech-dataset/. Falls nicht erlaubt: die Thorsten-Versionen posten.
- Schriften: Playfair Display, Oswald (SIL OFL 1.1, `assets/fonts/LICENSE-*.txt`).
- SFX: vollständig prozedural erzeugt. Logo: eigene Marke socialclip.art.
