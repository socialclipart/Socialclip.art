# Priorisierte Umsetzung – Pilot Erlangen

Stand: 27.10.2026. Keine Aufgabe in dieser Liste ist bereits eine Freigabe für Veröffentlichung oder Ausgaben. Ein Häkchen erfordert Nachweis, nicht nur vorhandenen Code.

| Rang / ID | Aufgabe | Fertig, wenn | Zuständig / Abhängigkeit |
|---|---|---|---|
| P0-01 | Map erhalten und ONE-Rücknavigation korrigieren | Genau ein iframe, Suche/Kamera bleiben bei Map → Live → Map erhalten; bestehendes Routing bleibt unverändert | Entwicklung; reale Map-QA mit Beta-Zugang offen |
| P0-02 | Demo vom Dienst unterscheiden | Auf Start und Live sichtbar; keine Vorschau zählt als echte Anfrage; keine erfundenen Anbieter, Preise, Sterne oder freien Zeiten | Entwicklung; lokal umgesetzt |
| P0-03 | 10–15 Betriebsgespräche vorbereiten | Enger Bedarf, erlaubter Kanal, Reaktionsfenster, angebotene Leistungen und Grenzen werden je Gespräch erfasst | Vorbereitung fertig; Gespräche Gründer |
| P0-04 | 3–5 Pilotbetriebe verbindlich abstimmen | Mindestens drei Zusagen mit verantwortlichem Konto, angenommenen Kategorien, Einwilligung in Testablauf und erreichbarem Ersatzkontakt | Gründer; noch keine Zusagen verifiziert |
| P0-05 | 10 freiwillige Testnutzer gewinnen | Opt-in und echtes, nicht dringendes Anliegen; Daten nur privat; zwei Personen mit geringer Technikroutine einbeziehen | Gründer; noch keine Teilnahmen verifiziert |
| P0-06 | Sicheres Live-Fundament | Einladungen, echte Konten, Besitzprüfung, begrenzte Zuweisung, Validierung und Schutz vor Doppelbestätigung in Datenbanktests | Separater Backend-Zweig; nicht aktiviert |
| P0-07 | Browser ↔ Auth ↔ API ↔ Datenbank verbinden | Keine privilegierten Schlüssel im Browser; abgelaufene Sitzung zeigt verständlichen Fehler; Rechtewechsel serverseitig geprüft | Offen; erfordert geschützte Testumgebung |
| P0-08 | Zustellung und Rückmeldung nachweisen | Dauerhafte Versandwarteschlange, Wiederholung mit gleicher ID, Rückläufer/Fehler sichtbar, keine Erfolgsmeldung bei Ausfall | Offen; Kanal mit Betrieben wählen |
| P0-09 | Daten und Vermittlerrolle prüfen | Anbieter-/Verantwortlichenangaben, Zweck, Empfänger, Löschung, Auskunft, Beschwerden und Bedeutung der Terminbestätigung geklärt | Gründer + geeignete Prüfung; kein Rechtsfreigabevermerk durch Code |
| P0-10 | Echter Ende-zu-Ende-Probelauf | Ein freiwilliger Nutzer → ein zugestimmter Betrieb → gelieferte Antwort → ausdrücklich bestätigter Termin; auf iPhone und Desktop nachvollzogen | Erst nach P0-04 bis P0-09 und Freigabe |
| P1-01 | 10–20 reale Anfragen betreuen und auswerten | Vollständige Zähler einschließlich Fehler/Abbrüche, keine Beschönigung durch Herausfiltern erfolgloser Anfragen | Pilotleitung |
| P1-02 | 10 → 20 → 35 → 50 aktive Nutzer | Nachfrage und Partnerkapazität wachsen gemeinsam; aktive Personen führen eine sinnvolle Aktion aus, keine bloßen Seitenaufrufe | Nach funktionierendem Pilot |
| P2-01 | Kalenderanbindung, Profile, Bewertungen | Erst wenn wiederholter Bedarf belegt und Nachweis-/Moderationsregeln stehen | Später; kein Neuaufbau der Map |

## Reihenfolge und wirtschaftliche Entscheidung

Zuerst ein Reparatursegment mit mindestens drei passenden Zusagen auswählen. Die private Recherche enthält Alternativen, keine behaupteten Partner. Nicht fünf Branchen mit je einem Betrieb gleichzeitig starten. Bei unklarer Reparatur wird ein Diagnose-/Besichtigungstermin angeboten; kein verbindlicher Reparaturpreis geraten.

Für die ersten 10–20 Anfragen darf die Zuweisung durch den Betreiber erfolgen. Pro Anfrage werden Arbeitsminuten und Erinnerungen gezählt. Vermittlungen, die nur durch ständiges Nachtelefonieren entstehen, rechtfertigen keine Skalierung. Digital-Beratung bleibt ein getrenntes Angebot; keine Bevorzugung der Betriebe durch Kauf eines Digital-Pakets.

## Vorgeschlagene Entscheidung nach 10–20 echten Anfragen

Diese Schwellen sind Arbeitshypothesen, keine Marktstandards. Der Gründer bestätigt sie vor Testbeginn.

- Technischer Pflichtpunkt: keine fremden Anfragen lesbar, keine Doppelbestätigung, keine unbemerkten Zustellfehler.
- Mindestens drei aktive Betriebe, zehn freiwillige Nutzer und eine Ende-zu-Ende bestätigte Vermittlung.
- Ziel: mindestens 70 % erhalten innerhalb des vereinbarten Fensters eine hilfreiche Antwort, mindestens 50 % einen beidseitig bestätigten Kontakt/Termin.
- Höchstens 20 % ohne irgendeine Antwort nach Fristablauf. Kleine Stichprobe mit absoluten Zählern berichten.
- Ziel: median höchstens zehn Minuten Betreiberarbeit und höchstens eine manuelle Erinnerung pro Anfrage; Ausreißer extra prüfen.
- Bei Zielverfehlung Kategorie, Zustellung oder Reaktionsfenster korrigieren und erneut testen. Kein öffentlicher Launch allein wegen einer positiven Rückmeldung.
