# Vorbereitete Pull Requests – noch nicht veröffentlicht

Beide Entwicklungszweige basieren auf `main` bei `4f01f2447520832ff23a7594342995915a6a740f`. Das Repository ist öffentlich. Wegen der ausdrücklichen Freigabegrenze wurden weder die Zweige gepusht noch PRs oder Issue-Kommentare angelegt.

## PR A

**Zweig:** `fix/one-navigation-and-demo-safety`

**Titel:** ONE: Kartenstand beim Bereichswechsel erhalten und Demo klar kennzeichnen

**Beschreibung:**

Beim Wechsel über Live-/Feedback-Links innerhalb der Map wurde die gesamte ONE-Seite ersetzt. Der begrenzte Navigationsadapter wechselt jetzt den Bereich in der bestehenden Oberfläche; das Map-Dokument mit seiner Suche und Kamera bleibt erhalten. Ursprung und tatsächliches Kartenfenster werden geprüft. Die eigenständige Map bleibt erhalten.

Die lokale Live-Demo zeigt ihren Status bereits auf Start, bietet „Eingaben löschen“ und meldet zu kurze Anliegen verständlich. Der Inhaltssprung ist erreichbar. Enthalten sind technische Entwurfs-, Prioritäten- und Abnahmeunterlagen für Issue #70; keine privaten Leads.

**Validierung:** sieben automatisierte Navigation-/Demotests, JS-Syntax und Diff-Prüfung bestanden. Lokale Browserprüfung: erfundene Anfragevorschau erzeugt/gelöscht und bestehende Map-Zugangseite erreicht. Reale Map-QA hinter dem Beta-Zugang und native iPhone-Prüfung stehen aus. Kein Live-Versand eingeführt.

## PR B

**Zweig:** `feat/one-live-pilot-foundation`

**Titel:** ONE: geschlossenes Live-Datenfundament und ehrliche Pilotmessung vorbereiten

**Beschreibung:**

Die vorhandene Live-Vorschau kann keine Anfragen speichern, Betriebsantworten zuordnen oder Termine bestätigen. Die separate, noch nicht installierte SQL-Migration bereitet diesen Datenablauf für eingeladene Nutzer und teilnehmende Betriebe vor: Rollen-/Besitzprüfung, begrenzte Zuordnung, konkrete versionierte Vorschläge, ausdrückliche Kundenannahme, Konfliktprüfung, Absage, Outbox und Aufbewahrungsfunktion. Neue Anfragen sind standardmäßig deaktiviert; keine bestehenden Tabellen oder Map-Daten werden ersetzt.

Ein lokales Auswertungsskript trennt Demo, hilfreiche Antworten, bestätigte Vermittlungen und beidseitig gemeldete Leistungserfolge. Es meldet fehlende Daten als nicht messbar. Keine neue Browserabhängigkeit und kein kostenpflichtiger Dienst.

**Validierung:** 16 SQL-/Rechtetests mit PGlite und acht Auswertungstests bestanden. Im lokal zusammengeführten Stand bestehen insgesamt 31 neue Tests. Echte Mehrsitzungs-Parallelität, Supabase Auth, API, Versandadapter und realer Ende-zu-Ende-Test stehen aus. Die Migration und sämtliche Beispielkonten bleiben Entwicklungs-/Testmaterial. Kein Merge oder Deployment mit diesem PR veranlassen.

## Freigabeumfang

Eine Freigabe für diese zwei Draft-PRs bedeutet ausschließlich: diese geprüften Codeänderungen und nicht personenbezogenen Projektdokumente auf den beiden Entwicklungszweigen im öffentlichen Repository veröffentlichen. Main, produktive Website, Konten, Infrastruktur, Kosten und Kontakte werden dadurch nicht freigegeben.
