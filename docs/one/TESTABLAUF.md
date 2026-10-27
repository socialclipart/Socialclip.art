# Testablauf und Messdefinitionen

## Bereits geprüfte Geschichte

Eine Person erstellt in ONE eine lokale Live-Vorschau, löscht sie und wechselt zur vorhandenen Map. Die Grenze ist ausdrücklich das Frontend: es gibt bisher keinen Live-API-Aufruf. Ein echter Vermittlungs-Ende-zu-Ende-Test ist daher **noch nicht bestanden**.

Lokal: `node --test tests/one-navigation.test.mjs`. Sieben Tests prüfen den Erhalt des Karten-Dokuments, Herkunft/Quelle von Nachrichten, normale Standalone-Links, HTML-Escaping, Versandfreiheit, Löschen und Eingabevalidierung.

Browser am 27.10.2026: Live-Vorschau mit erfundenem Text erzeugt; Meldung „Demo – nicht versendet“ sichtbar; Löschen und Wechsel zur Map-Zugangseite geprüft. Die eigentliche Karte ist im Browser ohne Beta-Passwort nicht geprüft. Keine Zugangskontrolle wurde umgangen. Native iPhone-/Safari-Prüfung steht aus; ein Desktopbrowser ersetzt sie nicht.

## Abnahmetest vor echten Daten

| Schritt | Aktion | Erwarteter Nachweis |
|---|---|---|
| 1 | Einladungslink verwenden; danach mit fremdem/abgelaufenem Konto öffnen | Nur die eingeladene Rolle erhält Zugang; generische, verständliche Fehlermeldung |
| 2 | Map nach einem echten Erlanger Geschäft durchsuchen | Quelle OSM, tatsächlicher Eintrag; kein Verfügbarkeits- oder Partnerlabel ohne Nachweis |
| 3 | Kategorie, Suche und Kamera einstellen; Map → Live → Digital → Feedback → Map | Dasselbe Karten-Dokument und gewählter Zustand; Zurück-Taste funktioniert |
| 4 | Testanfrage mit zu kurzem Text, leerem Feld, Überlänge und fehlender Bestätigung | Server lehnt ab; keine Anfrage/Benachrichtigung angelegt |
| 5 | Gültige Anfrage genau einmal und durch Doppeltippen senden | Eine dauerhafte Anfrage-ID, identischer Wiederholungsbeleg; kein Doppelversand |
| 6 | Nicht teilnehmenden/falschen Betrieb und vierten Betrieb zuweisen | Abgewiesen; höchstens drei passende aktive Betriebe |
| 7 | Verbindung beim Versand unterbrechen; Zustellfehler simulieren | Status bleibt gespeichert/ausstehend/fehlgeschlagen; niemals „zugestellt“ ohne Nachweis |
| 8 | Betrieb A mit seinem Konto öffnen; Betrieb B und fremden Kunden testen | Nur zugewiesene Anfrage sichtbar; fremde Daten/Antworten unsichtbar |
| 9 | Betrieb antwortet „Nicht verfügbar“, „Kann helfen“, konkreter Vorschlag | Keine Verfügbarkeit erfunden; „Kann helfen“ allein ist kein bestätigter Termin |
| 10 | Nutzer bestätigt konkreten Vorschlag; zweiter Nutzer und zweiter Tab versuchen dasselbe | Nur Eigentümer kann bestätigen; eine Zusage; veraltete Version abgewiesen |
| 11 | Zwei Anfragen bestätigen denselben Betriebszeitraum | Zweite überschneidende Bestätigung wird abgewiesen; externe Kalender bleiben zusätzlich abzustimmen |
| 12 | Nutzer/Betrieb sagt ab; Vorschlag oder Anfrage läuft ab | Klarer Endstatus, Beteiligte benachrichtigt; keine spätere Bestätigung möglich |
| 13 | Beschwerde, Sperre und Löschung durchspielen | Keine weitere Vermittlung an gesperrten Betrieb; Zugriff entzogen; Löschbeleg ohne vertraulichen Inhalt |
| 14 | iPhone Safari, Home-Bildschirm-App und Desktop getrennt prüfen | Kleine Ansicht, Tastatur, Fokus, Zurück, Standort abgelehnt, gesperrter Speicher, schwaches Netz |
| 15 | Freiwilliger realer Probelauf mit zugestimmtem Betrieb | Ankunft/Antwort/Bestätigung von beiden Seiten belegt; kein Testdatensatz in Nutzungskennzahlen |

## Messung ohne erfundene Ergebnisse

Für jede echte Anfrage privat erfassen: pseudonyme Anfrage-/Nutzer-ID, Kategorie, Erstellzeit, Zuweisung, nachgewiesene Zustellung, erste Antwort, erste hilfreiche Antwort, vereinbarte Frist, beidseitige Bestätigung, Erfüllungsfeedback beider Seiten, Abbruch-/Fehlergrund, Betreiber-Minuten und Erinnerungen. Keine Freitexte, Telefonnummern oder E-Mail-Adressen in Analyseexporte.

- **Echte Anfrage:** vom Nutzer tatsächlich abgesendet und dauerhaft gespeichert; Demo/QA/Gründer-Selbsttests ausgeschlossen. Fehlversuche separat als technische Fehler erfassen.
- **Hilfreiche Antwort:** „Kann helfen“ oder konkreter Vorschlag eines zugewiesenen Betriebs. Eine Absage zählt als Antwort, aber nicht als hilfreiche Antwort.
- **Terminerfolg:** konkreter Vorschlag vom Betrieb und ausdrückliche Annahme desselben Vorschlags durch den Nutzer; keine automatische Annahme.
- **Leistungserfolg:** Kunde **und** Betrieb melden unabhängig „erledigt“. Nur einseitige Rückmeldung bleibt ungeklärt.
- **Antwortzeit:** erste tatsächliche Betriebsantwort minus Erstellzeit. Zusätzlich Zustellzeit messen; nicht erst ab erfolgreicher Zustellung schönrechnen.
- **Keine Antwort:** abgelaufene, nicht vorher abgesagte Anfrage ohne Antwort. Noch laufende Anfragen nicht als Misserfolg zählen; separat zeigen.
- **Aktiv für Ziel 50:** eindeutige freiwillige Person mit mindestens einer sinnvollen Aktion in den letzten sieben Tagen: Map-Suche mit geöffnetem Geschäftsprofil oder echte Live-Anfrage/Antwort. Reine Besuche, Likes und Demovorschauen zählen nicht.
- **Wiederkehrend:** sinnvolle Aktionen an mindestens zwei verschiedenen Tagen innerhalb von 14 Tagen. Kein geräteübergreifendes Tracking ohne geregelte, freiwillige Identität.

Vor Beginn Auswertungsstichtag und Reaktionsfenster festlegen. Jede Quote zusammen mit Zähler/Nenner ausgeben; fehlende Datensätze und Ausfälle ausdrücklich benennen. Momentan sind **keine realen Pilotdaten erfasst**; die Zielzahlen sind keine gemessenen Ergebnisse.
