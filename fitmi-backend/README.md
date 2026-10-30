# FITMI-Assistant – KI-Server

Kleiner Server für den Fit-Chat auf der FITMI-Vorschau (`vorschau/fitmi/`). Er nimmt den Chatverlauf entgegen, fragt Claude (Anthropic) und schickt die Antwort zurück. Keine Zusatzpakete, nichts wird gespeichert.

## Einrichten (einmalig, ohne eigenen KI-Schlüssel)

1. Vercel → „Add New… → Project“ → Repo `socialclipart/Socialclip.art` → Projektname `fitmi-backend`, **Root Directory `fitmi-backend`**, Framework „Other“ → „Deploy“.
2. Vercel → links „AI Gateway“ öffnen und aktivieren. Vercel schenkt dort ein kleines monatliches Gratis-Guthaben; der Server meldet sich automatisch an (kein Schlüssel nötig). Ist das Guthaben leer, antwortet der Chat einfach nicht mehr – es entstehen keine Kosten, solange du kein Geld auflädst.
3. Prüfen: `https://fitmi-backend.vercel.app/api/chat` zeigt `{"available":true,…}`. Heißt das Projekt anders, die Adresse in der Seite anpassen (Konstante `API`).

Später, für mehr Gespräche: eigenen Schlüssel von https://console.anthropic.com (mit Ausgabenlimit) als Umgebungsvariable `ANTHROPIC_API_KEY` eintragen – dann wird er statt des Gateways benutzt.

Optional: `FITMI_GATEWAY_MODEL` (Standard `anthropic/claude-haiku-5-5`), `FITMI_MODEL` (Standard `claude-haiku-5-5`), `FITMI_DAILY_LIMIT` (Standard 300 Antworten/Tag), `ALLOWED_ORIGINS` (weitere erlaubte Seiten, kommagetrennt).

## Schutz

Nur Anfragen von socialclip.art werden angenommen, max. 6 Nachrichten pro Minute je Besucher, Tageslimit, Längenbegrenzung, max. 600 Antwort-Tokens. Fehlertexte des Anbieters und Chatinhalte werden nicht protokolliert.

## Lokal testen

```
FITMI_FAKE=1 node dev.mjs      # Testserver ohne KI-Kosten auf http://localhost:8788/api/chat
node --test test/              # Tests
```
