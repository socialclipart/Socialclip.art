# SocialClip Check – Prüf-Server

Sammelt Fakten über einen Betrieb (Website-Quelltext, Google PageSpeed, Google-Profil über Places API).
Keine KI. Die Bewertung (Note, Texte) passiert auf der Website in `/check/regeln.js`.

- Werkzeug (nur für den Inhaber): `https://socialclip.art/check-tool/`
- Ergebnis-Seite für Betriebe: `https://socialclip.art/check/?f=name#…` (alle Daten stecken im Link, nichts wird gespeichert)

## Einrichten (einmalig)

1. Diesen Ordner `check-backend` als eigenes Projekt bei Vercel anlegen (Node.js, kein Framework, Region Frankfurt).
2. Umgebungsvariablen in Vercel eintragen:
   - `CHECK_TOKEN` – selbst ausgedachter, langer Zugangscode (nur du kennst ihn, nie ins Repo).
   - `GOOGLE_PLACES_KEY` – Google-Cloud-Schlüssel mit „Places API (New)“ und „PageSpeed Insights API“ freigeschaltet.
     Ohne Schlüssel prüft der Check nur Websites; Firmennamen und Tempo-Messung brauchen ihn.
     Im Google-Cloud-Projekt ein Tageslimit (Kontingent) setzen, damit keine Kosten entstehen.
3. Im Werkzeug unter „Verbindung einrichten“ die Adresse `https://<projekt>.vercel.app/api/check` und den Code eintragen.

## Lokal testen

```
CHECK_TOKEN=test node dev.mjs     # Server auf http://localhost:8787/api/check
node --test test/                 # Tests
```
