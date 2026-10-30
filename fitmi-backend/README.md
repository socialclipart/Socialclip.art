# FITMI-Assistant – KI-Server

Kleiner Server für den Fit-Chat auf der FITMI-Vorschau (`vorschau/fitmi/`). Er nimmt den Chatverlauf entgegen, fragt Claude (Anthropic) und schickt die Antwort zurück. Keine Zusatzpakete, nichts wird gespeichert.

## Einrichten (einmalig)

1. **KI-Schlüssel holen:** Auf https://console.anthropic.com anmelden → „Billing“: kleines Guthaben aufladen (z. B. 5 €) und unter „Limits“ ein **monatliches Ausgabenlimit** setzen (z. B. 10 $). Das ist die harte Kostenbremse. → „API Keys“ → „Create Key“ → Schlüssel kopieren.
2. **Vercel-Projekt anlegen:** Vercel → „Add New… → Project“ → Repo `socialclipart/Socialclip.art` → Projektname `fitmi-backend`, **Root Directory `fitmi-backend`**, Framework „Other“.
3. **Umgebungsvariable** (Settings → Environment Variables): `ANTHROPIC_API_KEY` = der Schlüssel. Nie ins Repo schreiben.
4. „Deploy“. Danach muss `https://fitmi-backend.vercel.app/api/chat` `{"available":true,…}` zeigen.
   Heißt das Projekt anders, die Adresse in der Seite anpassen (Konstante `API`).

Optional: `FITMI_MODEL` (Standard `claude-haiku-5-5`), `FITMI_DAILY_LIMIT` (Standard 300 Antworten/Tag), `ALLOWED_ORIGINS` (weitere erlaubte Seiten, kommagetrennt).

## Schutz

Nur Anfragen von socialclip.art werden angenommen, max. 6 Nachrichten pro Minute je Besucher, Tageslimit, Längenbegrenzung, max. 600 Antwort-Tokens. Fehlertexte des Anbieters und Chatinhalte werden nicht protokolliert.

## Lokal testen

```
FITMI_FAKE=1 node dev.mjs      # Testserver ohne KI-Kosten auf http://localhost:8788/api/chat
node --test test/              # Tests
```
