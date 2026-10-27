# SocialClip ONE – Übergabe am 27.10.2026

**Ergebnis:** Bestandsaufnahme, priorisierte Umsetzung, privates Pilotpaket und zwei getestete lokale Entwicklungszweige sind vorbereitet. Die öffentliche Website und `main` wurden nicht geändert. Live ist weiterhin eine Vorschau; es liegt noch keine echte erfolgreiche Vermittlung aus diesem Pilot vor.

## Einstieg in die Unterlagen

| Unterlage | Inhalt |
|---|---|
| [Technische Analyse](TECHNISCHE_ANALYSE.md) | Website, App, Map, Daten, externe Dienste, Hostinghinweise und konkrete Prüfgrenzen |
| [Entwurf vor Änderungen](TECHNISCHER_ENTWURF.md) | Gewählter Datenweg, unveränderte Map und Freigabegrenzen |
| [Prioritäten](PRIORITAETEN.md) | P0/P1/P2 mit Abnahmekriterium und Zuständigkeit |
| [Live-Fundament](LIVE_BACKEND.md) | Implementierte Datenbankregeln und fehlende Auth/API/Zustellung |
| [Testablauf](TESTABLAUF.md) | Konkrete Browser-/Betriebsabnahme und Fehlerfälle |
| [Messung](MESSUNG.md) | Datenschnittstelle, Kennzahlen, Nenner und aktive Personen |
| [Entscheidungen und offene Fragen](ARBEITSSTAND.md) | Erledigt, offen und nächste Freigabe |
| [PR-Entwürfe](PR_ENTWUERFE.md) | Konkreter Inhalt der beiden noch nicht veröffentlichten Code-PRs |

Die separate private Datei `SocialClip_ONE_Pilotpaket_Erlangen.md` enthält zwölf Gesprächskandidaten mit Quellen, erste fünf Gesprächsprioritäten, Fragen, Einladungsentwurf, Abstimmungsblatt, zehn freie Nutzerplätze, Startreihenfolge und Go/No-Go-Vorschlag. Sie liegt außerhalb des Git-Repositories. Es wurde niemand kontaktiert oder als Partner eingetragen.

## Code und Nachweise

Basis beider Entwicklungszweige: `main` bei `4f01f2447520832ff23a7594342995915a6a740f`. Remote-`main` am Ende unverändert auf diesem Stand geprüft.

| Zweig | Änderungen | Prüfung |
|---|---|---|
| `fix/one-navigation-and-demo-safety` | Sicherer Bereichswechsel aus der bestehenden eingebetteten Karte; Demo-Hinweise, Löschen der lokalen Vorschau, Eingabevalidierung, Fokus; Projektdokumentation | 7 automatisierte Tests; JS-Syntax und Diff-Prüfung; lokale Browserprüfung der Vorschau |
| `feat/one-live-pilot-foundation` | Isoliertes, standardmäßig pausiertes SQL-Schema für eingeladenen Pilot; Rechte, Zuweisung, Vorschläge, Annahme, Absage, Outbox, Aufbewahrung; lokales Messskript | 16 SQL-/Rechtetests + 8 Messungstests mit eingebettetem PostgreSQL |
| `review/one-pilot-2026-10-27` | Beide Zweige ausschließlich lokal zusammengeführt | Alle 31 neuen Tests gemeinsam bestanden; zusätzlich 7 bestehende Chat-Tests bestanden |

```bash
# Im Repository-Root:
npm ci --ignore-scripts
npm test

# Vorhandene Chat-Tests separat:
cd chat-backend
npm ci --ignore-scripts
npm test
```

Es wurden keine Kartenlogik oder Kartendaten ersetzt. Die SQL-Tests führen echte Datenbankregeln aus, bilden Auth aber synthetisch nach. Echte Parallelität über mehrere PostgreSQL-Sitzungen, native iPhone-Bedienung und die Map hinter dem Beta-Zugang bleiben unbestätigt. Keine automatische neue GitHub-Aktion und kein kostenpflichtiger Dienst wurden aktiviert.

## Was für echte Live-Anfragen noch fehlt

1. Mindestens drei real zugestimmte Betriebe im gleichen Segment, erlaubter Kontaktweg und realistisches Antwortfenster; zehn freiwillige Testnutzer.
2. Geschützte Testumgebung mit echter Anmeldung, serverseitig geprüfter Identität und verbundener Anfrage-/Antwortansicht.
3. Funktionierender Versand-/Benachrichtigungsweg mit Zustellnachweis, Wiederholung, Rückläufern und verständlichen Fehlerzuständen. Die implementierte Outbox allein sendet nichts.
4. Geprüfte Datenschutzinformationen und Vermittlungs-/Bestätigungsbedingungen; geübter Sperr-, Lösch- und Beschwerdeweg.
5. Vollständiger Probelauf Nutzer → Betrieb → konkrete Antwort → ausdrückliche Annahme auf iPhone und Desktop. Erst danach geschlossenen Pilot aktivieren und nach 10–20 realen Anfragen auswerten.

**Nächster konkreter Freigabepunkt:** die zwei fertigen Entwicklungszweige als Draft-PRs auf GitHub hochladen. Wegen der Vorgabe „öffentliche Änderungen erst nach Freigabe“ wurde dieser Schritt noch nicht ausgeführt. Er umfasst weder Produktions-Merge noch Veröffentlichung des Dienstes, neue Konten, Ausgaben oder Kontaktaufnahme.
