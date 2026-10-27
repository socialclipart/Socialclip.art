# SocialClip One App — Entwicklungs-Beta

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
