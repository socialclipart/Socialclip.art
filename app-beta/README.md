# SocialClip One App — Entwicklungs-Beta

Aktuelle Bestandsanalyse und Freigabegrenzen: [Technischer Entwurf](../docs/one/TECHNISCHER_ENTWURF.md).
Der aktuelle Code bindet genau die vorhandene Map per iframe ein; die frühere Beschreibung einer eigenen Map-Ansicht unten ist historisch. Live bleibt eine lokale Vorschau. Der neue ONE-Navigationsadapter erhält das Karten-Dokument beim Wechsel zu Live/Feedback. Lokale Prüfungen: `node --test tests/one-navigation.test.mjs`.

**Zweck:** Eine zusammenhängende App statt separater Map/Live-Projekte, plus eine Unternehmenswelt.

## Was implementiert ist
- **Start:** klarer Einstieg in Entdecken und Live.
- **Map:** echte Daten aus `/map/firmen.json` (bereits im GitHub-Repository), OpenFreeMap/MapLibre, Stadtwahl Erlangen/Nürnberg/Fürth, Suche, Kategorien, Entfernungen, Geschäfte und Links zu OSM / Websites.
- **Live:** ausfüllbare Anfrage mit Kategorie, Ort, Anliegen und Zeitpunkt; ausdrückliche *lokale Demo-Vorschau*, keine falschen Versprechen und kein Versand.
- **Digital:** Angebote zur Analyse, Digitalisierung, Web-Präsenz, Automatisierungen und Betreuung.
- **Community:** Abstimmung Map/Live/Beides und öffentliche freigegebene Kommentare, technisch vorbereitet für Supabase. Im unkonfigurierten Modus werden Stimmen **nur auf dem aktuellen Gerät** gespeichert; Kommentare werden nicht vorgetäuscht.
- **Responsive:** Desktop und iPhone mit einheitlicher Navigation.

## Lokal testen
Das Repository oder dieses Verzeichnis muss über einen HTTP-Server erreichbar sein, *nicht* via `file://`.
Vom Repository-Root:
```bash
python3 -m http.server 8000
```
Dann `http://localhost:8000/app-beta/` öffnen. Internet wird für den Kartenstil benötigt.
`/map/firmen.json` und `/map/lib/maplibre-gl.js` sind bereits vorhandene Repo-Dateien.

## Gemeinsame Abstimmung & Feedback aktivieren
1. Supabase-Projekt anlegen; EU-Region / Datenschutz prüfen.
2. `backend/supabase.sql` im SQL Editor ausführen.
3. Supabase Project URL und **publishable/anon** key in `config.js` einsetzen. **Niemals service_role/secret key**.
4. Kommentare mit einer geeigneten Rolle über den Supabase Table Editor moderieren (`status='approved'`).
5. Vor öffentlichem Start CAPTCHA, IP-/Server-Ratelimits und Datenschutzinformationen ergänzen. Ein Geräte-UUID ist kein sicherer Mehrfachabstimmungs-Schutz. Die Beta ist keine belastbare Umfrage-Infrastruktur.
6. Für vollständige Produktion: Web-Formulare mit Spamprüfung, eindeutige Löschfristen, DSGVO-Informationen und klare Einwilligung.

## Live produktionsfähig machen — bewusst noch offen
- Unternehmensregistrierung, Nachweis der Berechtigung, Konten & Login
- Anfrage-Tabelle und gesicherte Zuordnung nach Kategorie, Entfernung und **echter** Verfügbarkeit
- Akzeptieren/Ablehnen und Benachrichtigungen mit Consent
- Rollen, RLS-Policies, Rate Limits, Anti-Spam, Protokollierung und Löschfunktionen
- Keine erfundenen Angebote oder Termine anzeigen
- Bezahlmodelle erst nach Marktvalidierung, keine gekauften organischen Rankings

## Produktstrategie
**SocialClip** ist die übergeordnete Marke.
- **SocialClip Map:** entdecken.
- **SocialClip Live:** konkrete Hilfe finden.
- **SocialClip Digital:** Betriebe analysieren und ihre Prozesse, Websites und Kundengewinnung sinnvoll digitalisieren.
- Eine Oberfläche; lokale Beta zuerst in Erlangen; Erfolg = 50 Menschen nutzen die App tatsächlich.

## Claude-Handoff
Claude soll in diesem Branch `feature/socialclip-one-app-beta` arbeiten und die Dateien `app-beta/index.html`, `styles.css`, `app.js`, `config.js` und `backend/supabase.sql` lesen. 
**Wichtig:** Nicht in `main` committen, nicht die bestehende Produktionsseite überschreiben. Erster Schritt: lokal starten, Fehler prüfen, Style/Map auf iPhone testen. Zweiter Schritt: Auth, Live-Vermittlung und Moderation mit sicherem Backend entwickeln; keine Attrappen als echte Funktionen verkaufen.

**Aktuelle Einschränkungen:** Beta ist ein funktionierender Frontend-Prototyp, keine veröffentlichte Produktionslösung. Kontaktlinks sind bewusst direkte Kontaktwege, keine automatisierte Firmenregistrierung. Öffentliche Abstimmung erst nach Supabase-Einrichtung verfügbar.


## City Mode – direkt in der vorhandenen SocialClip Map
Der bestehende Karten-Code in `map/index.html`, `map/map.js` und der neuen Datei `map/city.css` wurde **im selben Entwicklungsbranch** erweitert; kein Kartendatenbestand wurde dupliziert oder ersetzt.

- **CITY MODE ✦** rechts einschalten: Perspektive ca. 60°, orange beleuchtete Straßen, dunkle 3D-Häuser, lebendige Kategorie-Pins und ein kleines Echt-Daten-HUD.
- **Ausschalten** stellt Tag- oder Nachtkarte wieder her. Herkömmliche Suche, Stadtwahl, Routen, GPS, Profilanfragen und bestehende Map-Menüs bleiben Teil derselben Karte.
- `?city=1` ist ein Test-Linkparameter, der die Ansicht öffnet und die Wahl lokal im Browser speichert.
- Der HUD-Wert ist eine echte Zählung der geladenen Orte im 1-km-Umkreis, **keine** Behauptung über aktuell offene oder verfügbare Betriebe.
- Die Links aus dem HUD führen zu den Live-/Feedback-Demos unter `/app-beta/`. Das ist noch **keine** echte Vermittlung.
- **Wichtig:** `/map/` besitzt weiterhin die bestehende Beta-Zugangskontrolle. Die Änderungen sind nur im Review-Branch, nicht auf der öffentlich erreichbaren Hauptversion.

### Testcheckliste vor Freigabe
1. Desktop und iPhone prüfen: Stadtzentrum Erlangen, Zoom, Neigen, Drehen, Kategoriepins und 3D-Gebäude.
2. CITY MODE an/aus und jeweils Tag/Nacht sowie 3D danach testen.
3. Bestehende Wegführung (Fuß, Rad, Auto und Nahverkehr), Menüs und Geschäftsformular unverändert funktional verifizieren.
4. Karten-Performance bei längerer Nutzung sowie Stromverbrauch auf älteren iPhones prüfen.
5. Beschriftungen unter City-Mode-Kontrast und Screenreader-Navigation testen.
6. Erst nach bestandenem Browsertest den Draft-PR freigeben.
