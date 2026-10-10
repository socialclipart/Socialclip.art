# Alexa-Skill „Social Clip“ mit KI (kostenlos)

Mit diesem Skill sprichst du über deinen Echo mit einer KI (Google Gemini):

> „Alexa, öffne Social Clip.“ – „Frage, wie schreibe ich einen guten Instagram-Post?“

Alexa schickt deine Frage an Gemini und liest die Antwort vor. Im selben Gespräch merkt sich der Skill die letzten sechs Fragen und Antworten, du kannst also nachfragen.

**Kosten: 0 €.** Amazon hostet den Code kostenlos (Alexa-hosted), und Gemini hat ein kostenloses Kontingent. Du brauchst keine Kreditkarte.

## Inhalt

| Datei | Zweck |
|---|---|
| `lambda/index.js` | Der Code: nimmt Alexas Anfrage an, fragt Gemini und gibt die Antwort als Sprache zurück |
| `lambda/package.json` | Abhängigkeiten (`ask-sdk-core`, `@google/genai`) |
| `skill-package/skill.json` | Name, Beschreibung und Beispielsätze des Skills |
| `skill-package/interactionModels/custom/de-DE.json` | Sprachmodell: Aufrufname „social clip“ und die Sätze, die eine Frage auslösen |

## Einrichtung (ca. 15 Minuten)

### 1. Kostenlosen Gemini-Schlüssel holen
1. Öffne <https://aistudio.google.com> und melde dich mit einem Google-Konto an.
2. Klicke links auf **Get API key** → **Create API key**.
3. Kopiere den Schlüssel (er beginnt meist mit `AIza`). **Keine Abrechnung (Billing) einrichten**, dann bleibt alles kostenlos. Ist das Kontingent aufgebraucht, sagt Alexa einfach „Kontingent aufgebraucht“. Es entstehen keine Kosten.

### 2. Skill in der Alexa Developer Console anlegen
1. Öffne <https://developer.amazon.com/alexa/console/ask> und melde dich **mit demselben Amazon-Konto an, das auf deinem Echo eingerichtet ist**.
2. Wähle **Create Skill**:
   - Name: `Social Clip`
   - Primary locale: **German (DE)**
   - Experience: **Other** → Model: **Custom**
   - Hosting: **Alexa-hosted (Node.js)**. Kostenlos, kein AWS-Konto nötig.
   - Template: **Start from Scratch**
3. Gehe zu **Build → Interaction Model → JSON Editor** und ersetze den Inhalt durch `skill-package/interactionModels/custom/de-DE.json`. Klicke auf **Save** und danach auf **Build skill**.

### 3. Code einfügen
1. Öffne den Tab **Code**.
2. Ersetze `index.js` durch `lambda/index.js` aus diesem Ordner.
3. Ersetze `package.json` durch `lambda/package.json`.

### 4. Gemini-Schlüssel eintragen
Füge ganz oben in `index.js` (im Code-Tab der Alexa-Konsole) diese Zeile ein und setze deinen Schlüssel ein:

```js
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'DEIN-SCHLÜSSEL';
```

Danach klickst du auf **Deploy**.

> ⚠️ Diese Zeile **nur in der Alexa-Konsole** einfügen, **nie auf GitHub hochladen**, denn das Repo ist öffentlich.

### 5. Testen
1. Tab **Test** → bei „Skill testing is enabled in“ **Development** wählen.
2. Tippe oder sprich: `öffne social clip` und dann `frage was ist ein reel`.
3. Funktioniert es, klappt es auch direkt auf deinem Echo: „Alexa, öffne Social Clip.“

## So stellst du Fragen
Alexa braucht ein Startwort vor der Frage. Diese funktionieren:
„Frage …“, „Sag mir …“, „Erkläre mir …“, „Was ist …“, „Wie …“, „Warum …“, „Welche …“, „Schreib mir …“, „Hilf mir …“, „Kannst du …“

Direkt in einem Satz geht auch: „Alexa, frag Social Clip, wie viele Hashtags sollte ich verwenden?“

## Einstellungen

| Variable | Standard | Bedeutung |
|---|---|---|
| `GEMINI_MODEL` | `gemini-flash-latest` | Welches Gemini-Modell antwortet. Flash ist schnell und im Gratis-Kontingent enthalten. Welche Modelle gratis sind, siehst du in AI Studio. |

Den Charakter des Assistenten bestimmt `SYSTEM_PROMPT` in `index.js`. Dort kannst du z. B. Wissen über SocialClip ergänzen.

## Gut zu wissen
- **Gratis-Grenzen:** Das kostenlose Kontingent erlaubt nur eine begrenzte Zahl von Fragen pro Minute und pro Tag. Die aktuellen Werte siehst du in Google AI Studio. Für private Nutzung reicht das in der Regel.
- **Datenschutz:** Im kostenlosen Modell darf Google Fragen und Antworten zur Verbesserung seiner Produkte verwenden. Stell deshalb keine privaten oder vertraulichen Fragen.
- **8-Sekunden-Grenze:** Alexa bricht ab, wenn eine Antwort länger braucht. Der Skill sagt dann „Das dauert gerade zu lange“.
- **Nur für dich:** Solange der Skill nicht veröffentlicht ist, funktioniert er nur auf Geräten mit deinem Amazon-Konto. Das reicht für den privaten Gebrauch.
