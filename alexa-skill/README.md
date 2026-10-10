# Alexa-Skill „Social Clip“ mit Claude

Mit diesem Skill sprichst du über deinen Echo mit Claude:

> „Alexa, öffne Social Clip.“ – „Frage, wie schreibe ich einen guten Instagram-Post?“

Alexa schickt deine Frage an die Claude-API und liest die Antwort vor. Im selben Gespräch merkt sich der Skill die letzten sechs Fragen und Antworten, du kannst also nachfragen.

## Inhalt

| Datei | Zweck |
|---|---|
| `lambda/index.js` | Der Code: nimmt Alexas Anfrage an, fragt Claude und gibt die Antwort als Sprache zurück |
| `lambda/package.json` | Abhängigkeiten (`ask-sdk-core`, `@anthropic-ai/sdk`) |
| `skill-package/skill.json` | Name, Beschreibung und Beispielsätze des Skills |
| `skill-package/interactionModels/custom/de-DE.json` | Sprachmodell: Aufrufname „social clip“ und die Sätze, die eine Frage auslösen |

## Einrichtung (ca. 15 Minuten, kostenlos bis auf die Claude-API)

### 1. Claude-API-Schlüssel besorgen
1. Gehe auf <https://platform.claude.com> und melde dich an.
2. Lade unter **Billing** etwas Guthaben auf (5 € reichen für viele Fragen).
3. Erstelle unter **API Keys** einen neuen Schlüssel und kopiere ihn (er beginnt mit `sk-ant-`).

### 2. Skill in der Alexa Developer Console anlegen
1. Öffne <https://developer.amazon.com/alexa/console/ask> und melde dich **mit demselben Amazon-Konto an, das auf deinem Echo eingerichtet ist**.
2. Wähle **Create Skill**:
   - Name: `Social Clip`
   - Primary locale: **German (DE)**
   - Experience: **Other** → Model: **Custom**
   - Hosting: **Alexa-hosted (Node.js)**. Amazon hostet den Code dann kostenlos, du brauchst kein eigenes AWS-Konto.
   - Template: **Start from Scratch**
3. Gehe zu **Build → Interaction Model → JSON Editor** und ersetze den Inhalt durch `skill-package/interactionModels/custom/de-DE.json`. Klicke auf **Save** und danach auf **Build skill**.

### 3. Code einfügen
1. Öffne den Tab **Code**.
2. Ersetze `index.js` durch `lambda/index.js` aus diesem Ordner.
3. Ersetze `package.json` durch `lambda/package.json`.
4. Klicke auf **Deploy**.

### 4. API-Schlüssel hinterlegen
Alexa-hosted Skills laufen auf AWS Lambda. So setzt du den Schlüssel:
1. Klicke im Code-Tab oben auf das **AWS-Lambda-Symbol** („Open in AWS Lambda console“). Achte darauf, dass rechts oben die Region **EU (Ireland)** ausgewählt ist.
2. Gehe zu **Configuration → Environment variables → Edit**.
3. Füge `ANTHROPIC_API_KEY` mit deinem Schlüssel als Wert hinzu und speichere.

> Falls der Lambda-Button bei dir fehlt: Setze ganz oben in `index.js` die Zeile
> `process.env.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || 'sk-ant-…';`
> ein. **Lade diese Version aber nie auf GitHub hoch**, denn das Repo ist öffentlich.

### 5. Testen
1. Tab **Test** → bei „Skill testing is enabled in“ **Development** wählen.
2. Tippe oder sprich: `öffne social clip` und dann `frage was ist ein reel`.
3. Funktioniert es, klappt es auch direkt auf deinem Echo: „Alexa, öffne Social Clip.“

## So stellst du Fragen
Alexa braucht ein Startwort vor der Frage. Diese funktionieren:
„Frage …“, „Sag mir …“, „Erkläre mir …“, „Was ist …“, „Wie …“, „Warum …“, „Welche …“, „Schreib mir …“, „Hilf mir …“, „Kannst du …“

Direkt in einem Satz geht auch: „Alexa, frag Social Clip, wie viele Hashtags sollte ich verwenden?“

## Einstellungen (optionale Umgebungsvariablen)

| Variable | Standard | Bedeutung |
|---|---|---|
| `CLAUDE_MODEL` | `claude-opus-5-5` | Welches Claude-Modell antwortet. `claude-haiku-5-5` ist deutlich schneller und günstiger, falls Antworten zu lange dauern. |
| `CLAUDE_EFFORT` | `low` | Wie gründlich Claude nachdenkt (`low`, `medium`, `high`). Höher heißt bessere Antworten, aber Alexa wartet maximal 8 Sekunden. |

Den Charakter des Assistenten bestimmt `SYSTEM_PROMPT` in `index.js`. Dort kannst du z. B. Wissen über SocialClip ergänzen.

## Gut zu wissen
- **8-Sekunden-Grenze:** Alexa bricht ab, wenn eine Antwort länger braucht. Der Skill sagt dann „Das dauert gerade zu lange“. Wenn das oft passiert, stelle `CLAUDE_MODEL` auf `claude-haiku-5-5`.
- **Kosten:** Jede Frage ist ein API-Aufruf. Bei kurzen Antworten kostet eine Frage mit Opus 5.5 grob 0,1 bis 1 Cent.
- **Sicherheits-Fallback:** Lehnt Claude eine Frage aus Sicherheitsgründen ab, übernimmt automatisch ein Ersatzmodell (`fallbacks: "default"`).
- **Nur für dich:** Solange der Skill nicht veröffentlicht ist, funktioniert er nur auf Geräten mit deinem Amazon-Konto. Das reicht für den privaten Gebrauch.
