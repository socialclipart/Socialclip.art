# Reel: „Ich mache aus einem Stein eine Luxusmarke“

**Datei:** `SocialClip_Stein_Luxusmarke_v2.mp4` — 1080 × 1920 (9:16), 30 fps, 20,0 s, H.264 + AAC 48 kHz Stereo.
Ton gemessen am fertigen MP4: −16,3 LUFS integriert, True Peak −5,3 dBFS (Stereo und Mono).

## Ablauf
| Zeit | Szene | Ton |
|---|---|---|
| 0–3 s | Stein fällt (ab Bild 1 in Bewegung) auf einen langweiligen Tisch. Text + Stimme: „Ich mache diesen Stein teuer.“ | Aufprall-„Klack“ bei 0,33 s, kleiner Nachhüpfer, Raumton |
| 3–6 s | Design-Cursor wählt den Stein aus, Raster und Konstruktionslinien, Farbfelder Schwarz / Champagner / Warmweiß, Schwarz flutet das Bild, Buchstaben S-T-O-N-E rasten im Takt ein | Klicks, Swipe, Whoosh, Pops, ein Tick pro Buchstabe, Glas-Ding |
| 6–8 s | Podest fährt unter den Stein, Kamerafahrt um denselben Stein | Whoosh + Aufsetzen, leiser Orbit-Swoosh |
| 8–10 s | Verpackung faltet sich um den Stein, Deckel mit geprägtem STONE-Logo schließt | Papierschieben, vier Falzgeräusche, Deckel-Aufsetzen |
| 10–12 s | Website „stone-maison.de“ scrollt durch die Produktseite, Klick auf „In den Warenkorb“ | Swoosh, Scroll-Ticks, Klick, Bestätigungston |
| 12–14 s | Dramatische Produktaufnahme mit Lichtkegel und Staub: „Millionen Jahre gereift.“ | tiefer Impact, Riser in den Höhepunkt |
| 14–17 s | Kampagnenbild: Stein thront auf der Verpackung, Licht-Sweep, Glanzlichter auf dem Beat | großer Hit, Musik auf vollem Höhepunkt |
| 17–20 s | Harter Schnitt zurück an den Tisch, Musik stoppt abrupt. „Immer noch ein Stein.“ / „Würdest du ihn kaufen? 😂“ | Stille + Raumton, trockene Stimme, Pop |

Das letzte Bild zeigt dieselbe Tisch-Einstellung wie der Anfang (Texte blenden bis 19,95 s aus), dadurch läuft der Loop nahtlos weiter: Der Stein liegt da — und fällt gleich wieder.

## Quellen und Lizenzen
- **Stimme:** lokal erzeugt mit Piper TTS, Stimme „thorsten (high)“ (Datensatz Thorsten-Voice, CC0).
- **Musik:** „Cat Walk“ von Arulo, Mixkit #371 — Mixkit Stock Music Free License (https://mixkit.co/license/#musicFree). Erlaubt u. a. Instagram/Social Media, auch kommerziell; nicht erlaubt: Registrierung bei Content ID, Weitergabe der Musikdatei allein. Verwendet: 3,68–14,68 s und 29,62–32,62 s des Tracks.
- **Geräusche:** Kenney (Impact Sounds, RPG Audio, Interface Sounds; CC0), Freesound CC0 (Shinplaster, deleted_user_3277771, qubodup, cabled_mess, LilMati, migoreng1, Sadiquecat, cMilan, MeanRaccoon, CVLTIV8R), Mixkit SFX #1530 „Paper slide“ (Mixkit Sound Effects Free License).
- **Schriften:** Bodoni Moda und Inter (SIL Open Font License, Google Fonts).
- Marke „STONE“, „Maison de Pierre“ und „stone-maison.de“ sind frei erfunden.

Paste-fertige Credits (optional, CC0 braucht keine Nennung):
```
Musik: „Cat Walk“ – Arulo (Mixkit) · Sounds: Kenney, Freesound (CC0), Mixkit · Stimme: Thorsten-Voice (CC0)
```

## Quellcode (`source/`)
- `main.js`, `index.html`, `data.js`, `render.js` — deterministischer Renderer (Three.js 0.160 + Canvas 2D, Playwright/Chromium). Jedes Bild hängt nur von der Zeit ab.
- `mix.py` — baut den Mix aus denselben Cue-Zeiten; `cues.json` listet jeden platzierten Sound.
- Nicht im Repo (Lizenz/Größe): Musik- und Mixkit-Dateien, Kenney-Pakete, Schriftdateien, Piper-Modell. Sie werden beim Neuaufbau heruntergeladen.
