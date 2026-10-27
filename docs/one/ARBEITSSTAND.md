# Arbeitsstand und Entscheidungen

Stand: 27.10.2026. Quelle des Auftrags: https://github.com/socialclipart/Socialclip.art/issues/70 (vollständig gelesen; zu Prüfzeitpunkt keine Kommentare).

## Erledigt

- Repository und bestehenden ONE-/Map-/Community-/Chat-Code geprüft; technischer Entwurf vor Änderungen dokumentiert.
- Öffentliche ONE-Seite im Browser geöffnet; Live korrekt als Prototyp erkannt. Abruf über die Suchschnittstelle war nicht möglich; Browserbeobachtung und Repository sind getrennte Belege.
- Priorisierte Aufgaben und Abnahmetest erstellt.
- Gezielte ONE-Navigation, Inhaltsfokus, ausdrücklicher Demo-Hinweis, Vorschau-Löschen und verständliche Eingabevalidierung umgesetzt.
- Sieben automatisierte Tests bestanden; Syntax und `git diff --check` ohne Fehler.
- Lokale Browserprüfung: Demo erstellt und gelöscht, eingebettete Map-Zugangseite erreicht. Kein Versand und keine produktive Änderung.
- Separater Zweig `feat/one-live-pilot-foundation`: deaktivierte, nicht installierte Datenbankmigration mit Rollen-/Besitzprüfung, begrenzter Zuordnung, versionierten Vorschlägen, Bestätigung, Absage, Outbox und Wartungsfunktion; ergänzende Sicherheitsgrenzen in `LIVE_BACKEND.md`.
- Lokale Auswertung für echte Anfragen, hilfreiche Antworten, Bestätigung, beidseitige Erfüllung, Aufwand und aktive Personen vorbereitet. Demo und fehlende Daten werden nicht als Erfolg ausgegeben.
- Beide Zweige lokal in `review/one-pilot-2026-10-27` verbunden: **31 neue Tests bestanden** (7 Navigation, 16 Datenbank, 8 Messung). Zusätzlich **7 bestehende Chat-Tests bestanden**, ohne externen Modellaufruf.
- Privates Pilotpaket mit zwölf recherchierten Gesprächskandidaten, Leitfäden, Betriebs-Abstimmungsblatt, zehn leeren Nutzerplätzen und Test-/Auswertungsprozess erstellt. Kein Betrieb kontaktiert; keine Zusagen oder Teilnahmen behauptet.
- Technische Bestandsaufnahme und zwei konkrete PR-Entwürfe fertig. Kein Push, PR, Issue-Kommentar, Merge in `main`, Deployment oder bezahlter Dienst.

## Entscheidungen

| ID | Entscheidung | Grund |
|---|---|---|
| D01 | Bestehende Map und Kartendaten behalten | Enthalten bereits Suche, Routing und bewusste Gestaltung; keine zweite Kartenlogik nötig |
| D02 | Keine Aktivierung durch bloßes Eintragen eines Backends | Frontend, Rechte, Zustellung und rechtliche Informationen müssen gemeinsam funktionieren |
| D03 | Eingeladener Pilot, zunächst Erlangen und ein Segment | Anbieterantworten und Nachfrage lassen sich so konkret überprüfen |
| D04 | Betrieb schlägt vor, Nutzer bestätigt | Wunschzeit ist kein reservierter Termin; keine erfundenen freien Kalenderplätze |
| D05 | Betreiber-Zuweisung am Anfang zulässig, Aufwand messen | Geringe Kosten; dauerndes Hinterhertelefonieren darf nicht als skalierbarer Erfolg erscheinen |
| D06 | Lokale Zweige bis zur Freigabe | Das Repository ist öffentlich; die Vorgabe „öffentliche Änderungen erst nach Freigabe“ wird auch beim Push beachtet |
| D07 | Interessenten-/Teilnehmerlisten privat | Keine echten Kontaktdaten, Leads oder Geschäftsanliegen in öffentlichen Repo-Dateien |

## Offen und zu entscheiden

- Welches Segment erhält zuerst mindestens drei Zusagen? Werkstätten sind eine zu prüfende Startannahme, keine beschlossene Partnerschaft.
- Welcher Kanal funktioniert bei diesen Betrieben tatsächlich, und in welchem Reaktionsfenster? Kein fixes 15-Minuten-Versprechen ohne Zusage.
- Welche geschützte Testumgebung und welches bestehende Backendkonto stehen bereit? Im Repo sind keine Live-Zugangsdaten; laufende Konten wurden nicht unterstellt oder neu angelegt.
- Welche Folgen soll eine Terminannahme rechtlich haben? Anfrage/Diagnose und verbindlicher Leistungsauftrag vor Nutzung klar unterscheiden.
- Authentifizierung, Zustelladapter, Missbrauchsschutz am Eingang, Datenschutztext, Beschwerdeweg, Wiederherstellung und Löschbetrieb fehlen vor Freischaltung.
- Echte Map-Interaktion hinter dem Beta-Zugang, native iPhone-Prüfung und reale Vermittlung stehen aus.

## Nächste Freigabe

Zuerst die fertigen Entwicklungszweige und die privaten Pilotunterlagen prüfen. Anschließend gezielt die Veröffentlichung der Codezweige/Draft-PRs freigeben; eine solche Freigabe wäre noch kein Merge, Deployment, kostenpflichtiger Dienst oder Start echter Live-Anfragen. Betriebsgespräche und Testergewinnung führt der Gründer mit den vorbereiteten Unterlagen.
