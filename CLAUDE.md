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
- Der Nutzer ist kein Entwickler: einfach und auf Deutsch erklären, Fachbegriffe vermeiden.

## Stand aus früheren Chats (bis 24.10.2026)

### Preise (live, vom Inhaber vorerst bestätigt)
- Pakete: Start ab 490 €, Business ab 990 € (Empfehlung), Individuell ab 1.790 €,
  Betreuung ab 99 €/Monat.
- Einzelleistungen: Sichtbar ab 790 €, Social ab 199 €/Monat, Logo ab 149 €, Flyer ab 69 €,
  Visitenkarten ab 59 €, Speisekarte ab 119 €, Lebenslauf ab 39 €.
- Preise stehen an mehreren Stellen: Titel/Beschreibung, Preis-Karten, Einzelpreise, FAQ und
  strukturierte Daten für Google. Bei Änderungen immer alle mitziehen.

### Website & SEO
- Neues Design mit allen 24 Unterseiten ist live (Startseite als Seiten-App).
- 21st.dev-MCP ist über `.mcp.json` eingebunden, Key nur per Umgebungsvariable
  `TWENTYFIRST_API_KEY`, nie im Repo (Repo ist öffentlich).
- Sitemap (23 Adressen) ist in der Google Search Console erfolgreich eingereicht,
  die Seite ist auch in den Bing Webmaster Tools importiert.
- Achtung: Ein Skript hatte `sitemap.xml` einmal versehentlich geleert. Datei nie gleichzeitig
  lesen und zum Schreiben öffnen.
- KI-Sichtbarkeit (ChatGPT, Perplexity usw.) geprüft: robots.txt erlaubt alle Crawler, Inhalte
  sind ohne JavaScript lesbar. Versteckte Texte für KIs bewusst nicht eingebaut.
- Offene SEO-Ideen: Keyword-Zeile unter der Startseiten-H1 („Webdesign, Social Media &
  Grafikdesign in Erlangen“), Titel/Beschreibung kürzen, Bilder/Referenzen ergänzen,
  Leistungsseiten ausbauen.

### Kunde CarZone Autohandel (Inh. Leon Lebhaft, Erlangen)
- Hat die Website gekauft und will das Logo. Fertige Seite liegt als passwortgeschützte
  Vorschau unter `vorschau/carzone/` (Passwort kennt der Inhaber, steht nicht im Repo).
- Stil: hell und klassisch (nicht „app-mäßig“), Kopfbereich im CarZone-Blau mit weißem
  Schriftlogo in der Mitte, blaue Leistungsleiste (Verkauf, Ankauf, Inzahlungnahme,
  Probefahrt), Platzhalter „Hier kommt dein Auto“, Link zum mobile.de-Inserat.
- Mögliche nächste Schritte: echte Autos eintragen, Seite unter Leons eigener Domain online
  stellen.

### Marketing-Material (entstand in der Cloud, Dateien nicht im Repo)
- Instagram-Reels: „Kamerafahrt“ und „Apple-Stil“, 9:16, nur Soundeffekte ohne Musik
  (Musik gefiel nicht). Dazu Instagram-Texte, ein 8-teiliges Karussell (1080×1350) und ein
  Facebook-Gruppenbeitrag mit Bild.
- Für Motion-Graphics-Videos gibt es die Skills „motion-video-director“ und „sound-effects“.
- Werbe-Tipp für 30 €: Reel „Kamerafahrt“ bewerben, Erlangen + 20 km, 5 €/Tag für 6 Tage.

### SocialClip ONE / SocialClip Map – entfernt (30.10.2026)
- Auf Wunsch des Inhabers komplett von der Website genommen (Ordner `one/`, `map/`, `app-beta/`,
  `docs/one/`, Tests, Karten-Workflow, Menüpunkte, Datenschutz-Abschnitt, Sitemap-Einträge).
  Der Code steckt noch in der Git-Historie, falls es später wieder gebraucht wird.

### Geschäftlicher Stand
- Stand Inhaber: noch kein Umsatz, viel Zeit, Budget 150–300 €. Engpass = erste zahlende Kunden.
  Offen: Hat CarZone schon bezahlt?
- Verworfene Alternativen: allgemeiner KI-Assistent (zu viel Konkurrenz), „SocialClip Check“
  (Online-Check als Kundenmagnet), Bewertungs-Helfer (Google-Bewertungen sammeln, 29 €/Monat).
