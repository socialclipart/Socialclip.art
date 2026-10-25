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

### App „SocialClip Map“ (Version 1 gebaut, Ordner `map/`, Stand 25.10.2026)
- Look nach der Designstudie „VIERTEL“ des Inhabers (Bild + Übergabe-Text, Code selbst nicht im Repo):
  hell (Salbeigrün `#e9efdc`, Dunkelgrün `#203c32`, Akzent `#ddf77b`, Georgia für Ortsnamen), schräge
  Spielbrett-Ansicht, Häuser mit Fenstern und Dach (ab Zoom 16), Geschäftshäuser in Kategorie-Farbe,
  Bäume mit Krone (`map/baeume.json`), schwebende Schilder mit Gehzeit, Weg als hellgrünes Band.
  Knöpfe „3D“ und 🌙: Nacht = Neon-Stil. Stile in `STILE` (`tag`, `nacht`) in `map.js`.
- Inhaber findet normale Karten „zu Standard/wie Google Maps“ – Look soll einzigartig sein.
- SocialClip selbst sitzt in der Donato-Polli-Str. 38, 91056 Erlangen (Pin in `map/profile.json`).
- Beim Start fragt die Map jedes Mal „Bist du Nutzer oder Geschäftsführer?“ (Inhaber-Wunsch). Geschäftsführer
  bekommen einen eigenen Bereich (Geschäft suchen / neu eintragen, Profil-Knopf oben). Das „S“ öffnet ein Menü
  (Rolle wechseln, Geschäft eintragen, Link zur SocialClip-Website, Impressum/Datenschutz).
- Gebiet seit 25.10.2026: Nürnberg, Fürth und Erlangen (BBOX in `.github/scripts/map_daten.py`, Stadt-Auswahl
  oben in der Liste, `STAEDTE` in `map.js`).
- Bus & Bahn: Modus „🚆 Bus/Bahn“ (vorher nur Bus) fragt Transitous (api.transitous.org, offene VGN/DELFI-Daten, CORS erlaubt) ab,
  zeigt bis zu 4 Verbindungen (Bus, Tram, U-/S-Bahn, RE, ICE) mit Linienfarbe, Steig/Gleis, Echtzeit (Verspätung/„Fällt aus“),
  Störungsmeldungen falls vorhanden, und führt zu Fuß zur Haltestelle. Echtzeit nur so weit VGN/DB sie liefern.
- Reisebegleitung („Los geht’s – ich begleite dich“): Fußweg mit Pfeilen + Live-Abfahrt unten, an der Haltestelle
  Countdown, Fragen „Bist du an der Haltestelle / eingestiegen / ausgestiegen?“, Stationen-Zähler, Ansage
  „Nächste aussteigen“, minütlicher Echtzeit-Abgleich (Ausfall/verpasst → neue Verbindung). Code: `reise…` in `map.js`.
- Unteres Blatt lässt sich am Handy ziehen (24/52/90 % Höhe), Start-Knopf klebt unten (`.start-leiste`).
- Wunsch für später: Inhaber-Bereich, in dem z. B. der Chef einer Pizzeria nach Freischaltung sein
  Profil (Fotos, Angebote, Öffnungszeiten) selbst bearbeitet. Braucht Anmeldung + Datenbank (Backend).
- Ideen aus der Designstudie noch offen: Merkliste (Herz), Gehzeit-Filter 5/10/15 Min., „Streifzug“.
- Adresssuche (Photon/komoot) mit Navigation, „Geschäfte in der Nähe“ unter jedem Ziel; Fokus bleibt Geschäfte,
  Ziel: App, die man jeden Tag nutzt. Kategorien am PC mit Pfeilen/Mausrad.
- Kategorien mit „✕ Alle“/Zurück (auch Handy-Zurück-Taste), Suche mit Zusatzwörtern (z. B. „Nägel“),
  Navigation Schritt für Schritt in der App mit Sprachansage (FOSSGIS-Routing, kein Google/Apple Maps),
  Button „Ist das deine Firma? Profil kostenlos ergänzen“ → Formular über Formspree oder WhatsApp.
- Firmendaten: `map/firmen.json` aus OpenStreetMap, wöchentlich per GitHub Actions. OSM kennt nur einen Teil
  der Betriebe (z. B. nur ca. 8 Nagelstudios) – Lücken füllen Firmen über den Profil-Button.
- Schaufenster-Profile (goldener Pin) stehen in `map/profile.json`.

Ursprüngliche Idee:
- Inhaber will eine eigene App fertigstellen. Gewählte Idee: Karte zum **Entdecken** statt Suchen –
  „In deiner Nähe gibt es 3 Webdesigner, 5 Friseure …“, mit Profilen, was jede Firma kann/anbietet.
- Start nur Erlangen, als Web-App unter `socialclip.art/map/` (0 € Kosten, App Stores erst später).
- Firmendaten aus OpenStreetMap (legal mit Hinweis „© OpenStreetMap-Mitwirkende“), nie von Google kopieren.
- Version 1 = Karte mit Kategorien, Übersicht „In deiner Nähe“, Firmen-Infos, Button
  „Ist das Ihre Firma? Profil kostenlos ergänzen“. Alles Weitere erst in Version 2.
- Geld: Premium-Profil 15–29 €/Monat; Hauptnutzen am Anfang = Türöffner für Agentur-Aufträge.
- Erfolgstest nach 30 Tagen: 10 Firmen wollen ihr Profil ergänzen, 1–2 Agentur-Anfragen.
- Stand Inhaber: noch kein Umsatz, viel Zeit, Budget 150–300 €. Engpass = erste zahlende Kunden.
  Offen: Hat CarZone schon bezahlt?
- Verworfene Alternativen: allgemeiner KI-Assistent (zu viel Konkurrenz), „SocialClip Check“
  (Online-Check als Kundenmagnet), Bewertungs-Helfer (Google-Bewertungen sammeln, 29 €/Monat).
