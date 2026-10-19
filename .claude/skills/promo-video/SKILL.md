---
name: promo-video
description: Erstellt krasse Motion-Promo-Videos (Reels/TikTok/Shorts, 9:16) im Stil von prompt-motion.com für SocialClip-Produkte und -Seiten – als HTML/JS-Animation, Bild für Bild gerendert, mit Glitch-Effekten und selbst erzeugtem Sound. Verwenden, wenn der Nutzer ein Promo-Video, Reel, Werbevideo oder Motion-Video für eine Seite, ein Produkt oder das Handbuch möchte.
---

# Promo-Video (Motion-Reel)

Alles Nötige ist in der Umgebung vorinstalliert: Chromium + Playwright (global, `npm root -g`), ffmpeg, Python mit numpy. Nichts herunterladen, kein MCP-Server nötig.

## Ablauf

1. **Inhalt holen:** Zielseite lesen (lokal im Repo, z. B. `marketing-handbuch/index.html`, oder per curl). Nur echte Fakten aus der Seite verwenden (Preis, Kapitel, Zahlen) – nichts erfinden.
2. **Szene bauen:** `templates/scene.html` in einen Arbeitsordner im Scratchpad kopieren und anpassen. Die Asset-Pfade (`../../../../fonts`, `../../../../logo`) zeigen auf den Repo-Root; nach dem Kopieren auf absolute Pfade (`/home/user/Socialclip.art/fonts/...`) umstellen.
3. **Kontaktbild zuerst:** Einzelbilder an Schlüsselzeiten rendern und als Kachel ansehen, Fehler beheben, *bevor* das ganze Video gerendert wird:
   ```bash
   NODE_PATH=$(npm root -g) node scripts/render.js scene.html stills 30 0 0.6 1.3 4.7 12.2 19.3 21
   ffmpeg -i stills/f%05d.jpg -vf "scale=270:480,tile=7x1" -frames:v 1 contact.jpg
   ```
4. **Sound anpassen:** In `scripts/sound.py` die Effekt-Zeiten an die `HITS` der Szene angleichen (Kopie im Arbeitsordner bearbeiten).
5. **Bauen:** `scripts/build.sh <scene.html> <arbeitsordner> <ausgabe.mp4> [glitch 0..1.5]` – rendert, erzeugt Sound, legt Glitch drüber und komprimiert auf ~20 MB.
6. **Ausliefern:** Fertiges MP4 nach `videos-export/` im Repo kopieren (lokal per `.git/info/exclude` ignoriert, wird nie committet) und mit SendUserFile (`display: attach`) schicken.

## Szenen-Vertrag

- 1080×1920, `window.seek(t)` setzt *alle* Styles deterministisch aus der Zeit `t` (keine CSS-Animationen/Transitions, kein `Date.now`).
- `window.HITS` = Zeitpunkte aller Schnitte/Einschläge (steuern Blitz, Kamera-Wackler, Glitch), `window.BIG` = die großen davon (stärkerer Glitch + invertierte Streifen), `window.DURATION` = Länge in Sekunden.
- Shot-Tabelle `SH`: `[id, start, ende, hellerHintergrund, basisZeit]` – mit `basisZeit` lassen sich Shots verschieben, ohne ihren Code umzuschreiben.

## Stilregeln (das macht es „krass“)

- Hook in den ersten 1,5 s: einzelne Wörter alle 0,25 s, Hintergrund springt Schwarz ↔ Gold.
- Harte Schnitte im 120-BPM-Raster (0,5 s), nie weiche Überblendungen zwischen Shots.
- Riesige Schrift über die volle Breite (`fit()`), Arimo 700, Großbuchstaben, enge Laufweite.
- Formen verwandeln sich (Punkt → Kreis → Karte), animierter Mauszeiger mit Klick + Welle.
- 3D: rotierender Würfel auf dem Beat, schräge Laufschrift-Wand mit Zoom hinein, Objekt fliegt mit Drehung ein (Rückseite mit `backface-visibility` gestalten).
- Kamera-HUD: Ecken, REC-Punkt, Shot-Nummer, Timecode; Farbe passt sich dem Hintergrund an.
- Markenfarben: Schwarz `#121212`, Creme `#f4f1ea`, Gold `#e6d0ad` / `#d2b894`, Grau `#86827b`. Logo aus `logo/`.
- Schluss: Produkt groß, Preis-Einschlag, CTA-Button mit Link, Klick des Mauszeigers.

## Stolpersteine

- Filmkorn macht CRF-Encodes riesig (230 MB für 25 s) → immer über `build.sh` mit 2-Pass-Bitrate komprimieren.
- Glitch-Intensität bei Bedarf senken (4. Parameter von `build.sh`, z. B. `0.6`), falls Blitze zu grell sind.
- Videos von prompt-motion.com gehören ihren Erstellern: nur als Stil-Referenz ansehen, nie Inhalte übernehmen.

## Beispiele

- `templates/scene.html` – Version 3 (krass): Hook, Wortschläge, Textwand, Agentur-Zerschlagung, Prompt-UI, 3D-Würfel, Zahlen, 30-Tage-Raster mit Zoom, Buch-Finale.
- `examples/v2-schnell.html` – schnelle Schnitte ohne Glitch-Nachbearbeitung.
- `examples/v1-ruhig.html` – ruhige, elegante Variante.
