#!/usr/bin/env python3
"""Vorschau-Websites für lokale Betriebe aus verschiedenen Branchen (Erlangen).

Nutzt Design und Bausteine aus vorschau_generator.py, aber mit Leistungen
statt Fahrzeugen und einem allgemeinen Anfrage-/Terminformular.
Aufruf:  python3 tools/vorschau_lokal.py
"""
import json
import os
import re

import vorschau_generator as g
from vorschau_generator import AGENCY, CSS, esc, ico, intl, theme_vars

OUT = g.OUT

LOKAL_CSS = """
.book textarea{width:100%;font:inherit;font-size:1rem;color:var(--text);background:var(--bg);border:1.5px solid var(--line);border-radius:calc(var(--r) * .7);padding:12px;min-height:84px;resize:vertical}
.book textarea:focus{outline:2px solid var(--primary);outline-offset:1px}
.vc p.txt{color:var(--muted);font-size:.95rem;margin:0 0 16px}
.highlight{display:grid;grid-template-columns:1fr 1fr;gap:20px}
.hl{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r) * 1.4);padding:26px}
.hl .tag{display:inline-block;font-size:.75rem;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--onp);background:var(--primary);border-radius:999px;padding:4px 10px;margin-bottom:12px}
.hl p{color:var(--muted);margin-top:6px}
@media (max-width:680px){.highlight{grid-template-columns:1fr}}
"""

# --------------------------------------------------------------------------
# Betriebe. Inhalte aus den eigenen Websites bzw. Branchenverzeichnissen,
# Stand 14.10.2026. Fotos: Unsplash (Symbolbilder).
# --------------------------------------------------------------------------
BETRIEBE = [
    {
        "slug": "elektro-schroepf-erlangen",
        "name": "Elektro Schröpf",
        "legal": "Elektro Schröpf GmbH",
        "branche": "Elektriker in Erlangen",
        "city": "Erlangen", "district": "Bruck",
        "street": "Leipziger Straße 85", "zip": "91058",
        "phone": "09131 32024", "mobile": None, "mail": None,
        "hours": [("Mo – Fr", "07:30 – 17:00*"), ("Sa – So", "geschlossen")],
        "theme": {"bg": "#f4f6f9", "surface": "#ffffff", "surface2": "#e8edf4", "text": "#0f1b2d",
                  "muted": "#56627a", "primary": "#0f3d7a", "on_primary": "#fff", "line": "#dbe2ec",
                  "dark": False, "font": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "head": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "headweight": 800, "upper": False, "radius": "10px", "accent": "#f2b705"},
        "logo_mark": "ES",
        "eyebrow": "Ihr Elektriker in Erlangen-Bruck",
        "h1": "Vom Großprojekt<br>bis zum Notdienst.",
        "lead": "Planung, Installation, Beleuchtung und Sicherheitstechnik aus einer Hand – dazu kleine Reparaturen und Kundendienst. Mit großer Ausstellung in der Leipziger Straße.",
        "trust": [("wrench", "Kundendienst & Reparaturen"), ("bolt", "Smart Home & Sicherheit"), ("users", "Ausbildungsbetrieb")],
        "stats": [("Planung", "bis Montage"), ("Ausstellung", "Leuchten & Hausgeräte"), ("Smart Home", "& Sicherheitstechnik"), ("E-Check", "Prüfung Ihrer Anlage")],
        "hero_img": "el4",
        "sec": ("Leistungen", "Alles rund um Strom,<br>Licht und Sicherheit.", "Ob Neubau, Sanierung oder ein Schalter, der nicht mehr will – wir kümmern uns."),
        "items": [
            {"name": "Planung", "cat": "Neubau & Sanierung", "img": "el8", "text": "Wir planen Ihre Elektroinstallation vom ersten Entwurf bis zur fertigen Verteilung."},
            {"name": "Installation", "cat": "Elektroinstallation", "img": "el3", "text": "Fachgerechte Installation für Wohnung, Haus und Gewerbe – auch kleine Arbeiten."},
            {"name": "Beleuchtung", "cat": "Ausstellung", "img": "el5", "text": "Leuchten aller Art, Hausgeräte und Elektroartikel in unseren Verkaufsräumen."},
            {"name": "Sicherheit", "cat": "Sicherheitssysteme", "img": "el6", "text": "Alarm- und Sicherheitstechnik, Türsprech- und Videosysteme."},
            {"name": "Intelligente Haussteuerung", "cat": "Smart Home", "img": "el7", "text": "Licht, Heizung und Rollläden bequem steuern – sicher und zukunftsfähig."},
            {"name": "Elektro-Prüfung", "cat": "E-Check & Kundendienst", "img": "el2", "text": "Regelmäßige Prüfung Ihrer Anlage und ortsveränderlicher Geräte im Gewerbe."},
        ],
        "item_label": "Leistung", "date_label": "Wunschtermin",
        "form_title": "Anfrage oder Termin", "form_btn": "Anfrage senden", "msg": "Worum geht es? (z. B. Steckdose, Sicherung, Beleuchtung)",
        "cta": "Termin anfragen",
        "highlights": [("Stets für Sie da", "Stromausfall?", "Prüfen Sie zuerst den FI-Schutzschalter. Hilft das nicht, rufen Sie uns an – wir kommen."),
                       ("Ausstellung", "Besuchen Sie unsere große Ausstellung", "Leuchten, Hausgeräte und Elektroartikel – mit Beratung vor Ort und virtuellem Rundgang.")],
        "usps": [
            ("wrench", "Auch kleine Aufträge", "Nicht nur Großprojekte: Sanierungen und Kundendienst erledigen wir genauso gern."),
            ("users", "Engagiertes Team", "Beratung in der Installation und in der Ausstellung – von Menschen aus der Region."),
            ("shield", "Sicherheit geprüft", "E-Check und regelmäßige Prüfung schützen Sie vor Unfällen mit Strom."),
            ("bolt", "Smart Home", "Moderne Haussteuerung, die Komfort bringt und Energie spart."),
            ("sparkle", "Große Ausstellung", "Leuchten und Hausgeräte anfassen und ausprobieren, statt nur im Katalog blättern."),
            ("heart", "Ausbildungsbetrieb", "Wir bilden aus – und sichern so gutes Handwerk für Erlangen."),
        ],
        "steps": [("Anrufen oder anfragen", "Kurz schildern, worum es geht – telefonisch oder online."),
                  ("Termin vereinbaren", "Wir melden uns und finden einen passenden Termin."),
                  ("Erledigt", "Fachgerecht ausgeführt, sauber hinterlassen.")],
        "faq": [
            ("Was tun bei Stromausfall?", "Prüfen Sie, ob der FI-Schutzschalter ausgelöst hat. Schalten Sie alle Sicherungsautomaten aus, schalten Sie den FI wieder ein und danach die Automaten einzeln. Fällt der FI erneut, lassen Sie diesen Automaten aus. Hilft das nicht, rufen Sie uns an."),
            ("Was ist eine Elektro-Prüfung?", "Stromkreise und Verteilungen sollten regelmäßig geprüft werden, zum Beispiel alle 4 Jahre. Im Gewerbe müssen zusätzlich ortsveränderliche Geräte gemessen werden. Wir beraten Sie gern."),
            ("Die Waschmaschine geht nicht mehr auf – was tun?", "Schalten Sie die Maschine für etwa 10 Sekunden aus. Oft lässt sie sich danach öffnen. Viele Geräte haben außerdem eine Notentriegelung hinter einer Klappe unten."),
        ],
        "rating": None,
        "quelle": "das Impressum Ihrer Website",
        "pitch": {
            "status": "WordPress-Seite mit © 2017. Auf dem Handy ist die Startseite breiter als der Bildschirm, weiße Schrift auf hellem Himmel ist kaum lesbar, Tippfehler („zu kommen zulassen“, „Autoamten“), Impressum noch nach altem TMG statt DDG.",
            "angle": "Ein großer Betrieb mit Ausstellung und Ausbildung – aber die Website wirkt veraltet und auf dem Handy kaputt. Neue Seite mit Notdienst-Nummer immer sichtbar."},
    },
    {
        "slug": "schreinerei-stegmann-erlangen",
        "name": "Schreinerei Stegmann",
        "legal": "Stegmann GmbH Schreinerei für Innenausbau",
        "branche": "Schreinerei in Erlangen",
        "city": "Erlangen", "district": "Bruck",
        "street": "Karl-Bröger-Straße 5", "zip": "91058",
        "phone": "09131 65165", "mobile": None, "mail": "info@schreinerei-stegmann.de",
        "hours": [("Mo – Do", "07:00 – 16:30"), ("Freitag", "07:00 – 12:00")],
        "theme": {"bg": "#f7f3ed", "surface": "#fffdf9", "surface2": "#efe6d8", "text": "#2a211a",
                  "muted": "#6b5f54", "primary": "#7a4a24", "on_primary": "#fffdf9", "line": "#e4d8c6",
                  "dark": False, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
                  "headweight": 700, "upper": False, "radius": "12px", "accent": "#7a4a24"},
        "logo_mark": "S",
        "eyebrow": "Schreinerei für Innenausbau · seit 1963",
        "h1": "Über 60 Jahre<br>Handwerk aus Holz.",
        "lead": "Küchen, Wohnmöbel, Bäder und Innenausbau nach Maß – geplant mit Ihnen, gefertigt in unserer Werkstatt in Erlangen und montiert bei Ihnen vor Ort.",
        "trust": [("heart", "Familienbetrieb seit 1963"), ("wrench", "Moderner Maschinenpark"), ("check", "Planung, Fertigung, Montage")],
        "stats": [("1963", "gegründet"), ("60+ Jahre", "Erfahrung"), ("Maß", "statt Massenware"), ("In- & Ausland", "realisierte Aufträge")],
        "hero_img": "sc4",
        "sec": ("Leistungen", "Was wir für Sie<br>aus Holz bauen.", "Jedes Stück wird für Ihren Raum geplant und in unserer eigenen Werkstatt gefertigt."),
        "items": [
            {"name": "Küchen", "cat": "nach Maß", "img": "sc7", "text": "Ihre Küche, exakt für Ihren Grundriss geplant und gefertigt."},
            {"name": "Wohnmöbel", "cat": "Einbau & Einzelstücke", "img": "sc5", "text": "Schränke, Regale und Möbel, die genau in Ihre Nischen passen."},
            {"name": "Bäder", "cat": "Badmöbel", "img": "sc6", "text": "Waschtischunterbauten und Badmöbel für jeden Raum."},
            {"name": "Medizinische Einrichtungen", "cat": "Praxis & Gewerbe", "img": "sc3", "text": "Funktionale Einrichtungen für Praxen und medizinische Räume."},
            {"name": "Fenster & Türen", "cat": "Innenausbau", "img": "sc2", "text": "Türen und Fenster aus Holz – vom Austausch bis zum Einbau."},
            {"name": "Wohnmobil- & Containerausbau", "cat": "Sonderanfertigung", "img": "sc1", "text": "Individuelle Ausbauten für Wohnmobile und Container."},
        ],
        "item_label": "Projekt", "date_label": "Wunschtermin für Beratung",
        "form_title": "Projekt anfragen", "form_btn": "Anfrage senden", "msg": "Erzählen Sie kurz von Ihrem Projekt (Raum, Maße, Idee)",
        "cta": "Projekt anfragen",
        "highlights": [("Service", "Entsorgung inklusive", "Wir bauen Altes aus und entsorgen es für Sie – auch Altholz."),
                       ("Auftragsfertigung", "Für Betriebe und Handwerker", "Wir fertigen nach Ihren Plänen – zuverlässig und termintreu.")],
        "usps": [
            ("heart", "Seit 1963", "Über 60 Jahre Erfahrung im Holzhandwerk – in Erlangen und darüber hinaus."),
            ("check", "Termintreu", "Wir halten Termine und Zusagen. Ändert sich etwas, melden wir uns im Voraus."),
            ("wrench", "Moderner Maschinenpark", "Präzise Fertigung in der eigenen Werkstatt."),
            ("route", "Alles aus einer Hand", "Planung, Fertigung, Montage und Entsorgung – ohne Schnittstellen."),
            ("users", "Persönliche Beratung", "Wir planen gemeinsam mit Ihnen, nicht für Sie."),
            ("sparkle", "Maß statt Massenware", "Möbel, die genau in Ihren Raum passen und lange halten."),
        ],
        "steps": [("Planung", "Wir planen Ihr Projekt gemeinsam mit Ihnen nach Ihren Wünschen."),
                  ("Fertigung", "In unserer Werkstatt mit modernem Maschinenpark."),
                  ("Montage", "In der Werkstatt und bei Ihnen vor Ort – inklusive Entsorgung.")],
        "faq": [
            ("Fertigen Sie auch einzelne Möbelstücke?", "Ja. Vom einzelnen Regal bis zur kompletten Küche fertigen wir nach Maß."),
            ("Übernehmen Sie die Entsorgung alter Möbel?", "Ja. Wir bauen alte Einbauten aus und entsorgen sie für Sie, auch Altholz."),
            ("Arbeiten Sie auch für Gewerbe und Praxen?", "Ja, zum Beispiel medizinische Einrichtungen und Auftragsfertigung für andere Betriebe."),
        ],
        "rating": None,
        "quelle": "das Impressum Ihrer Website",
        "pitch": {
            "status": "WordPress mit Slider aus älteren Plugins. Startseite sagt „Über 50 Jahre“, obwohl seit 1963 (63 Jahre). Auf dem Handy zeigt der Slider oben nur eine dunkle Fläche mit winziger Schrift („Schreinerei Stegman“ mit einem n). Die Hauptadresse leitet unverschlüsselt (http) weiter, im Fuß ist die E-Mail abgeschnitten, dazu Tippfehler.",
            "angle": "63 Jahre Handwerk – die Seite verkauft sie mit 13 Jahren zu wenig. Neue Seite zeigt Küchen und Möbel groß und macht die Anfrage einfach."},
    },
    {
        "slug": "fahrschule-kreiner-erlangen",
        "name": "Fahrschule Kreiner",
        "legal": "Fahrschule Herbert Kreiner",
        "branche": "Fahrschule in Erlangen",
        "city": "Erlangen", "district": "Innenstadt",
        "street": "Hilpertstraße 19", "zip": "91052",
        "phone": "09131 303506", "mobile": None, "mail": "info@fahrschule-kreiner.de",
        "hours": [("Büro Di, Mi, Do", "15:30 – 18:30"), ("Theorie", "nach Plan")],
        "theme": {"bg": "#f5f8fc", "surface": "#ffffff", "surface2": "#e6eef9", "text": "#0e1a2b",
                  "muted": "#566479", "primary": "#0a5ad6", "on_primary": "#fff", "line": "#d9e3f1",
                  "dark": False, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "headweight": 800, "upper": False, "radius": "16px", "accent": "#0a5ad6"},
        "logo_mark": "FK",
        "eyebrow": "Fahrschule in der Erlanger Innenstadt",
        "h1": "Grünes Licht<br>für deine Prüfung.",
        "lead": "Vom ersten Mal Schalten bis zum Führerschein in deiner Hand: Theorie und Praxis parallel, Online-Lernplattform inklusive – mitten in Erlangen.",
        "trust": [("route", "Theorie & Praxis parallel"), ("sparkle", "Online-Lernplattform"), ("pin", "Hilpertstraße, Innenstadt")],
        "stats": [("B", "Auto"), ("A · A1 · A2", "Motorrad"), ("BE · B96", "Anhänger"), ("Online", "Lernen & Prüfungsmodus")],
        "hero_img": "fs5",
        "sec": ("Führerscheine", "Welchen Führerschein<br>willst du machen?", "Melde dich direkt online an – wir rufen dich zurück und besprechen den Start."),
        "items": [
            {"name": "Klasse B", "cat": "Auto", "img": "fs3", "text": "Der klassische Autoführerschein – mit Theorie und Praxis parallel."},
            {"name": "Klasse A, A1 & A2", "cat": "Motorrad", "img": "fs6", "text": "Vom Leichtkraftrad bis zur offenen Klasse."},
            {"name": "Klasse BE & B96", "cat": "Anhänger", "img": "fs7", "text": "Für Wohnwagen, Pferdeanhänger und schwere Gespanne."},
        ],
        "item_label": "Führerscheinklasse", "date_label": "Gewünschter Start",
        "form_title": "Jetzt anmelden", "form_btn": "Anmeldung anfragen", "msg": "Fragen oder Wünsche (z. B. Ferienkurs, Erfahrung)",
        "cta": "Jetzt anmelden", "card_btn": "Anmelden",
        "highlights": [("Online-Lernplattform", "Übung macht den Meister", "Alle Prüfungsfragen üben – die Plattform merkt sich falsche Antworten und hilft gezielt."),
                       ("Prüfungsmodus", "Bist du bereit?", "Teste in einer Simulation der offiziellen Prüfung, ob du fit bist.")],
        "usps": [
            ("route", "Theorie & Praxis parallel", "Nach ein paar Theoriestunden kannst du – je nach Kapazität – schon mit dem Fahren starten."),
            ("sparkle", "Lernen online", "Alle Prüfungsfragen jederzeit üben, mit Prüfungssimulation."),
            ("users", "Lehrer, die zuhören", "Fragen zur Theorie klärst du direkt im Unterricht."),
            ("pin", "Mitten in Erlangen", "Hilpertstraße 19 – gut erreichbar mit Bus und Rad."),
            ("check", "Schnell zugeteilt", "Schüler loben die schnelle Zuteilung zu einem Fahrlehrer."),
            ("heart", "Mit Spaß ans Ziel", "Locker, aber gründlich – bis du sicher fährst."),
        ],
        "steps": [("Anmelden", "Online oder im Büro (Di, Mi, Do 15:30–18:30 Uhr)."),
                  ("Lernen & Fahren", "Theorie im Unterricht und online, Fahrstunden parallel."),
                  ("Prüfung bestehen", "Mit Prüfungssimulation gut vorbereitet zum Führerschein.")],
        "faq": [
            ("Kann ich Theorie und Praxis gleichzeitig machen?", "Ja, nach ein paar Theoriestunden kannst du parallel mit den Fahrstunden beginnen, sofern ein Fahrlehrer frei ist."),
            ("Wann ist das Büro geöffnet?", "Dienstag, Mittwoch und Donnerstag von 15:30 bis 18:30 Uhr in der Hilpertstraße 19."),
            ("Wie lerne ich für die Theorieprüfung?", "Mit unserer Online-Lernplattform: alle Fragen, gezieltes Üben falscher Antworten und ein Prüfungsmodus."),
        ],
        "rating": None,
        "quelle": "das Impressum Ihrer Website",
        "pitch": {
            "status": "Ordentliche Seite, aber ohne Online-Anmeldung und ohne Infos zu den einzelnen Klassen. Das Bewertungs-Widget zeigt englische Zeitangaben („10 months ago“), Telefon und Bürozeiten stehen erst weit unten.",
            "angle": "Fahrschüler sind jung und am Handy: ein „Jetzt anmelden“-Button oben bringt Anmeldungen auch außerhalb der Bürozeiten (nur Di–Do 15:30–18:30)."},
    },
    {
        "slug": "friseur-kern-erlangen",
        "name": "Friseursalon Kern",
        "legal": "Friseursalon Kern · Inh. Jennifer Weißmeier",
        "branche": "Friseur in Erlangen",
        "city": "Erlangen", "district": "Alterlangen",
        "street": "Schobertweg 1", "zip": "91056",
        "phone": "09131 41171", "mobile": None, "mail": None,
        "hours": [("Di – Fr", "07:30 – 17:00*"), ("Samstag", "08:00 – 13:00*"), ("So & Mo", "geschlossen")],
        "theme": {"bg": "#faf7f4", "surface": "#ffffff", "surface2": "#f1e9e3", "text": "#1d1a19",
                  "muted": "#6a625e", "primary": "#1d1a19", "on_primary": "#faf7f4", "line": "#e8ddd5",
                  "dark": False, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Didot', 'Bodoni 72', 'Iowan Old Style', Georgia, serif",
                  "headweight": 600, "upper": False, "radius": "2px", "accent": "#b07a5a"},
        "logo_mark": "K",
        "eyebrow": "Friseursalon in Alterlangen · seit über 60 Jahren",
        "h1": "Haare sind<br>meine Leidenschaft.",
        "lead": "Schneiden, Färben, Balayage und Styling mit ausführlicher Beratung – im Traditionssalon der Familie Kern, heute mit italienischem Flair von Jennifer Weißmeier.",
        "trust": [("star", "4,9 ★ bei 582 Bewertungen"), ("heart", "Über 60 Jahre Salon Kern"), ("calendar", "Online-Termin 24/7")],
        "stats": [("4,9 ★", "582 Bewertungen auf Planity"), ("60+", "Jahre Salon Kern"), ("24/7", "online buchen"), ("Innung", "Mitgliedsbetrieb")],
        "hero_img": "hs6",
        "sec": ("Leistungen", "Was wir für Ihr Haar tun.", "Jeder Termin beginnt mit einer ausführlichen Beratung – damit das Ergebnis wirklich zu Ihnen passt."),
        "items": [
            {"name": "Schneiden & Waschen", "cat": "Damen & Herren", "img": "hs2", "text": "Ein Haarschnitt ist wie ein Outfit – er gehört zum Gesamteindruck."},
            {"name": "Färben", "cat": "Strähnen · Balayage · Painting", "img": "hs3", "text": "Haare färben ist eine Kunst: von natürlichen Strähnen bis zum Balayage."},
            {"name": "Styling & Dauerwelle", "cat": "für jeden Anlass", "img": "hs7", "text": "Das Leben ist nicht perfekt – Ihre Frisur kann es sein."},
            {"name": "Pflege", "cat": "Treatments", "img": "hs1", "text": "Pflegebehandlungen, die Ihr Haar spürbar gesund machen."},
            {"name": "Wimpern & Augenbrauen", "cat": "Färben & Formen", "img": "hs8", "text": "Augenbrauen formen, Wimpern und Brauen färben."},
        ],
        "item_label": "Leistung", "date_label": "Wunschtag",
        "form_title": "Termin anfragen", "form_btn": "Termin anfragen", "msg": "Wünsche oder Fragen (z. B. Länge, Farbe)",
        "cta": "Termin buchen", "card_btn": "Termin",
        "highlights": [("Online-Buchung", "Termin buchen – rund um die Uhr", "Ihren Wunschtermin buchen Sie jederzeit online, auch abends oder am Sonntag."),
                       ("Tradition", "Über 60 Jahre Salon Kern", "Gegründet von Familie Kern, heute geführt von Jennifer Weißmeier – mit italienischem Charme.")],
        "usps": [
            ("users", "Ausführliche Beratung", "Am Anfang jedes Termins nehmen wir uns Zeit für Ihre Wünsche."),
            ("star", "4,9 von 5 Sternen", "Über 580 Bewertungen – unsere Kundinnen und Kunden sprechen für uns."),
            ("sparkle", "Färben ist Kunst", "Strähnen, Balayage und Painting – modern und typgerecht."),
            ("calendar", "Termin online", "Rund um die Uhr buchbar, ohne Warteschleife."),
            ("heart", "Mit Leidenschaft", "„Friseurin zu sein heißt für mich nicht nur Haare schneiden – es ist meine Leidenschaft.“"),
            ("pin", "In Alterlangen", "Schobertweg 1 – Ihr Salon in der Nachbarschaft."),
        ],
        "steps": [("Termin buchen", "Online rund um die Uhr oder telefonisch."),
                  ("Beratung", "Wir besprechen in Ruhe, was zu Ihnen passt."),
                  ("Wohlfühlen", "Schneiden, Färben, Styling – und mit neuem Look nach Hause.")],
        "faq": [
            ("Kann ich online einen Termin buchen?", "Ja, rund um die Uhr über unsere Online-Terminbuchung."),
            ("Bieten Sie Balayage an?", "Ja, neben Strähnen und Painting gehört Balayage zu unseren Färbetechniken."),
            ("Färben Sie auch Wimpern und Augenbrauen?", "Ja, und wir formen auch Ihre Augenbrauen."),
        ],
        "rating": (4.9, 582), "rating_src": "Planity",
        "quelle": "das Impressum Ihrer Website",
        "pitch": {
            "status": "Wix-Seite mit © 2023. Die 4,9 Sterne bei 582 Bewertungen tauchen auf der Website gar nicht auf. Englische Texte („The Best in the World“, „Essential Looks & Products“), keine Leistungen, Preise oder Öffnungszeiten auf der Startseite, die E-Mail läuft über eine andere Domain (mobilerfriseur-jenny.de).",
            "angle": "Top-Bewertungen und 60 Jahre Tradition, aber die Website verschenkt beides. Neue Seite macht daraus Vertrauen und leitet direkt zur Online-Buchung."},
    },
    {
        "slug": "gasthof-guethlein-erlangen",
        "name": "Gasthof Güthlein",
        "legal": "Gasthof Güthlein · Jana Güthlein",
        "branche": "Gasthof, Hotel & Metzgerei",
        "city": "Erlangen", "district": "Büchenbach",
        "street": "Dorfstraße 14", "zip": "91056",
        "phone": "09131 7920", "mobile": None, "mail": "info@gasthof-guethlein.de",
        "hours": [("Gasthof", "täglich geöffnet"), ("Reservierung", "09131 7920")],
        "theme": {"bg": "#f8f3ea", "surface": "#fffdf8", "surface2": "#efe4d2", "text": "#2b1d17",
                  "muted": "#6e5c50", "primary": "#7b1e2b", "on_primary": "#fffdf8", "line": "#e6d7c2",
                  "dark": False, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
                  "headweight": 700, "upper": False, "radius": "12px", "accent": "#7b1e2b"},
        "logo_mark": "G",
        "eyebrow": "Gasthof · Hotel · Metzgerei in Büchenbach",
        "h1": "Schäufele, Steaks<br>und fränkische Klassiker.",
        "lead": "Täglich für Sie da: fränkische Küche aus eigener Metzgerei, gemütliche Räume für jede Feier, Zimmer zum Übernachten – und alles auch zum Mitnehmen.",
        "trust": [("heart", "Eigene Metzgerei"), ("calendar", "Täglich geöffnet"), ("users", "Feiern & Tagen")],
        "stats": [("Täglich", "für Sie da"), ("Eigene", "Metzgerei & Bratwurst"), ("ToGo", "alle Speisen"), ("Hotel", "Zimmer im Haus")],
        "hero_img": "gh8",
        "sec": ("Bei uns", "Essen, feiern,<br>übernachten.", "Alles unter einem Dach in der Dorfstraße – seit Generationen fränkische Gastfreundschaft."),
        "items": [
            {"name": "Restaurant", "cat": "fränkisch genießen", "img": "gh1", "text": "Die besten Steaks und Schäufele der Stadt, dazu Karpfen und saisonale Schmankerl."},
            {"name": "Metzgerei", "cat": "Heiße Theke", "img": "gh3", "text": "Güthlein’s Bratwurst, Wochenangebote – auch in der Filiale am Rudeltplatz."},
            {"name": "Partyservice & Catering", "cat": "außer Haus", "img": "gh4", "text": "Buffets und Menüs für Ihre Feier – geliefert oder zum Abholen."},
            {"name": "Feiern & Tagen", "cat": "Hochzeit · Weihnachtsfeier · Tagung", "img": "gh2", "text": "Räume für jede Größe, mit Menü- und Buffetvorschlägen."},
            {"name": "Hotel", "cat": "fast wie zu Hause", "img": "gh5", "text": "Gemütliche Zimmer – auch für längere Aufenthalte."},
            {"name": "Speisen ToGo", "cat": "für Zuhause", "img": "gh9", "text": "Einfach anrufen, Gefäße mitbringen und abholen."},
        ],
        "item_label": "Anliegen", "date_label": "Datum",
        "form_title": "Tisch reservieren", "form_btn": "Anfrage senden", "msg": "Personenzahl, Uhrzeit oder Wünsche",
        "cta": "Tisch reservieren", "card_btn": "Reservieren",
        "highlights": [("Klassikerzeit", "Jeden 1. Freitag: Spare Ribs", "Saftig-knusprig mit Barbecue-Marinade und Kartoffelspalten."),
                       ("Klassikerzeit", "Jeden 3. Freitag: Ochsenbäckchen", "Geschmort, mit Burgundersauce, Semmelknödeln und Speckbohnen.")],
        "usps": [
            ("heart", "Aus eigener Metzgerei", "Fleisch und Wurst aus dem eigenen Haus – Qualität, die man schmeckt."),
            ("calendar", "Täglich geöffnet", "Wir sind jeden Tag für Sie da."),
            ("users", "Platz für jede Feier", "Verschiedene Räume für Hochzeit, Geburtstag, Weihnachtsfeier oder Tagung."),
            ("box", "Alles auch ToGo", "Sämtliche Speisen zum Abholen – einfach vorher anrufen."),
            ("sparkle", "Saisonale Schmankerl", "Pfifferlinge, Aischgründer Karpfen, Braten und fränkische Klassiker."),
            ("pin", "In Büchenbach", "Dorfstraße 14 – mit Hotel für Gäste von außerhalb."),
        ],
        "steps": [("Anrufen oder anfragen", "Tisch, Feier oder Zimmer – telefonisch oder online."),
                  ("Bestätigung", "Wir melden uns mit allen Details zurück."),
                  ("Genießen", "Und wir kümmern uns um den Rest.")],
        "faq": [
            ("Kann ich Speisen mitnehmen?", "Ja, alle Speisen gibt es auch zum Abholen. Einfach anrufen und gern eigene Gefäße mitbringen."),
            ("Wann gibt es Spare Ribs und Ochsenbäckchen?", "Spare Ribs jeden ersten Freitag im Monat, Ochsenbäckchen jeden dritten Freitag."),
            ("Richten Sie auch Hochzeiten und Firmenfeiern aus?", "Ja, mit passenden Räumen sowie Menü- und Buffetvorschlägen. Auch Partyservice außer Haus ist möglich."),
        ],
        "rating": None,
        "quelle": "das Impressum Ihrer Website",
        "pitch": {
            "status": "Umfangreiche, gepflegte Inhalte (Speisekarte, Klassikerzeit), aber auf dem Handy liegen die Facebook-, Karten- und Mail-Symbole über dem Text, die Grundschrift ist mit 13 px sehr klein, das Menü hat über 30 Punkte, der Cookie-Hinweis arbeitet noch mit „Wer weitersurft, stimmt zu“.",
            "angle": "Vier Geschäfte in einem (Gasthof, Hotel, Metzgerei, Catering). Neue Seite: klar gegliedert, „Tisch reservieren“ immer sichtbar, Speisekarte als schöne Seite statt PDF."},
    },
]


def build(b):
    t = dict(b["theme"])
    full_addr = f'{b["street"]}, {b["zip"]} {b["city"]}'
    maps = "https://www.google.com/maps/search/?api=1&query=" + re.sub(r"\s+", "+", f'{b["legal"]} {full_addr}')
    tel = "tel:+" + intl(b["phone"])
    title = f'{b["name"]} – {b["branche"]}'

    cards = []
    for i, v in enumerate(b["items"]):
        cards.append(
            f'<article class="vc"><div class="pic">{g.photo(v["img"], v["name"])}<span class="sym">Symbolbild</span></div>'
            f'<span class="cat">{esc(v["cat"])}</span><h3>{esc(v["name"])}</h3><p class="txt">{esc(v["text"])}</p>'
            f'<div class="foot"><div class="price"><small>{esc(b["item_label"])}</small><b class="ask">anfragen</b></div>'
            f'<a href="#anfrage" class="btn btn-o btn-sm" data-pick="{i}">{esc(b.get("card_btn", "Anfragen"))}</a></div></article>')
    usps = "".join(f'<div class="usp"><div class="ib">{ico(i)}</div><h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for i, h, p in b["usps"])
    steps = "".join(f'<div class="step"><h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for h, p in b["steps"])
    faq = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in b["faq"])
    trust = "".join(f'<li>{ico(i)}{esc(s)}</li>' for i, s in b["trust"])
    stats = "".join(f'<div class="stat"><b>{esc(n)}</b><span>{esc(l)}</span></div>' for n, l in b["stats"])
    hours = "".join(f"<tr><td>{esc(d)}</td><td>{esc(h)}</td></tr>" for d, h in b["hours"])
    hls = "".join(f'<div class="hl"><span class="tag">{esc(a)}</span><h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for a, h, p in b["highlights"])
    options = "".join(f'<option value="{i}">{esc(v["name"])}</option>' for i, v in enumerate(b["items"]))
    sec_eb, sec_h2, sec_p = b["sec"]

    rating = ""
    if b.get("rating"):
        score, count = b["rating"]
        src = b.get("rating_src", "Google")
        rating = f'''
<section><div class="wrap"><div class="rate">
  <div><div class="big">{str(score).replace(".", ",")}</div><div class="stars">{ico("star") * 5}</div><small>{count} Bewertungen auf {src}</small></div>
  <div><h2>Kundinnen und Kunden empfehlen uns.</h2><p>Echte Bewertungen von echten Kundinnen und Kunden – in der Live-Version erscheinen hier die neuesten Bewertungen automatisch.</p></div>
</div></div></section>'''

    contact = [f'<li>{ico("pin")}<div><b>Adresse</b><br>{esc(b["street"])}<br>{esc(b["zip"])} {esc(b["city"])}-{esc(b["district"])}</div></li>',
               f'<li>{ico("phone")}<div><b>Telefon</b><br><a href="{tel}">{esc(b["phone"])}</a></div></li>']
    if b.get("mail"):
        contact.append(f'<li>{ico("mail")}<div><b>E-Mail</b><br><a href="mailto:{esc(b["mail"])}">{esc(b["mail"])}</a></div></li>')

    pv_link = f'https://wa.me/{AGENCY["wa"]}?text=' + re.sub(" ", "%20", f'Hallo, ich habe die Website-Vorschau für {b["name"]} gesehen und möchte mehr wissen.')
    today_note = "* Angaben in dieser Vorschau stammen aus öffentlich verfügbaren Quellen (Stand 10/2026) und werden vor dem Livegang gemeinsam mit Ihnen geprüft und ergänzt."

    return f'''<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<meta name="theme-color" content="{t["bg"]}">
<title>{esc(title)}</title>
<meta name="description" content="{esc(b["lead"])}">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='{t["primary"].replace("#", "%23")}'/%3E%3C/svg%3E">
<style>{theme_vars(t)}{CSS}{LOKAL_CSS}</style>
</head>
<body>

<div class="pv" id="pv"><div class="wrap">
  <span><b>Vorschau</b> · Unverbindlicher Entwurf von {AGENCY["name"]} für {esc(b["name"])} – keine offizielle Website. Gefällt sie Ihnen? Sie kann in wenigen Tagen live sein.</span>
  <span style="display:flex;gap:8px;align-items:center"><a class="pvbtn" href="{pv_link}" target="_blank" rel="noopener">Jetzt übernehmen</a><button aria-label="Hinweis schließen" onclick="document.getElementById('pv').remove()">{ico("x")}</button></span>
</div></div>

<header class="hd"><div class="wrap">
  <a class="brand" href="#top"><span class="mark">{esc(b["logo_mark"])}</span><span>{esc(b["name"])}<small>{esc(b["branche"])}</small></span></a>
  <nav class="nav" aria-label="Hauptnavigation"><a href="#leistungen">{esc(sec_eb)}</a><a href="#vorteile">Vorteile</a><a href="#ablauf">Ablauf</a><a href="#faq">FAQ</a><a href="#kontakt">Kontakt</a></nav>
  <a class="btn btn-p btn-sm hcta" href="{tel}">{ico("phone")}{esc(b["phone"])}</a>
</div></header>

<main id="top">
<section class="hero"><div class="wrap">
  <div>
    <span class="eyebrow">{esc(b["eyebrow"])}</span>
    <h1>{b["h1"]}</h1>
    <p class="lead">{esc(b["lead"])}</p>
    <div class="cta"><a class="btn btn-p" href="#anfrage">{esc(b["cta"])} {ico("arrow")}</a><a class="btn btn-o" href="{tel}">{ico("phone")}{esc(b["phone"])}</a></div>
    <ul class="trust">{trust}</ul>
  </div>
  <div>
    <div class="stage">{g.photo(b["hero_img"], b["name"], eager=True)}<div class="badge">{ico(b["trust"][0][0])}<span>{esc(b["trust"][0][1])}</span></div></div>
    <div class="book" id="anfrage">
      <form id="bf" novalidate>
        <h3>{esc(b["form_title"])}</h3>
        <p class="muted" style="font-size:.92rem">Unverbindlich · Rückmeldung in Kürze</p>
        <div class="row"><div><label for="veh">{esc(b["item_label"])}</label><select id="veh">{options}</select></div><div><label for="d1">{esc(b["date_label"])}</label><input type="date" id="d1"></div></div>
        <div class="row"><div><label for="nm">Name</label><input id="nm" autocomplete="name" placeholder="Ihr Name" required></div><div><label for="ph">Telefon</label><input id="ph" type="tel" autocomplete="tel" placeholder="Für die Rückmeldung" required></div></div>
        <div class="row" style="grid-template-columns:1fr"><div><label for="msg">Nachricht</label><textarea id="msg" placeholder="{esc(b["msg"])}"></textarea></div></div>
        <div style="height:14px"></div>
        <button class="btn btn-p" type="submit">{esc(b["form_btn"])} {ico("arrow")}</button>
      </form>
      <div class="ok" role="status">
        <div class="tick">{ico("check")}</div>
        <h3>Anfrage ist angekommen</h3>
        <p>Vorschau-Demo: In der Live-Version landet diese Anfrage sofort per E-Mail bei {esc(b["name"])}.</p>
        <button class="btn btn-o btn-sm" type="button" id="again">Neue Anfrage</button>
      </div>
    </div>
  </div>
</div></section>

<div class="stats"><div class="wrap">{stats}</div></div>

<section id="leistungen"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">{esc(sec_eb)}</span><h2>{sec_h2}</h2></div><p>{esc(sec_p)}</p></div>
  <div class="grid fleet">{"".join(cards)}</div>
  <div class="highlight" style="margin-top:24px">{hls}</div>
</div></section>

<section id="vorteile" class="alt"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">Warum {esc(b["name"])}</span><h2>Aus Erlangen.<br>Für Erlangen.</h2></div><p>Persönlich, erreichbar und mit Erfahrung – ein Betrieb, der hier zu Hause ist.</p></div>
  <div class="grid usps">{usps}</div>
</div></section>

<section id="ablauf"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">So einfach geht’s</span><h2>In drei Schritten.</h2></div></div>
  <div class="grid steps">{steps}</div>
</div></section>
{rating}
<section id="faq" class="alt"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">Häufige Fragen</span><h2>Gut zu wissen.</h2></div></div>
  <div class="faq">{faq}</div>
</div></section>

<section id="kontakt"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">Kontakt & Anfahrt</span><h2>Wir sind für Sie da.</h2></div></div>
  <div class="contact">
    <div class="card"><h3>{esc(b["legal"])}</h3><ul class="cl">{"".join(contact)}</ul>
      <a class="mapbtn" href="{maps}" target="_blank" rel="noopener">{ico("pin")}Route in Google Maps öffnen</a></div>
    <div class="card"><h3>Öffnungszeiten</h3><table class="hrs">{hours}</table>
      <div class="cta"><a class="btn btn-p" href="{tel}">{ico("phone")}Jetzt anrufen</a><a class="btn btn-o" href="#anfrage">Online anfragen</a></div></div>
  </div>
  <p class="note">{today_note}</p>
</div></section>
</main>

<footer class="ft"><div class="wrap">
  <span>Entwurf für {esc(b["legal"])} · {esc(full_addr)}</span>
  <span>Fotos: Unsplash (Symbolbilder) · Entwurf: <a href="{AGENCY["url"]}" target="_blank" rel="noopener">{AGENCY["name"]}</a> · <a href="{AGENCY["url"]}/impressum.html" target="_blank" rel="noopener">Impressum</a> · <a href="{AGENCY["url"]}/datenschutz.html" target="_blank" rel="noopener">Datenschutz</a></span>
</div></footer>

<nav class="mb" aria-label="Schnellkontakt">
  <a class="btn btn-o" href="{tel}">{ico("phone")}Anrufen</a><a class="btn btn-o" href="#kontakt">{ico("pin")}Anfahrt</a><a class="btn btn-p" href="#anfrage">{esc(b.get("card_btn", "Anfragen"))}</a>
</nav>

<script>
(function(){{
  var f=document.getElementById('bf'),veh=document.getElementById('veh'),box=document.querySelector('.book');
  var d1=document.getElementById('d1');d1.min=new Date().toISOString().slice(0,10);
  document.querySelectorAll('[data-pick]').forEach(function(a){{a.addEventListener('click',function(){{veh.value=a.getAttribute('data-pick')}})}});
  f.addEventListener('submit',function(e){{
    e.preventDefault();
    var nm=document.getElementById('nm'),ph=document.getElementById('ph');
    if(!nm.value.trim()){{nm.focus();return}} if(!ph.value.trim()){{ph.focus();return}}
    box.classList.add('sent');
  }});
  document.getElementById('again').addEventListener('click',function(){{box.classList.remove('sent')}});
}})();
</script>
</body>
</html>
'''


def main():
    for inline in (False, True):
        g.INLINE = inline
        for b in BETRIEBE:
            if inline:
                d = os.path.join(OUT, "einzeldateien"); os.makedirs(d, exist_ok=True)
                path = os.path.join(d, b["slug"] + ".html")
            else:
                d = os.path.join(OUT, b["slug"]); os.makedirs(d, exist_ok=True)
                path = os.path.join(d, "index.html")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(build(b))
    print(f"{len(BETRIEBE)} lokale Vorschauen erzeugt")


if __name__ == "__main__":
    main()
