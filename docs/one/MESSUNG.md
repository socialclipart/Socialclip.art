# Auswertung vorbereiten, Ergebnisse ehrlich messen

`scripts/one-pilot-metrics.mjs` wertet privat geführte, pseudonyme Datensätze lokal aus. Es sendet keine Daten und baut kein Tracking in die Map ein. Ohne echte Datensätze gibt es keine gemessene Vermittlungsquote; leere Nenner ergeben `null` statt erfundener 0/100 Prozent.

```bash
node scripts/one-pilot-metrics.mjs /absoluter/privater/pilot.json 2026-11-10T12:00:00+01:00
```

Das Datum ist ein Beispiel für einen frei gewählten Auswertungsstichtag, kein vereinbarter Termin. Zeitstempel benötigen einen Zeitzonenoffset. `is_test` muss ausdrücklich angegeben werden. Testdatensätze, Demo-/Seitenaufrufe und Ereignisse nach dem Stichtag zählen nicht. Doppelte Anfrage-IDs, Kontaktdatenfelder und unmögliche Ereignisfolgen werden abgelehnt.

Startdatei ohne echte Daten:

```json
{"requests": [], "activities": []}
```

## Datenschnittstelle

Einträge in `requests`:

| Feld | Bedeutung |
|---|---|
| `id`, `user_id` | Pseudonyme, z. B. R001 und U001; keine Namen, E-Mails, Telefonnummern oder Klartextanliegen |
| `is_test` | `true` für QA/Demo, `false` ausschließlich für echte Pilotanfrage |
| `created_at` | Zeitpunkt der dauerhaften Speicherung, nicht bloß Formularöffnung |
| `response_due_at` | Vorher mit Betrieben vereinbarte Antwortfrist als Zeitpunkt; nicht nachträglich passend ändern |
| `first_response_at` | Erste belegte Betriebsantwort, Absage eingeschlossen; optional/null |
| `first_helpful_response_at` | Erste belegte positive Antwort oder konkreter Vorschlag; optional/null |
| `confirmed_at` | Annahme eines konkreten Vorschlags durch den Kunden; optional/null |
| `cancelled_at` | Zeitpunkt einer Absage; optional/null |
| `customer_completed_at`, `business_completed_at` | Getrennte positive Erfüllungsrückmeldungen; optional/null |
| `manual_minutes`, `manual_reminders` | Tatsächliche Betreiberarbeit; unbekannt `null`, nicht 0 |

Einträge in `activities`: `user_id`, `at`, `audience` (`customer`/`business`), `type`, `is_test`. Sinnvolle Typen: `map_profile_open_after_search`, `live_request`, `live_response`. Eine echte gespeicherte Anfrage zählt auch ohne zusätzlichen Aktivitätseintrag einmal als Aktivität. Personen werden nach ihrer pseudonymen ID zusammengeführt; keine automatische Fingerabdruck-Erkennung.

## Interpretation

- **Gesamtanfragen:** alle echten gespeicherten Anfragen bis zum Stichtag, einschließlich Absagen und Fehlschlägen.
- **Fristkohorte:** Frist abgelaufen und nicht vorher abgesagt. Frühe Absagen und noch unbeantwortete laufende Anfragen werden separat gezeigt, damit ihr Ausschluss sichtbar bleibt.
- **Hilfreich in Frist:** hilfreiche Antworten innerhalb der vorher festgelegten Frist / Fristkohorte.
- **Keine Antwort:** bis zum Stichtag keine Antwort bei abgelaufener Frist / Fristkohorte. Verspätete Antworten separat anhand Zeitstempel prüfen.
- **Aktuelle bestätigte Vermittlung:** beidseitig vereinbart, bis zum Stichtag nicht abgesagt. Bestätigt und später abgesagt wird extra ausgewiesen.
- **Erfüllung:** beide Seiten haben unabhängig „erledigt“ gemeldet. Einseitiges Feedback reicht nicht.
- **Antwortzeit:** Median nur der beantworteten Anfragen, zusammen mit Stichprobengröße und Keine-Antwort-Quote berichten. Kein Beschönigen durch den Median allein.
- **Aufwand:** Median und Erfassungsabdeckung getrennt; fehlende Minuten sind kein Nullaufwand.
- **Aktiv:** Personen mit sinnvoller Aktion in den letzten 7 × 24 Stunden. Kunden und Betriebsmitarbeiter werden zusätzlich getrennt gezeigt. Für den nächsten Nachfrage-Meilenstein konservativ 50 aktive **Kunden** anstreben.
- **Wiederkehrend:** sinnvolle Aktionen an mindestens zwei unterschiedlichen Kalendertagen in Europe/Berlin innerhalb der letzten 14 Tage.

Das Skript prüft Datenkonsistenz, nicht deren Wahrheit. Zuweisungs-, Zustell- und Rückläuferbelege werden zusätzlich im privaten Ablaufprotokoll erfasst. Ein integrierter Datenbankexport und ein Zustellprovider sind noch nicht angeschlossen. Keine echten Daten oder erzeugten Pilotberichte in Git committen.
