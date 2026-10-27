# Technische Bestandsaufnahme

Stand: 27.10.2026. Repository: `socialclipart/Socialclip.art`. Basis: `4f01f2447520832ff23a7594342995915a6a740f`. Remote-`main` wurde zum Abschluss erneut gelesen und stand unverändert auf dieser Basis.

## Website und Veröffentlichung

Die öffentliche Startseite wurde im Browser unter `https://socialclip.art/#start` geöffnet und mit dem Quellcode abgeglichen. Sie funktioniert als statische Seiten-App mit Leistungs-, Preis-, Kontakt- und weiteren Bereichen. Die vorhandene Agenturseite bleibt vollständig erhalten. Navigation führt derzeit zur Map-Beta; ONE wird unter `/app-beta/` getrennt angeboten.

`CNAME`, statische Verzeichnisstruktur und Projektgedächtnis weisen auf GitHub Pages hin. Hosting-Einstellungen, produktive Umgebungsvariablen, externe Konten und deren Abrechnung wurden nicht unabhängig eingesehen. Der Chat ist als separates Vercel-Projekt vorbereitet. Kein neuer Hostinganbieter wurde eingeführt.

Die Startseiten-Datei umfasst 253.597 Bytes, enthält umfangreiche Inline-Styles und Scripts und lädt zusätzliche Ressourcen. Das ist ein Hinweis für spätere Ladezeitmessung, kein gemessener Leistungsfehler. Ohne Performanceprofil sollte sie nicht pauschal neu geschrieben werden.

Kontakt-/Profilformulare verwenden vorhandene Formspree-Wege; Digital enthält zusätzlich direkte Kontaktlinks. Diese sind keine Live-Vermittlungs-API. Es wurden keine echten Formulare testgesendet, weil dies Dritte kontaktieren würde.

## Map und ONE

| Komponente | Beobachteter Stand | Konsequenz |
|---|---|---|
| ONE-Routing | Hash-Navigation Start/Map/Live/Digital/Feedback | Bestehende Oberfläche weiterverwenden |
| Map in ONE | Genau ein beim ersten Öffnen geladenes iframe zu `/map/?city=1` | Keine zweite Karte nötig |
| Map-Code | `map/map.js`, 99.590 Bytes; MapLibre lokal, City-/Tag-/Nachtansicht | Kartenlogik, Darstellung und Menüs nicht ersetzen |
| Geschäfte | 13.087 Datensätze in `map/firmen.json`, 3.152.513 Bytes, Region Nürnberg/Fürth/Erlangen | OSM ist Entdeckungsbestand, keine Partner-/Verfügbarkeitsdatenbank |
| Aktualisierung | Wöchentlicher GitHub-Workflow; bei statischem Fehler Overpass-/Browsercache-Fallback | Quellenstand und Ausfälle im Pilot beobachten; keine Live-Kapazitäten daraus ableiten |
| Externe Dienste | OpenFreeMap, Photon, FOSSGIS-Routing, Transitous und Overpass | Netz-/Dienstausfälle sowie Standort-/Suchdatenflüsse vor realem Pilot prüfen |
| Gespeicherte Orte | Zuhause/Arbeit und Einstellungen im Browser-Speicher | Kein gemeinsames Konto; iOS-Home-Bildschirm und Safari getrennt prüfen |
| Map-Zugang | Clientseitige Prüfsumme und `localStorage`; kein Serverlogin | Darf keine Kundendaten oder Betriebsberechtigungen schützen; Prüfung fällt bei Speicherfehler bisher offen aus |
| Live | Lokale Formularvorschau, kein Netzwerkversand | Ehrliche Demo erhalten, Erfolg nicht zählen |
| Community | Leere Supabase-Konfiguration, lokale Demostimme; RLS-/RPC-SQL vorbereitet | Keine gemeinsame Umfrage behaupten; UUID ist kein Identitäts-/Spamschutz |

Der Navigationsfehler ergibt sich aus `target="_top"` der Map-HUD-Links und dem damit ersetzten ONE-Dokument. Der Korrekturzweig fängt nur die ausdrücklich erlaubten internen Links im tatsächlich eingebetteten, gleichnamigen Ursprung ab. Die Elternseite prüft zusätzlich das konkrete iframe-Fenster. Direkte Map-Nutzung und andere Links bleiben normal bedienbar.

## Vertrauen und Daten

- Auf der Agenturstartseite ist eine statische Angabe „5,0 aus 13 Google-Bewertungen“ sichtbar. Herkunft und Aktualität wurden hier nicht bestätigt. Diese Zahl wird nicht zu Plattform- oder Betriebsbewertungen umgedeutet und nicht in Live übernommen.
- OSM-/Schaufensterprofile, echte Pilotzustimmung, Prüfung der Betriebsberechtigung und bestätigte Kapazität sind vier verschiedene Nachweise. Der bestehende Datenbestand erfüllt nur den ersten Teil.
- Browsergespeicherte Orte und freigegebene Standortdaten benötigen einen verständlichen Datenfluss. Ein selbst gesetzter Browserstatus ist kein sicherer Identitätsbeleg.
- Supabase-Community und das neue Live-Schema bleiben getrennt. Gemeinsame Kommentare/Abstimmung dürfen nicht durch eine Konfiguration nebenbei als Live-Dienst erscheinen.
- Das KI-Chat-Backend enthält Beratung und Katalogsuche, keine Buchungs-/Nachrichtenwerkzeuge. Sein begrenzter Chatverlauf und Instanzlimit ersetzen keine Live-Speicherung, zentrale Ratenbegrenzung oder Zustellgarantie.

## Priorisierte technische Folgen

**Vor realen Anfragen:** Auth/API, sichere Rollenvergabe, dauerhafte Speicherung, bestätigte Pilotbetriebe, nachweisbarer Zustellweg, Fehler-/Absagezustände, Sperr-/Löschbetrieb und vollständiger Ende-zu-Ende-Test. Der neue Datenbankzweig implementiert einen prüfbaren Teil, keine vollständige App.

**Im geschlossenen Pilot:** tatsächliche Kartenladezeit und Bedienung auf iPhone messen; langsames Netz, abgelehnten Standort, gesperrten Speicher, ausfallende Karten-/Routingdienste und fehlende OSM-Einträge testen. Bei beobachtetem Fehler gezielt korrigieren. Keine umfassende Neuentwicklung ohne Nutzungsbeleg.

**Später:** optionale Kalenderanbindung, eigene Firmenverwaltung und Bewertungsnachweise nach abgeschlossenen Leistungen. Keine Monetarisierung als Voraussetzung für organische Empfehlung einführen.

## Prüfgrenzen

Die öffentliche Website und ONE wurden im Browser angesehen; die geänderte lokale Demo wurde ausgefüllt und gelöscht. Die eingebettete Beta-Zugangseite wurde erreicht. Die eigentliche Map-Interaktion hinter dem Passwort, reale Zustellung, Produktivkonten und native iPhone-Bedienung wurden noch nicht geprüft. Code-/Datenbanktests und dieser Bericht geben keine entsprechende Freigabe vor.
