# findflix → Google-Tabelle → Dashboard

findflix schickt jeden Lead und jede Pipeline-Änderung an eine Google-Tabelle.
Das Dashboard „findflix Lead-Zentrale“ auf claude.ai liest diese Tabelle.

```
findflix ──Webhook──▶ Google-Tabelle (Apps Script) ◀──liest── Dashboard / Claude
```

## Einrichtung (einmalig, ca. 10 Minuten, am besten am Computer)

1. **Tabelle anlegen:** sheets.new öffnen, Namen geben: `findflix Leads`.
2. **Skript einfügen:** Menü *Erweiterungen → Apps Script*. Alles im Editor löschen,
   den Inhalt von `findflix-webhook.gs` einfügen, speichern.
3. **Einrichten ausführen:** Oben die Funktion `einrichten` wählen, *Ausführen* klicken,
   Google-Zugriff erlauben. Im Protokoll steht danach ein **Token**.
4. **Als Web-App veröffentlichen:** *Bereitstellen → Neue Bereitstellung → Web-App*.
   - Ausführen als: **Ich**
   - Zugriff: **Jeder**
   Die angezeigte Web-App-URL kopieren (endet auf `/exec`).
5. **In findflix eintragen:** *Einstellungen → Ziele → Webhook*.
   Ziel-URL: `https://script.google.com/macros/s/…/exec?token=DEIN_TOKEN`
   Ereignisse auswählen (mindestens „Stufe geändert“), speichern, **Probe senden**.
6. **Prüfen:** In der Tabelle erscheinen die Tabs „Leads“ und „Ereignisse“ mit der Probe.
7. **Claude Bescheid geben:** Den Link der Tabelle in den Chat schicken. Claude
   verbindet dann das Dashboard mit der Tabelle.

Der Token sorgt dafür, dass nur findflix in die Tabelle schreiben kann. Er gehört
nicht in den Chat und nicht in dieses Repository.

## Was in der Tabelle steht

| Tab | Inhalt |
|---|---|
| Leads | Eine Zeile pro Betrieb: Firma, Website, E-Mail, Telefon, Ort, findflix-Stufe, Score, Report-Link |
| Ereignisse | Jedes Ereignis von findflix einzeln, mit den Originaldaten |

Die Spalten **Mein Status**, **Nächster Schritt** und **Notiz** pflegst du selbst.
Das Skript überschreibt sie nie.

Status-Werte für „Mein Status“: `Neu`, `Kontaktiert`, `Gespräch`, `Angebot`, `Kunde`, `Kein Interesse`.

## Hinweise

- Die Feldnamen der findflix-Webhooks sind nicht öffentlich dokumentiert. Das Skript
  erkennt gängige Namen (`company_name`, `website`/`url`, `email`, `phone`, `stage`, …)
  und speichert zusätzlich alle Originaldaten im Tab „Ereignisse“. Fehlt nach der
  Probe eine Spalte, kann die Zuordnung in `FIELDS` ergänzt werden.
- Nach einer Änderung am Skript: *Bereitstellen → Bereitstellungen verwalten →
  Bearbeiten → Version: Neu*. Die URL bleibt gleich.
