# SocialClip – Projektgedächtnis

Diese Datei liest Claude Code bei jeder Sitzung automatisch, egal ob in der Cloud
oder lokal auf dem PC. Hier steht, was Claude über das Projekt wissen soll.

## Über das Projekt

- Website von SocialClip, Webdesign- und Werbeagentur in Erlangen: https://socialclip.art
- Statische HTML/CSS/JS-Seite, gehostet über GitHub Pages (`CNAME`), kein Build-Schritt.
- Sprache der Website und der Kommunikation: Deutsch.

## Aufbau

- `index.html` – Startseite (als Seiten-App aufgebaut), Styles in `neu.css`, Script in `neu.js`.
- Leistungsseiten als Ordner mit eigener `index.html`, z. B. `webdesign-erlangen/`,
  `social-media-erlangen/`, `preise/`, `ratgeber/`.
- `impressum.html`, `datenschutz.html` – Rechtstexte, Styles in `legal.css`.
- `leads/` – interne, passwortgeschützte Lead-Zentrale mit verschlüsselten Daten
  (`daten.enc.json`, `verschluesseln.mjs`). Niemals Klartext-Daten committen.
- `vorschau/` – passwortgeschützte Kunden-Vorschauen (z. B. `vorschau/carzone/`).
- `chat-backend/` – separates Vercel-Backend für den Website-Chat, siehe dessen `README.md`.
- `sitemap.xml` und `robots.txt` bei neuen Seiten mitpflegen.

## Lokal ansehen

```
python3 -m http.server 8080
```

Dann im Browser `http://localhost:8080` öffnen.

## Arbeitsweise

- Commit-Nachrichten auf Deutsch, kurz und beschreibend (z. B. „Preise anheben und …“).
- Keine API-Keys oder Passwörter ins Repository schreiben.
- Bei neuen oder umbenannten Seiten `sitemap.xml` aktualisieren.
