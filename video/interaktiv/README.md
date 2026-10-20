# Interaktive Action-Hooks (3D)

Zwei Mitmach-Reels, 1080×1920, 30 fps, mit echter 3D-Grafik (Three.js 0.160), eigener Musik (120 BPM), Sound-Effekten und Sprecher.

| Datei | Länge | Idee |
|---|---|---|
| `renders/Interaktiv 1 Stopp das Video v1.mp4` | 13 s | 3D-Spielautomat. 8 Sekunden lang wechselt das Ergebnis **alle 3 Bilder** (0,1 s), also zeigt jedes Pausieren etwas anderes. „Was hast du? Schreib’s in die Kommentare.“ |
| `renders/Interaktiv 2 Nur 1 Prozent v1.mp4` | 14 s | 3D-Logo wechselt die Farbe (Silber, Bronze, Gelb, Weiß, Orange, Grün, Kupfer …). **Gold nur 3 Bilder lang** (9,42–9,52 s). Wer genau dann pausiert, hat gewonnen. |

## Wichtig für dich
- **„GRATIS-ANALYSE“** ist eines der möglichen Ergebnisse im Spielautomaten. Wer das in die Kommentare schreibt, erwartet sie wahrscheinlich, also **anbieten** (guter Lead!) oder in `src/scenes/slot.js` (`PRIZES`) ersetzen und neu rendern.
- Die Ergebnisse sind sonst augenzwinkernd gemeint (z. B. „10.000 FOLLOWER“, „LEIDER NICHTS“) und kein Versprechen.
- Gold verrät sich nicht durch Sound: Jede Farbe hat denselben Effekt-Sound.

## Technik
| Pfad | Inhalt |
|---|---|
| `src/scenes/slot.js`, `src/scenes/gold.js` | 3D-Szenen + 2D-Texte; Zeitplan in `T` am Dateianfang |
| `src/scenes/three_common.js` | Renderer, Umgebungslicht (RoomEnvironment), Projektion |
| `tools/tts_lines.py` | Sprecher-Zeilen mit Piper, Stimme Thorsten (CC0) |
| `tools/music.py` | Prozeduraler Beat (Kick, Clap, Hats, 808, Arp, Pad), a-Moll, 120 BPM, keine Fremd-Samples |
| `tools/sfx.py`, `tools/sfxlib.py` | Prozedurale Sound-Effekte |
| `tools/build_audio.sh` | Stimme + Musik (geduckt) + SFX → `audio/<hook>_mix.wav`, −15 LUFS |

Neu bauen:
```bash
npm install                      # three@0.160.0
/root/.cache/motion-video-director/whisper-venv/bin/python -I tools/tts_lines.py
./tools/build_audio.sh
NODE_PATH=/opt/node22/lib/node_modules node src/render.js --hook slot --out renders --name "Interaktiv 1 Stopp das Video v2" --audio audio/slot_mix.wav
NODE_PATH=/opt/node22/lib/node_modules node src/render.js --hook gold --out renders --name "Interaktiv 2 Nur 1 Prozent v2" --audio audio/gold_mix.wav
```

Lizenzen: Three.js (MIT), Stimme Thorsten (CC0), Schriften Playfair Display/Oswald (OFL), Musik + SFX prozedural erzeugt, Logo socialclip.art.

---

## Instagram-Texte

**Reel 1: Stopp das Video**
```
STOPP ✋ Drück auf Pause – genau jetzt!

Was zeigt dein Spielautomat? 🎰
Schreib dein Ergebnis in die Kommentare 👇

(Wer „GRATIS-ANALYSE“ erwischt, bekommt sie wirklich. 😉)

#socialclipart #socialmediamarketing #marketing #reels #pausechallenge #jackpot #instagramtipps #unternehmer #kmu #onlinemarketing
```

**Reel 2: Nur 1 % schafft das**
```
Nur 1 % schafft das. 🧠⚡
Pausiere das Video genau dann, wenn das Logo GOLD ist.

Geschafft? Schreib „GOLD“ in die Kommentare 👇
Nicht geschafft? Keine Sorge – Marketing machen wir für dich. 😎

#socialclipart #reaktionstest #challenge #nur1prozent #socialmediamarketing #marketing #reels #unternehmer #kmu
```

Tipp: Beim Posten als **Titelbild** einen Frame mit „STOPP!“ bzw. „NUR 1 %“ wählen. In den ersten Stunden auf Kommentare antworten („Krass, du hast den Jackpot! 🎰“), das pusht die Reichweite.
