# SocialClip ONE – technischer Entwurf vor Änderungen

Stand: 27.10.2026. Auftrag: Issue #70. Prüfbasis: `main` bei `4f01f2447520832ff23a7594342995915a6a740f`.

## Bestand und Grenzen

- Statische Website, kein zentraler Build; `CNAME` weist auf `socialclip.art`. Die tatsächlichen Hosting-Einstellungen und laufenden externen Dienste sind damit noch nicht verifiziert.
- ONE: `app-beta/index.html`, `app.js`, `styles.css`, leere Supabase-Konfiguration. Live rendert nur eine lokale Vorschau; keine Anfrage-API, kein Versand, keine Buchung.
- ONE lädt die vorhandene Map einmal im iframe. `map/map.js`, MapLibre, OSM-Daten, Suche, Kategorien, Standort, gespeicherte Orte und Routing bleiben erhalten.
- Die Map verlinkt Live/Feedback mit `target="_top"`. Das ersetzt das ONE-Dokument und verwirft den iframe samt Kartenposition. Korrektur: eng begrenzte Navigation per Nachricht an die bestehende ONE-Oberfläche.
- Map-Zugang: öffentlich ausgelieferte SHA-256-Prüfsumme mit Browser-Speicher. Das ist eine Zugangshürde für die Vorschau, keine sichere Anmeldung oder Berechtigung für Kundendaten. Bei gesperrtem Speicher läuft die aktuelle Prüfung sogar weiter. Für Live niemals wiederverwenden.
- Community-SQL hat RLS und begrenzte RPCs, aber Browser-UUIDs sind austauschbar. Das vorhandene 15-Minuten-Limit verhindert keine verteilten Spam-Angriffe. Gemeinsame Abstimmung und Live sind getrennte Systeme.
- Separates `chat-backend/`: KI-Beratung, keine Termin- oder Versandwerkzeuge. In-Memory-Limit pro Instanz ersetzt kein zentrales Missbrauchslimit. Es wird nicht als Live-Backend zweckentfremdet.
- `map/firmen.json` wird wöchentlich aus OSM aktualisiert. Ein Map-Eintrag ist weder Zustimmung zum Pilot noch Nachweis aktueller Kapazitäten. Schaufenster-Markierungen sind keine verifizierten Bewertungen.

## Kleine, unabhängige Entwicklungspakete

1. `fix/one-navigation-and-demo-safety`: Map-Links wechseln nur den ONE-Bereich; Absender und Ursprung werden geprüft. Standalone-Karte behält ihre normalen Links. Demo-Hinweise, Fehler bei Eingaben, Löschen der lokalen Vorschau und erreichbarer Inhaltssprung werden verbessert. Kein Redesign und keine Änderung an Kartendaten oder Kartenlogik.
2. `feat/one-live-pilot-foundation`: isolierte Datenbankmigration, Rollen-/Zustandsregeln, Tests und Auswertung für einen eingeladenen Pilot. Nicht automatisch mit dem Frontend verbinden und nicht installieren. Eine Datenbankmigration allein ist noch kein nutzbarer Vermittlungsdienst.

## Vorgesehener Live-Datenweg

Nach Freigabe: eingeladener Nutzer mit bestätigtem Konto → serverseitig validierte Anfrage → dauerhafter Datensatz → Betreiber ordnet höchstens drei passende, ausdrücklich teilnehmende Betriebe zu → Betrieb antwortet im geschützten Konto → Nutzer bestätigt genau einen konkreten Vorschlag → erst dann Status „bestätigt“.

Kontaktdaten bleiben im Kontosystem, nicht in der frei lesbaren Map. Vor einer Bestätigung sieht ein Betrieb nur die ihm zugewiesene Anfrage. Termine sind konkrete Vorschläge zu genau dieser Anfrage, keine öffentlich behaupteten freien Kalenderplätze. Preis unbekannt bleibt `NULL`; Reparaturpreis wird nicht aus Kategorie oder Uhrzeit erfunden.

Benachrichtigungen benötigen zusätzlich einen Zustellweg mit Wiederholungen, Fehlerstatus und Nachweis. „Gespeichert“, „zugeordnet“, „benachrichtigt“, „geantwortet“ und „beidseitig bestätigt“ dürfen nicht zusammenfallen. Ein geplanter Versand zählt nicht als Zustellung.

## Freigabegrenze

Der Nutzer verlangt Freigabe vor öffentlichen Änderungen und Ausgaben. Deshalb zunächst lokale Entwicklungszweige und überprüfbare Commits; kein Push in das öffentliche Repository, kein PR, kein Merge, keine Veröffentlichung, keine Konten oder kostenpflichtigen Dienste. Erst am fertigen Ergebnis um die jeweils konkrete Freigabe bitten. Keine Kontaktaufnahme mit Kandidaten und keine personenbezogenen Pilotdaten im Repository.

## Architekturquellen

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/api/securing-your-api

Die Quellen stützen Berechtigungs- und Funktionsregeln; die konkrete Pilotarchitektur ist eine Projektentscheidung. Datenschutz- und Vertragsprüfung bleiben vor echten Nutzerdaten erforderlich.
