# Live-Pilot – isoliertes Fundament, kein freigegebener Dienst

Stand: 27.10.2026. Zweig `feat/one-live-pilot-foundation`, auf derselben unveränderten `main`-Basis wie der separate Navigationszweig. Technischer Entwurf, Prioritäten und Pilotabnahme liegen im Zweig `fix/one-navigation-and-demo-safety`.

## Was der Code tatsächlich kann

`app-beta/backend/live-pilot.sql` enthält eine **noch nicht installierte** Migration. Sie verändert keine vorhandenen Map-, Community- oder Chat-Tabellen. Kein Konto wird angelegt, kein Dienst aufgerufen und keine Nachricht verschickt. Die Migration startet mit `accepting_requests=false`.

| Bereich | Implementiertes Verhalten |
|---|---|
| Zugang | Nur ausdrücklich angelegte, aktive Pilotmitglieder. Kunden-, Betriebs- und Betreiberrolle; keine Rollen aus selbst editierbaren Browserangaben |
| Daten | Getrenntes Schema `sc_live`, nicht für PostgREST freigeben. RLS für alle Tabellen, keine direkten Schreibrechte. Keine eigenen Kontaktspalten in Anfragen/Outbox; Freitext kann dennoch personenbezogene Angaben enthalten und benötigt einen geprüften Löschprozess |
| Anfrage | Nur Erlangen, zunächst `auto` oder `handwerk`, Textlänge/Zeitrahmen und Informationsversion validiert. Gleiche Wiederholungskennung liefert dieselbe Anfrage, veränderte Nutzlast wird abgelehnt |
| Missbrauch | Drei neue Anfragen je aktivem Kunden in 24 Stunden. Sperre auf Mitgliedszeile serialisiert die Prüfung. Das ist ein Datenbanklimit, noch kein vollständiger Eingangs-/IP-Schutz |
| Zuordnung | Betreiber ordnet höchstens drei passende, aktive, geprüfte und dem Pilot zugestimmte Betriebe zu. Erneute Zuordnung derselben Firma erzeugt keinen zweiten Datensatz |
| Antwort | Nur zugewiesener Betrieb darf antworten: `can_help`, `proposed`, `unavailable`. Unbekannte Preise bleiben `NULL`; keine Bewertungen oder globalen freien Slots |
| Bestätigung | Konkreter zukünftiger Vorschlag und ausdrückliche Annahme durch Eigentümer der Anfrage. Versionsnummer schützt vor Annahme veralteter Zeiten/Preise. Eine Anfrage bekommt höchstens eine Bestätigung |
| Überschneidung | Bestätigung sperrt die Betriebszeile und prüft weitere bestätigte ONE-Termine. Im kleinen Pilot wird konservativ eine gleichzeitige Kapazität je Betrieb angenommen. Externe Kalender sind nicht angebunden |
| Absage | Kunde, Betreiber oder gewählter Betrieb können absagen; kein Wiederöffnen durch spätere Klicks |
| Zustellung | Ereignisse landen atomar in einer privaten Outbox. `pending` ist **nicht** zugestellt. `sent` erfordert Zeitpunkt und Providerbeleg. Worker/Versand ist bewusst noch nicht implementiert |
| Erfolg | Nur die beiden gewählten Parteien dürfen nach dem Termin ihr Ergebnis melden. Eine Zusage ist kein Beleg für eine erbrachte Leistung |
| Löschung | Wartungsfunktion schließt abgelaufene Anfragen und entfernt geschlossene Inhalte nach 30 Tagen, einschließlich abhängiger Antworten und Outbox. Keine automatische Ausführung aktiviert; Frist ist ein vor Nutzung zu prüfender Vorschlag |

## Reproduzierbare Prüfung

```bash
npm ci --ignore-scripts
npm test
```

Nur Entwicklungsabhängigkeit: exakt fixiertes `@electric-sql/pglite` 0.5.12; keine Browser-/Produktionsabhängigkeit. Die Tests führen die echte SQL-Migration in eingebettetem PostgreSQL aus. Die Auth-Tabellen, Rollen und JWT-Hilfsfunktion werden **nur im Test** synthetisch nachgebildet.

16 Datenbanktests und 8 Auswertungstests bestanden. Geprüft: anonyme/fremde/entzogene Zugriffe, Rechteausweitung, direkte Schreibversuche, Pause, Pflichtfelder, Limits, erlaubte Zuordnung, Outbox-Deduplizierung, Vorschlagsversionen, Absage, Terminüberschneidung, getrennte Erfolgsrückmeldung und Löschung. Tests verwenden ausschließlich erfundene Konten und Betriebe.

**Grenzen:** PGlite verwendet eine Verbindung. Die Tests belegen die SQL-Regeln und sequentielle Konfliktfälle; sie simulieren keine echten konkurrierenden PostgreSQL-Sitzungen. Vor Freigabe ist ein Zwei-Sitzungs-Test von Anfrage-Limit, doppelter Bestätigung und überlappenden Betriebszeiten erforderlich. Supabase Auth, PostgREST, SMTP und Browser-API sind hier nicht mitgetestet.

## Noch fehlender Weg vom Browser zum Betrieb

1. Geschützte Testumgebung nach Freigabe bestimmen; aktuelle Konten, Region, Limits und Kosten prüfen. Keine pauschale Behauptung, dass ein bestimmter Tarif dauerhaft kostenlos genügt.
2. Echte Authentifizierung mit bestätigter Identität und vom Betreiber vergebenen Rollen verbinden. Beta-Passwort/Browser-UUID nicht als Konto verwenden. Session-Ende, Weitergabe und Widerruf testen.
3. API implementieren: JWT serverseitig validieren, Nutzerkontext aus dem geprüften Token setzen, Nutzlast begrenzen, Rate-/Spam-Schutz vor die Datenbank setzen. Niemals vom Browser gelieferte Nutzer-ID oder `service_role`-Schlüssel als Identitätsnachweis akzeptieren.
4. `sc_live` nicht als öffentliches Schema exponieren. Privilegierte Funktionen nur über den kontrollierten Server aufrufen; keine zusätzlichen Tabellen-/Funktionsrechte großzügig freischalten. Keine generischen SQL-Endpunkte bauen.
5. Betrieb/Nutzer brauchen eine kleine geschützte Antwort-/Bestätigungsansicht. Formular muss Wunschzeit, konkreten Vorschlag, Annahme, Absage und abgelaufenen Vorschlag unterscheiden. Kein neuer Kalenderzwang.
6. Zustellworker ergänzen: serverseitige Zugangsdaten, Claim/Lock pro Ereignis, identische Provider-Idempotenzkennung beim Retry, Backoff, maximale Versuche, generische Fehlermeldungen und Zustell-/Rückläuferbelege. Vor Versand den aktuellen Anfragestatus prüfen; bereits abgesagte Anfragen dürfen keine alte Zusage mehr auslösen. Warteschlange erst nach Bestätigung des Datenbank-Commits abarbeiten.
7. Konto-Löschung und Betriebsrückzug sauber behandeln: vor Entfernen eines Betriebs seine offenen Zusagen abbrechen und informieren; die aktuelle FK-Struktur darf nicht durch ein ungetestetes „Konto löschen“ umgangen werden. Fristen, Backups, Wiederherstellung und Auskunft praktisch testen.
8. Verständliche Datenschutzinformationen, Empfänger und Vermittler-/Buchungsbedingungen prüfen. `pilot-v1` ist ein technischer Versionsbezeichner, kein fertiger Rechtstext oder juristischer Nachweis einer wirksamen Einwilligung.
9. Nach echten Konto-/Zustelltests erst einen zugestimmten Probelauf durchführen. Anschließend separat über geschlossenen Pilot und später Öffentlichkeit entscheiden.

## Rücknahme und Betrieb

- Frontend-Demo bleibt unverändert unverbunden; die Migration aktiviert keinen Live-Link.
- Nach späterer Installation kann der Betreiber neue Anfragen über `settings.accepting_requests=false` stoppen. Bestehende Anfragen müssen weiter angezeigt, beantwortet oder abgesagt werden können.
- Migration ist absichtlich einmalig und atomar: erneutes Ausführen scheitert statt Tabellen oder Einstellungen zu überschreiben. Kein automatisches `DROP SCHEMA` oder Löschen von Nutzerdaten.
- Wartung ist nur für den Datenbankeigentümer ausführbar. Ein geplanter Job, Backup-Konzept und dokumentierter Lösch-/Sperrprozess fehlen bis zur Freigabe.

## Primärquellen für Sicherheitsentscheidungen

- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/functions
- https://supabase.com/docs/guides/api/securing-your-api
- https://supabase.com/docs/guides/database/secure-data

Die Architektur setzt diese Grundlagen konkret um; eine bestandene Testsuite ersetzt weder Infrastrukturprüfung noch rechtliche Freigabe oder realen Pilotnachweis.
