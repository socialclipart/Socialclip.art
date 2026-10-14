#!/usr/bin/env python3
"""Erzeugt die Vorschau-Websites für Autovermietungen unter /vorschau/.

Jede Vermietung bekommt eine eigene, komplett eigenständige Seite
(keine externen Requests, kein Tracking, DSGVO-freundlich).
Aufruf:  python3 tools/vorschau_generator.py
"""
import html
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "vorschau")

AGENCY = {
    "name": "SocialClip",
    "phone": "0176 46188101",
    "wa": "4917646188101",
    "mail": "socialclip.art@gmail.com",
    "url": "https://socialclip.art",
}

# --------------------------------------------------------------------------
# Fahrzeug-Illustrationen (Seitenansicht, flach). {c} = Lackfarbe
# --------------------------------------------------------------------------
WHEEL = ('<g><circle cx="{x}" cy="{y}" r="21" fill="#1b1d22"/>'
         '<circle cx="{x}" cy="{y}" r="11" fill="#c9ccd3"/>'
         '<circle cx="{x}" cy="{y}" r="4" fill="#1b1d22"/></g>')


def wheels(*xs, y=104):
    return "".join(WHEEL.format(x=x, y=y) for x in xs)


SHADOW = '<ellipse cx="160" cy="126" rx="150" ry="7" fill="#000" opacity=".18"/>'
GLASS = "#cfe3f2"

VEHICLES = {
    "sedan": lambda c: (
        SHADOW +
        f'<path d="M14 104 V88 Q16 76 34 73 L92 66 Q122 42 154 38 H206 Q236 40 258 64 L292 70 Q308 74 308 90 V104 Z" fill="{c}"/>'
        f'<path d="M106 66 Q130 47 154 45 H180 V66 Z M188 45 H206 Q226 47 244 66 H188 Z" fill="{GLASS}"/>'
        '<rect x="292" y="80" width="14" height="6" rx="3" fill="#ffd36b"/>'
        '<rect x="14" y="82" width="10" height="6" rx="3" fill="#e5484d"/>'
        '<path d="M60 90 H300" stroke="#000" stroke-opacity=".12" stroke-width="2"/>' + wheels(78, 248)),
    "ev": lambda c: (
        SHADOW +
        f'<path d="M14 104 V90 Q16 78 36 74 L96 64 Q130 36 168 34 H198 Q236 36 266 64 L296 72 Q310 78 308 94 V104 Z" fill="{c}"/>'
        f'<path d="M108 64 Q138 42 168 40 H200 Q232 42 254 64 Z" fill="#5d6b7e"/>'
        '<path d="M184 40 V64" stroke="' + c + '" stroke-width="5"/>'
        '<rect x="290" y="82" width="16" height="4" rx="2" fill="#e8f1ff"/>' + wheels(80, 246)),
    "suv": lambda c: (
        SHADOW +
        f'<path d="M14 104 V74 Q16 62 34 60 L80 56 Q104 30 132 28 H226 Q252 30 268 56 L294 62 Q308 66 308 84 V104 Z" fill="{c}"/>'
        f'<path d="M94 56 Q112 36 134 35 H174 V56 Z M182 35 H222 Q242 37 256 56 H182 Z" fill="{GLASS}"/>'
        '<rect x="128" y="22" width="100" height="5" rx="2" fill="#2b2f36"/>'
        '<rect x="292" y="70" width="14" height="6" rx="3" fill="#ffd36b"/>' + wheels(78, 248)),
    "van": lambda c: (
        SHADOW +
        f'<path d="M14 104 V44 Q16 30 34 28 H226 Q250 30 270 58 L296 66 Q308 70 308 88 V104 Z" fill="{c}"/>'
        f'<path d="M34 38 H78 V62 H34 Z M88 38 H132 V62 H88 Z M142 38 H186 V62 H142 Z M196 38 H226 Q244 40 258 62 H196 Z" fill="{GLASS}"/>'
        '<rect x="294" y="76" width="12" height="6" rx="3" fill="#ffd36b"/>' + wheels(74, 250)),
    "transporter": lambda c: (
        SHADOW +
        f'<path d="M10 104 V22 Q10 12 22 12 H226 Q240 12 248 26 L262 54 L294 64 Q308 68 308 86 V104 Z" fill="{c}"/>'
        f'<path d="M228 22 Q238 22 244 32 L256 56 H228 Z" fill="{GLASS}"/>'
        '<path d="M222 16 V100 M150 16 V100" stroke="#000" stroke-opacity=".14" stroke-width="2"/>'
        '<rect x="294" y="74" width="12" height="6" rx="3" fill="#ffd36b"/>' + wheels(66, 252)),
    "truck": lambda c: (
        SHADOW +
        '<rect x="8" y="10" width="214" height="84" rx="6" fill="#f2f3f5" stroke="#d5d8de" stroke-width="2"/>'
        f'<rect x="8" y="78" width="214" height="16" fill="{c}"/>'
        f'<path d="M230 104 V40 Q230 32 240 32 H270 Q292 34 300 60 L308 70 V104 Z" fill="{c}"/>'
        f'<path d="M244 40 H268 Q284 42 292 62 H244 Z" fill="{GLASS}"/>'
        '<rect x="8" y="94" width="300" height="6" fill="#2b2f36"/>' + wheels(56, 176, 270)),
    "trailer": lambda c: (
        SHADOW +
        f'<rect x="30" y="34" width="210" height="58" rx="6" fill="{c}"/>'
        '<path d="M30 48 H240" stroke="#000" stroke-opacity=".15" stroke-width="2"/>'
        '<path d="M240 86 L306 96" stroke="#2b2f36" stroke-width="6" stroke-linecap="round"/>'
        '<circle cx="306" cy="96" r="6" fill="#2b2f36"/>' + wheels(136)),
}


INLINE = False
_CACHE = {}


def img_src(name):
    if not INLINE:
        return f"../img/{name}.webp"
    if name not in _CACHE:
        import base64, io
        from PIL import Image
        im = Image.open(os.path.join(OUT, "img", name + ".webp")).convert("RGB")
        im.thumbnail((1000, 1000))
        buf = io.BytesIO()
        im.save(buf, "WEBP", quality=62)
        _CACHE[name] = "data:image/webp;base64," + base64.b64encode(buf.getvalue()).decode()
    return _CACHE[name]


def photo(name, alt, eager=False):
    return (f'<img src="{img_src(name)}" alt="{esc(alt)}"{"" if INLINE else " decoding=\"async\""}'
            f'{"" if eager or INLINE else " loading=\"lazy\""} width="1400" height="933">')


def svg(kind, color, cls="car"):
    return (f'<svg class="{cls}" viewBox="0 0 320 136" role="img" aria-hidden="true">'
            f'{VEHICLES[kind](color)}</svg>')


# --------------------------------------------------------------------------
# Icons (Linien, 24px)
# --------------------------------------------------------------------------
ICONS = {
    "phone": '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2"/>',
    "wa": '<path d="M3 21l1.6-4.8A9 9 0 1112 21a9 9 0 01-4.2-1z"/><path d="M9 9.5c.4 2 2.3 4 4.5 4.5l1-1.2 2 .9c-.3 1.3-1.4 2-2.6 1.8A7 7 0 018 10.1c-.1-1.2.6-2.3 1.8-2.6l.9 2z"/>',
    "check": '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    "clock": '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    "pin": '<path d="M12 21s-7-6.2-7-12a7 7 0 0114 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
    "mail": '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    "shield": '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    "key": '<circle cx="8" cy="15" r="4"/><path d="M11 12l8-8M16 7l2 2M14 9l2 2"/>',
    "bolt": '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    "star": '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    "users": '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0113 0M16 4.5a3.5 3.5 0 010 7M18 14a6 6 0 013.5 6"/>',
    "truck": '<path d="M2 6h12v10H2zM14 10h4l3 3v3h-7"/><circle cx="6" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    "euro": '<path d="M18 6.5A7 7 0 107 17.5 7 7 0 0018 17.5M4 10.5h9M4 13.5h9"/>',
    "calendar": '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    "wrench": '<path d="M14.5 6.5a4 4 0 005 5L12 19a2 2 0 01-3-3l7.5-7.5a4 4 0 01-2-2z"/>',
    "box": '<path d="M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z"/><path d="M3 7.5l9 4.5 9-4.5M12 12v9"/>',
    "route": '<circle cx="6" cy="18" r="2.5"/><circle cx="18" cy="6" r="2.5"/><path d="M8.5 18H16a3 3 0 000-6H8a3 3 0 010-6h7.5"/>',
    "heart": '<path d="M12 20s-8-4.7-8-10.5A4.5 4.5 0 0112 7a4.5 4.5 0 018 2.5C20 15.3 12 20 12 20z"/>',
    "leaf": '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15"/><path d="M5 19l7-7"/>',
    "briefcase": '<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5h6v2M3 12h18"/>',
    "sparkle": '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/>',
    "arrow": '<path d="M5 12h14M13 6l6 6-6 6"/>',
    "x": '<path d="M6 6l12 12M18 6L6 18"/>',
}


def ico(name, cls="ico"):
    return (f'<svg class="{cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" '
            f'stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">'
            f'{ICONS[name]}</svg>')


def esc(s):
    return html.escape(str(s), quote=True)


def intl(phone):
    d = re.sub(r"\D", "", phone)
    if d.startswith("00"):
        d = d[2:]
    elif d.startswith("0"):
        d = "49" + d[1:]
    return d


# --------------------------------------------------------------------------
# Die Vermietungen. Alle Fakten aus öffentlichen Angaben (Website,
# Branchenbücher, Kleinanzeigen-Profil, Bewertungsportale), Stand 10/2026.
# price=None -> "Preis auf Anfrage"
# --------------------------------------------------------------------------
BUSINESSES = [
    {
        "slug": "map-rent-nuernberg", "hero_img": "van4",
        "name": "MAP Rent",
        "legal": "MAP Rent Fahrzeugvermietung",
        "city": "Nürnberg",
        "district": "Südstadt",
        "street": "Allersberger Straße 64",
        "zip": "90461",
        "phone": "0162 1615835",
        "mobile": "0162 1615835",
        "mail": None,
        "hours": [("Mo – Fr", "07:30 – 21:00"), ("Samstag", "08:00 – 22:00"), ("Sonntag", "09:00 – 21:00")],
        "theme": {"bg": "#0e0f12", "surface": "#17191e", "surface2": "#20232a", "text": "#f3f1ea",
                  "muted": "#a3a6ad", "primary": "#f5b301", "on_primary": "#111", "line": "#2b2f37",
                  "dark": True, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Avenir Next Condensed', 'Arial Narrow', 'Roboto Condensed', system-ui, sans-serif",
                  "headweight": 800, "upper": True, "radius": "6px"},
        "logo_mark": "MAP",
        "eyebrow": "Pkw & Transporter · Nürnberg-Südstadt",
        "h1": "Heute mieten.<br>Heute losfahren.",
        "lead": "Sprinter, Crafter Maxi oder BMW 530e – vollgetankt, mit Spanngurten und Umzugsdecken. Anfrage per WhatsApp, Antwort in Minuten. Auch am Sonntag.",
        "trust": [("clock", "7 Tage die Woche geöffnet"), ("wa", "Buchung per WhatsApp"), ("box", "Spanngurte & Decken inklusive")],
        "stats": [("7", "Tage pro Woche geöffnet"), ("bis 22 Uhr", "samstags erreichbar"), ("100 km", "inklusive pro Tag*"), ("100 €", "Kaution Transporter*")],
        "hero_vehicle": "transporter",
        "hero_color": "#f5b301",
        "fleet": [
            {"name": "Mercedes Sprinter", "cat": "Transporter", "img": "van1", "kind": "transporter", "price": 79,
             "unit": "Tag (Mo–Fr, inkl. 100 km)", "specs": ["3 Sitze", "Führerschein B", "Wochenende 99 €/Tag", "3 Std. ab 60 €"]},
            {"name": "VW Crafter Maxi", "img": "van2", "cat": "Transporter", "kind": "transporter", "price": None,
             "specs": ["Hochdach, extralang", "Führerschein B", "Ideal für Umzüge"]},
            {"name": "Mercedes C 200", "img": "mb2", "cat": "Limousine", "kind": "sedan", "price": None,
             "specs": ["5 Sitze", "Automatik", "Business & Alltag"]},
            {"name": "BMW 530e", "img": "bmw1", "cat": "Premium Hybrid", "kind": "sedan", "price": None,
             "specs": ["5 Sitze", "Plug-in-Hybrid", "Hochzeit, Business, Wochenende"]},
        ],
        "usps": [
            ("clock", "Auch sonntags", "Mo–Fr 7:30–21 Uhr, Sa bis 22 Uhr, So ab 9 Uhr. Wenn andere zu haben, sind wir da."),
            ("wa", "WhatsApp statt Warteschleife", "Fahrzeug, Datum, fertig. Sie bekommen schnell eine klare Zusage – ohne Formular-Marathon."),
            ("box", "Umzugs-Paket gratis", "Spanngurte und Umzugsdecken liegen bereit. Sie müssen nichts extra kaufen."),
            ("euro", "Faire, klare Preise", "Sprinter ab 79 € am Tag inklusive 100 km. Jeder Zusatzkilometer 0,25 €. Keine Überraschungen."),
            ("route", "Abholservice", "Auf Wunsch bringen wir das Fahrzeug im Umkreis vorbei oder holen es wieder ab."),
            ("bolt", "Voll getankt", "Sie übernehmen das Fahrzeug mit vollem Tank und starten direkt durch."),
        ],
        "steps": [("Anfragen", "Fahrzeug und Zeitraum per WhatsApp, Telefon oder Formular senden."),
                  ("Bestätigung", "Wir prüfen die Verfügbarkeit und bestätigen Ihnen den Preis."),
                  ("Abholen", "In der Allersberger Straße 64 – oder wir bringen das Fahrzeug zu Ihnen.")],
        "rating": None,
        "faq": [
            ("Welchen Führerschein brauche ich für den Sprinter?", "Für Transporter bis 3,5 t reicht der normale Pkw-Führerschein der Klasse B."),
            ("Was kostet ein Transporter für ein paar Stunden?", "Montag bis Freitag gibt es den 3-Stunden-Tarif ab 60 €. Ideal für den schnellen Möbelkauf."),
            ("Wie hoch ist die Kaution?", "Für den Sprinter beträgt die Kaution 100 €. Sie bekommen sie bei ordnungsgemäßer Rückgabe zurück."),
            ("Kann ich am Wochenende mieten?", "Ja. Wir haben samstags bis 22 Uhr und sonntags ab 9 Uhr geöffnet. Der Wochenendtarif für den Sprinter liegt bei 99 € pro Tag inklusive 100 km."),
        ],
        "pitch": {"status": "Website vorhanden (maprent.de), aber Tippfehler, doppelte Fahrzeuge, zwei verschiedene WhatsApp-Nummern und ein toter Bewertungs-Link.",
                  "angle": "Lange Öffnungszeiten und Sonntagsbetrieb gehen auf der aktuellen Seite unter. Neue Seite stellt genau das in den Vordergrund und führt jeden Besucher direkt in den WhatsApp-Chat."},
    },
    {
        "slug": "loesch-autovermietung-nuernberg", "hero_img": "nue1",
        "name": "Lösch Autovermietung",
        "legal": "Lösch Autovermietung GmbH",
        "city": "Nürnberg",
        "district": "Mögeldorf",
        "street": "Laufamholzstraße 118",
        "zip": "90482",
        "phone": "0911 547054",
        "mobile": None,
        "mail": "info@loesch-autovermietung.de",
        "hours": [("Mo – Fr", "07:00 – 18:00"), ("Samstag", "08:00 – 13:00"), ("Sonntag", "09:00 – 10:00 nach Absprache")],
        "theme": {"bg": "#f6f1e7", "surface": "#fffdf8", "surface2": "#efe7d6", "text": "#1d2a22",
                  "muted": "#5f6b62", "primary": "#1f4d36", "on_primary": "#fffdf8", "line": "#e0d6c2",
                  "dark": False, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Iowan Old Style', 'Palatino Linotype', Palatino, Georgia, serif",
                  "headweight": 700, "upper": False, "radius": "14px", "accent": "#b8862b"},
        "logo_mark": "L",
        "eyebrow": "Familienunternehmen · Mobil seit 1932",
        "h1": "Seit 1932 in Mögeldorf.<br>Bereit für Ihre nächste Fahrt.",
        "lead": "Vom Kleinwagen bis zum 7,5-Tonner, vom 9-Sitzer bis zum Autotransport-Anhänger: Bei uns mieten Sie bei Menschen, die Ihr Fahrzeug selbst warten – in der eigenen Werkstatt.",
        "trust": [("star", "4,8 ★ bei 147 Google-Bewertungen"), ("heart", "Familienbetrieb seit 1932"), ("wrench", "Eigene Werkstatt")],
        "stats": [("1932", "gegründet"), ("4,8 ★", "147 Google-Bewertungen"), ("ab 29 €", "Anhänger pro Tag"), ("500 km", "im Wochenendtarif")],
        "hero_vehicle": "van",
        "hero_color": "#1f4d36",
        "fleet": [
            {"name": "Pkw", "cat": "Kompakt bis Mittelklasse", "img": "sm2", "kind": "sedan", "price": 70, "specs": ["5 Sitze", "Alltag, Reise, Ersatzwagen"]},
            {"name": "Transporter", "cat": "Sprinter, Crafter & Co.", "img": "van1", "kind": "transporter", "price": 64, "specs": ["Führerschein B", "Umzug & Gewerbe"]},
            {"name": "Vans & Kleinbusse", "img": "van9", "cat": "7- bis 9-Sitzer", "kind": "van", "price": 114, "specs": ["bis 9 Sitze", "Verein, Familie, Ausflug"]},
            {"name": "Lkw", "cat": "3,5 t bis 7,5 t", "img": "trk1", "kind": "truck", "price": 94, "specs": ["Koffer & Plane", "mit Hebebühne"]},
            {"name": "Anhänger", "cat": "Plane & Autotransport", "img": "tr1", "kind": "trailer", "price": 29, "specs": ["Planenanhänger", "Autotransporter"]},
        ],
        "usps": [
            ("heart", "Familie statt Konzern", "Seit 1932 in Nürnberg-Mögeldorf. Sie sprechen mit Menschen, die den Betrieb führen – nicht mit einer Hotline."),
            ("wrench", "Gewartet in der eigenen Werkstatt", "Jedes Fahrzeug wird bei uns im Haus geprüft. Das merken Sie auf jedem Kilometer."),
            ("calendar", "Wochenendtarif ab 89 €", "Freitag 17 Uhr bis Montag 7 Uhr, inklusive 500 km. Online buchbar."),
            ("truck", "Alles aus einer Hand", "Pkw, 9-Sitzer, Transporter, Lkw bis 7,5 t und Anhänger – eine Adresse für jedes Vorhaben."),
            ("briefcase", "Stark für Gewerbekunden", "Feste Ansprechpartner, Wochen- und Langzeittarife, Fuhrpark-Ergänzung für Ihren Betrieb."),
            ("sparkle", "Waschstraße & Reifenservice", "Vermietung, Autoservice, Pflege, Reifen und Autohandel – alles am selben Standort."),
        ],
        "steps": [("Fahrzeug wählen", "Klasse und Zeitraum auswählen – online, per Telefon oder E-Mail."),
                  ("Bestätigung erhalten", "Wir reservieren Ihr Fahrzeug und senden Ihnen alle Details."),
                  ("In Mögeldorf abholen", "Laufamholzstraße 118 – kurze Einweisung, Schlüssel, los geht’s.")],
        "rating": (4.8, 147),
        "faq": [
            ("Was ist im Wochenendtarif enthalten?", "Sie fahren von Freitag 17:00 Uhr bis Montag 07:00 Uhr ab 89 €, inklusive 500 Kilometern."),
            ("Brauche ich für den 7,5-Tonner einen besonderen Führerschein?", "Ja. Für Lkw über 3,5 t benötigen Sie die Klasse C1. Transporter bis 3,5 t fahren Sie mit Klasse B."),
            ("Gibt es günstigere Preise bei längerer Miete?", "Ja. Ab dem 7. Tag gilt ein günstigerer Tagespreis. Gewerbekunden erhalten individuelle Konditionen."),
            ("Kann ich auch stundenweise mieten?", "Ein 4-Stunden- und ein Nachttarif sind auf Anfrage möglich. Rufen Sie uns einfach an."),
        ],
        "pitch": {"status": "Moderne Website, aber noch im Umbau: Bereiche mit „Inhalte werden gerade aufgebaut“, Pop-up beim Gewerbekunden-Bereich, teils veraltete Links.",
                  "angle": "Über 90 Jahre Familiengeschichte + eigene Werkstatt sind ein Vertrauensvorsprung, den kein Konzern hat. Neue Seite ist fertig statt „im Aufbau“."},
    },
    {
        "slug": "es-autovermietung-nuernberg", "hero_img": "van8",
        "name": "ES Autovermietung",
        "legal": "ES Europa-Service Autovermietung",
        "city": "Nürnberg",
        "district": "Eberhardshof",
        "street": "Fuggerstraße 15",
        "zip": "90439",
        "phone": "0911 61068-0",
        "mobile": None,
        "mail": "info@es-vermietung.de",
        "hours": [("Mo – Fr", "nach Vereinbarung*"), ("Samstag", "nach Vereinbarung*")],
        "theme": {"bg": "#f4f6fa", "surface": "#ffffff", "surface2": "#e9eef6", "text": "#0d1b33",
                  "muted": "#56637a", "primary": "#0b3a82", "on_primary": "#fff", "line": "#dbe2ee",
                  "dark": False, "font": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "head": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "headweight": 800, "upper": False, "radius": "10px", "accent": "#d7263d"},
        "logo_mark": "ES",
        "eyebrow": "Nürnbergs älteste Autovermietung · seit 1958",
        "h1": "Persönlich vermietet.<br>Seit 1958.",
        "lead": "Pkw, 9-Sitzer und Transporter in jeder Größe – kurzfristig verfügbar, flexibel in der Mietdauer und mit einem echten Ansprechpartner statt Callcenter.",
        "trust": [("star", "4,8 ★ bei 121 Google-Bewertungen"), ("users", "Persönlicher Ansprechpartner"), ("shield", "Hilfe beim Unfallersatz")],
        "stats": [("1958", "gegründet in Nürnberg"), ("4,8 ★", "121 Google-Bewertungen"), ("9", "Sitze im Kleinbus"), ("−10 %", "auf Ihre erste Miete")],
        "hero_vehicle": "van",
        "hero_color": "#0b3a82",
        "fleet": [
            {"name": "Pkw", "cat": "Alltag & Reise", "img": "sm1", "kind": "sedan", "price": None, "specs": ["5 Sitze", "kurzfristig verfügbar"]},
            {"name": "Kleinbus", "cat": "bis 9 Sitze", "img": "van9", "kind": "van", "price": None, "specs": ["Gruppen & Vereine", "Urlaub & Ausflug"]},
            {"name": "Transporter", "cat": "mehrere Größen", "img": "van2", "kind": "transporter", "price": None, "specs": ["Führerschein B", "Umzug & Gewerbe"]},
            {"name": "Unfallersatzwagen", "img": "suv2", "cat": "Service", "kind": "suv", "price": None, "specs": ["Abwicklung mit Versicherung", "schnell mobil"]},
        ],
        "usps": [
            ("users", "Ansprechpartner mit Namen", "Kein Callcenter, keine Warteschleife. Sie rufen an – wir kennen Ihr Anliegen."),
            ("bolt", "Kurzfristig verfügbar", "Heute anrufen, heute fahren. Hohe Verfügbarkeit und flexible Mietzeiträume."),
            ("shield", "Unfallersatz ohne Stress", "Wir unterstützen Sie bei der Abwicklung mit der Versicherung und halten Sie mobil."),
            ("briefcase", "Partner für Unternehmen", "Firmenkunden, Handwerk und Fuhrparks vertrauen seit Jahrzehnten auf uns."),
            ("users", "Für Gruppen & Umzüge", "9-Sitzer für Vereine und Familien, Transporter in mehreren Größen für jedes Umzugsvolumen."),
            ("euro", "10 % auf die Erstmiete", "Mit dem Code WILLKOMMEN10 sparen Sie bei Ihrer ersten Anmietung."),
        ],
        "steps": [("Anfrage stellen", "Online, per Telefon oder E-Mail – mit Wunschfahrzeug und Zeitraum."),
                  ("Persönliches Angebot", "Ihr Ansprechpartner meldet sich mit Verfügbarkeit und Preis."),
                  ("Abholen in der Fuggerstraße", "Fahrzeug übernehmen und losfahren.")],
        "rating": (4.8, 121),
        "faq": [
            ("Seit wann gibt es ES Autovermietung?", "Seit 1958. Angefangen in der Fürther Straße, heute mit modernem Fuhrpark und digitaler Buchung in der Fuggerstraße 15."),
            ("Helfen Sie bei einem Unfallersatzwagen?", "Ja. Wir stellen Ihnen ein Ersatzfahrzeug und unterstützen bei der Abwicklung mit der Versicherung."),
            ("Gibt es einen Rabatt für Neukunden?", "Ja. Mit dem Code WILLKOMMEN10 erhalten Sie 10 % auf Ihre erste Miete."),
            ("Vermieten Sie auch an Firmen?", "Ja, Geschäftskunden sind ein Schwerpunkt. Sprechen Sie uns auf Rahmenkonditionen an."),
        ],
        "pitch": {"status": "Solide, moderne Website. Schwächen: keine Preise, keine Öffnungszeiten, E-Mail-Domain weicht von der Website-Domain ab.",
                  "angle": "Fokus auf Firmenkunden & Unfallersatz mit eigener Landingpage + Anfrageformular, das echte Leads erzeugt. Eher Upgrade/Relaunch-Angebot als Neubau."},
    },
    {
        "slug": "myonecar-nuernberg", "hero_img": "sm5",
        "name": "myonecar",
        "legal": "myonecar Autovermietung",
        "city": "Nürnberg",
        "district": "Dutzendteich",
        "street": "Zeppelinstraße (Nähe Dutzendteich)",
        "zip": "",
        "phone": "0162 7517520",
        "mobile": "0162 7517520",
        "mail": "info@myonecar.de",
        "hours": [("Täglich", "08:00 – 20:00 (Service)"), ("Abholung", "24/7 kontaktlos")],
        "theme": {"bg": "#fbfbfe", "surface": "#ffffff", "surface2": "#f0eefc", "text": "#15122b",
                  "muted": "#5d5a75", "primary": "#5b3df5", "on_primary": "#fff", "line": "#e4e1f5",
                  "dark": False, "font": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Avenir Next', 'Segoe UI', system-ui, sans-serif",
                  "headweight": 800, "upper": False, "radius": "22px", "accent": "#c6f432"},
        "logo_mark": "1",
        "eyebrow": "ein auto. ein preis. einfach.",
        "h1": "Ohne Kaution.<br>Ohne Schalter.<br>Rund um die Uhr.",
        "lead": "Online buchen, Code aufs Handy, Schlüssel aus der Keybox – fertig. 250 Freikilometer pro Tag und kein Aufpreis für junge Fahrer oder Zusatzfahrer.",
        "trust": [("star", "4,9 ★ bei 150 Google-Bewertungen"), ("key", "24/7 kontaktlose Abholung"), ("euro", "0 € Kaution*")],
        "stats": [("0 €", "Kaution*"), ("24/7", "Abholung & Rückgabe"), ("250 km", "frei pro Tag"), ("4,9 ★", "150 Google-Bewertungen")],
        "hero_vehicle": "sedan",
        "hero_color": "#5b3df5",
        "fleet": [
            {"name": "Dacia Sandero", "img": "sm4", "cat": "Kleinwagen", "kind": "sedan", "price": 60, "specs": ["5 Sitze", "250 km/Tag frei", "ideal für die Stadt"]},
            {"name": "MG3", "img": "sm1", "cat": "Kleinwagen Automatik", "kind": "sedan", "price": 65, "specs": ["5 Sitze", "Automatik", "250 km/Tag frei"]},
            {"name": "Dacia Dokker", "img": "van2", "cat": "Hochdach-Kombi", "kind": "van", "price": 60, "specs": ["viel Laderaum", "Ikea-tauglich", "250 km/Tag frei"]},
        ],
        "usps": [
            ("euro", "Keine Kaution", "Mit Wohnsitz in Deutschland zahlen Sie nur den Mietpreis vorab. Kein geblockter Betrag auf der Kreditkarte."),
            ("key", "Abholen, wann Sie wollen", "Keybox mit Zugangscode – auch nachts um drei oder am Sonntagmorgen."),
            ("users", "Kein Aufpreis für junge Fahrer", "Zusatzfahrer und junge Fahrer kosten bei uns nichts extra."),
            ("route", "250 km pro Tag inklusive", "Genug für den Wochenendtrip nach Bamberg, Regensburg oder an den Brombachsee."),
            ("shield", "Vollkasko inklusive", "Selbstbeteiligung 1.000 €, auf Wunsch reduzierbar auf 500 €."),
            ("check", "Ein fester Preis", "Keine Rabattschlacht, keine Saisonaufschläge. Sie sehen den Preis – und zahlen genau den."),
        ],
        "steps": [("Online buchen", "Auto und Zeitraum wählen, Mietpreis vorab bezahlen."),
                  ("Code erhalten", "Sie bekommen den Zugangscode für die Keybox aufs Handy."),
                  ("Einsteigen & losfahren", "Schlüssel nehmen, Auto steht in der Zeppelinstraße bereit.")],
        "rating": (4.9, 150),
        "faq": [
            ("Brauche ich eine Kreditkarte?", "Nein. Sie zahlen den Mietpreis vorab, eine Kaution entfällt bei Wohnsitz in Deutschland."),
            ("Wie funktioniert die Schlüsselübergabe?", "Kontaktlos über eine Keybox. Nach der Buchung erhalten Sie den Zugangscode."),
            ("Wie viele Kilometer sind inklusive?", "250 Kilometer pro Miettag sind frei."),
            ("Wie bin ich versichert?", "Vollkasko mit 1.000 € Selbstbeteiligung, auf Wunsch reduzierbar auf 500 €."),
        ],
        "pitch": {"status": "Website vorhanden, aber BUCHEN-Buttons auf der Nürnberg-Seite führen nach Bayreuth, doppelte Überschriften/Footer, widersprüchliche Preise (49 € vs. 60 €) und Öffnungszeiten.",
                  "angle": "Konzept ist stark (keine Kaution, 24/7). Der Bayreuth-Link kostet jeden Tag Buchungen – das ist das Verkaufsargument Nr. 1."},
    },
    {
        "slug": "tesla-car-rent-erlangen", "hero_img": "tes3",
        "name": "Tesla Car Rent Erlangen",
        "legal": "Tesla Car Rent · Klaus Fischer",
        "city": "Erlangen",
        "district": "Innenstadt",
        "street": "Hindenburgstraße 68",
        "zip": "91054",
        "phone": "09131 29225",
        "mobile": "0152 23637945",
        "mail": None,
        "hours": [("Täglich", "nach Vereinbarung"), ("Kurzfristig", "telefonisch oder per WhatsApp")],
        "theme": {"bg": "#ffffff", "surface": "#f6f7f9", "surface2": "#eceef2", "text": "#111317",
                  "muted": "#5c6270", "primary": "#111317", "on_primary": "#fff", "line": "#e3e6eb",
                  "dark": False, "font": "'Helvetica Neue', 'Segoe UI', system-ui, sans-serif",
                  "head": "'Helvetica Neue', 'Segoe UI', system-ui, sans-serif",
                  "headweight": 600, "upper": False, "radius": "4px", "accent": "#2f6bff"},
        "logo_mark": "⚡",
        "eyebrow": "Elektrisch mieten in Erlangen",
        "h1": "Tesla fahren.<br>Ab heute.",
        "lead": "Das Model 3 einfach mal einen Tag, ein Wochenende oder eine Woche fahren. Mit persönlicher Übergabe und Einweisung mitten in Erlangen – auch kurzfristig.",
        "trust": [("star", "4,9 ★ bei 84 Trustpilot-Bewertungen"), ("users", "Persönliche Einweisung"), ("bolt", "100 % elektrisch")],
        "stats": [("4,9 ★", "84 Trustpilot-Bewertungen"), ("0 g", "CO₂ beim Fahren"), ("1:1", "persönliche Übergabe"), ("Innenstadt", "Hindenburgstraße")],
        "hero_vehicle": "ev",
        "hero_color": "#22262d",
        "fleet": [
            {"name": "Tesla Model 3", "img": "tes2", "cat": "Elektro-Limousine", "kind": "ev", "price": None,
             "specs": ["5 Sitze", "Autopilot-Assistenz", "Supercharger-fähig", "Glasdach"]},
        ],
        "usps": [
            ("users", "Persönliche Übergabe", "Keine Keybox, kein Schalter: Herr Fischer übergibt Ihnen das Auto persönlich und erklärt alles in Ruhe."),
            ("bolt", "Kurzfristig buchbar", "Heute anrufen, morgen Tesla fahren. Unsere Kunden loben genau das."),
            ("leaf", "Elektrisch & leise", "Probefahren ohne Verkaufsdruck: Erleben Sie, ob ein E-Auto zu Ihrem Alltag passt."),
            ("heart", "Für besondere Anlässe", "Hochzeit, Jubiläum, Geschäftstermin oder einfach ein Wochenende ins Fränkische Seenland."),
            ("route", "Laden leicht gemacht", "Sie bekommen eine Einweisung in Laden, Reichweite und Supercharger-Planung."),
            ("star", "Ausgezeichnet bewertet", "4,9 von 5 Sternen bei 84 Bewertungen auf Trustpilot."),
        ],
        "steps": [("Anrufen oder schreiben", "Wunschtermin per Telefon oder WhatsApp nennen."),
                  ("Termin bestätigen", "Wir bestätigen Zeitraum und Preis."),
                  ("Übergabe in Erlangen", "Hindenburgstraße 68 – Einweisung, Schlüsselkarte, losfahren.")],
        "rating": (4.9, 84),
        "rating_src": "Trustpilot",
        "faq": [
            ("Ich bin noch nie elektrisch gefahren. Ist das ein Problem?", "Überhaupt nicht. Sie erhalten bei der Übergabe eine persönliche Einweisung in Bedienung, Laden und Reichweite."),
            ("Wie lade ich unterwegs?", "Am Tesla Supercharger oder an öffentlichen Ladesäulen. Wir zeigen Ihnen, wie Sie Ihre Route planen."),
            ("Kann ich kurzfristig mieten?", "Ja. Rufen Sie einfach an – oft klappt es schon am nächsten Tag."),
            ("Eignet sich das Model 3 als Geschenk?", "Ja, ein Tesla-Wochenende ist ein beliebtes Geschenk. Fragen Sie nach einem Gutschein."),
        ],
        "pitch": {"status": "Keine eigene Website gefunden – nur Branchenbuch-Einträge und ein Trustpilot-Profil mit 4,9 ★ (84 Bewertungen).",
                  "angle": "Super Bewertungen, aber kein eigenes Schaufenster. Wer „Tesla mieten Erlangen“ googelt, landet bei Portalen. Neue Seite + Google-Profil = direkte Buchungen ohne Provision."},
    },
    {
        "slug": "geomobil-graupner-erlangen", "hero_img": "suv2",
        "name": "Geomobil Graupner",
        "legal": "Autovermietung Geomobil Graupner",
        "city": "Erlangen",
        "district": "Bruck",
        "street": "Äußere Tennenloher Straße 13",
        "zip": "91058",
        "phone": "09131 69564-0",
        "mobile": None,
        "mail": None,
        "hours": [("Mo – Fr", "Ihre Öffnungszeiten*"), ("Samstag", "Ihre Öffnungszeiten*")],
        "theme": {"bg": "#f7f5f2", "surface": "#ffffff", "surface2": "#efe9e2", "text": "#1e2328",
                  "muted": "#5f6670", "primary": "#e8590c", "on_primary": "#fff", "line": "#e5ded5",
                  "dark": False, "font": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "head": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "headweight": 800, "upper": False, "radius": "12px", "accent": "#263238"},
        "logo_mark": "G",
        "eyebrow": "Ihre Autovermietung in Erlangen-Bruck",
        "h1": "Mieten beim Nachbarn.<br>Nicht beim Konzern.",
        "lead": "Pkw und Transporter direkt in Erlangen-Bruck – mit persönlicher Beratung, fairen Preisen und kurzen Wegen zu Siemens, Uni-Klinikum und A73.",
        "trust": [("pin", "Erlangen-Bruck, nahe A73"), ("users", "Persönliche Beratung"), ("phone", "Ein Anruf genügt")],
        "stats": [("Bruck", "Äußere Tennenloher Str."), ("A73", "in wenigen Minuten"), ("1", "fester Ansprechpartner"), ("0", "Callcenter")],
        "hero_vehicle": "suv",
        "hero_color": "#e8590c",
        "fleet": [
            {"name": "Kleinwagen", "cat": "Stadt & Alltag", "img": "sm4", "kind": "sedan", "price": None, "specs": ["5 Sitze", "sparsam"]},
            {"name": "Kombi & SUV", "img": "suv2", "cat": "Reise & Familie", "kind": "suv", "price": None, "specs": ["5 Sitze", "großer Kofferraum"]},
            {"name": "Transporter", "cat": "Umzug & Gewerbe", "img": "van1", "kind": "transporter", "price": None, "specs": ["Führerschein B", "bis 3,5 t"]},
        ],
        "usps": [
            ("users", "Persönlich statt anonym", "Feste Ansprechpartner vor Ort. Kurze Wege, schnelle Entscheidungen."),
            ("pin", "Perfekte Lage", "Erlangen-Bruck, wenige Minuten zur A73, zum Bahnhof Bruck und zu den Siemens-Standorten."),
            ("briefcase", "Für Firmen in Erlangen", "Ersatzfahrzeuge, Projektfahrzeuge und Monatsmiete für Betriebe in der Region."),
            ("truck", "Transporter für Umzüge", "Für den Umzug innerhalb Erlangens oder ins Studentenwohnheim."),
            ("shield", "Gepflegte Fahrzeuge", "Regelmäßig gewartet, sauber übergeben."),
            ("euro", "Faire Konditionen", "Transparente Preise ohne versteckte Gebühren."),
        ],
        "steps": [("Anrufen oder anfragen", "Wunschfahrzeug und Zeitraum nennen."),
                  ("Angebot erhalten", "Wir melden uns mit Verfügbarkeit und Preis."),
                  ("In Bruck abholen", "Äußere Tennenloher Straße 13 – und losfahren.")],
        "rating": None,
        "faq": [
            ("Wo finde ich Sie?", "In der Äußeren Tennenloher Straße 13 in 91058 Erlangen-Bruck, wenige Minuten von der A73."),
            ("Kann ich auch für meine Firma mieten?", "Ja. Wir bieten Ersatz- und Projektfahrzeuge sowie Monatsmieten für Betriebe an."),
            ("Welchen Führerschein brauche ich für den Transporter?", "Für Transporter bis 3,5 t genügt die Klasse B."),
        ],
        "pitch": {"status": "Keine Website gefunden – nur Telefonbuch-Einträge (Das Örtliche, Das Telefonbuch). Online praktisch unsichtbar.",
                  "angle": "Größter Hebel von allen: Erste eigene Website + Google-Unternehmensprofil. Die Vorschau zeigt, wie es aussehen könnte; Fahrzeuge, Preise und Öffnungszeiten werden beim Termin ergänzt."},
    },
    {
        "slug": "ms-car-erlangen", "hero_img": "van1",
        "name": "MS Car Autovermietung",
        "legal": "MS Car Autovermietung",
        "city": "Erlangen",
        "district": "Alterlangen",
        "street": "Möhrendorfer Straße 51",
        "zip": "91056",
        "phone": "09131 9119992",
        "mobile": None,
        "mail": None,
        "hours": [("Mo – Fr", "Ihre Öffnungszeiten*"), ("Samstag", "Ihre Öffnungszeiten*")],
        "theme": {"bg": "#0b1f2a", "surface": "#112b38", "surface2": "#163747", "text": "#eef7f8",
                  "muted": "#9db6bf", "primary": "#2ec4b6", "on_primary": "#062027", "line": "#1f4352",
                  "dark": True, "font": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "head": "'Segoe UI', 'Helvetica Neue', system-ui, sans-serif",
                  "headweight": 800, "upper": False, "radius": "12px", "accent": "#ffbf47"},
        "logo_mark": "MS",
        "eyebrow": "Transporter mieten in Erlangen",
        "h1": "Transporter ohne Kaution.<br>Tageweise oder langfristig.",
        "lead": "Für den Umzug am Samstag oder das Projekt über drei Monate: Transporter direkt in Erlangen-Alterlangen – ohne Kaution, mit klaren Preisen.",
        "trust": [("euro", "Ohne Kaution"), ("calendar", "Tages- & Langzeitmiete"), ("pin", "Erlangen-Alterlangen")],
        "stats": [("0 €", "Kaution"), ("1 Tag", "bis mehrere Monate"), ("Klasse B", "reicht bis 3,5 t"), ("Erlangen", "Möhrendorfer Str.")],
        "hero_vehicle": "transporter",
        "hero_color": "#2ec4b6",
        "fleet": [
            {"name": "Transporter", "cat": "Tagesmiete", "img": "van1", "kind": "transporter", "price": None, "specs": ["Führerschein B", "Umzug & Möbel", "ohne Kaution"]},
            {"name": "Transporter", "cat": "Langzeitmiete", "img": "van8", "kind": "transporter", "price": None, "specs": ["Wochen & Monate", "Handwerk & Gewerbe", "fester Monatspreis"]},
            {"name": "Kastenwagen", "img": "van2", "cat": "kompakt", "kind": "van", "price": None, "specs": ["passt in jede Tiefgarage", "Lieferfahrten"]},
        ],
        "usps": [
            ("euro", "Keine Kaution", "Kein geblockter Betrag, keine Kreditkarte nötig. Sie zahlen nur die Miete."),
            ("calendar", "Langzeitmiete für Betriebe", "Transporter für Wochen oder Monate – planbar, ohne Leasingvertrag."),
            ("truck", "Umzug leicht gemacht", "Vom WG-Zimmer bis zur 3-Zimmer-Wohnung: das passende Ladevolumen."),
            ("pin", "Mitten in Erlangen", "Möhrendorfer Straße 51 – schnell erreichbar aus Innenstadt, Büchenbach und Möhrendorf."),
            ("users", "Persönlicher Service", "Direkter Kontakt, kurze Wege, schnelle Zusage."),
            ("shield", "Gepflegt & geprüft", "Regelmäßig gewartete Fahrzeuge, saubere Übergabe."),
        ],
        "steps": [("Anfragen", "Telefon oder Formular – Zeitraum und Einsatzzweck nennen."),
                  ("Zusage erhalten", "Wir bestätigen Fahrzeug und Preis."),
                  ("Abholen", "Möhrendorfer Straße 51 – einladen, losfahren.")],
        "rating": None,
        "faq": [
            ("Muss ich eine Kaution hinterlegen?", "Nein. Bei uns mieten Sie Transporter ohne Kaution."),
            ("Kann ich einen Transporter für mehrere Monate mieten?", "Ja. Neben der Tagesmiete bieten wir Langzeitmiete für Betriebe und Projekte an."),
            ("Welchen Führerschein brauche ich?", "Für Transporter bis 3,5 t genügt der Pkw-Führerschein Klasse B."),
        ],
        "pitch": {"status": "Website ms-car-autovermietung.de war beim Test nicht erreichbar (HTTP 503). Im Branchenbuch kaum präsent.",
                  "angle": "„Ihre Website ist gerade offline – jeder Besucher geht zur Konkurrenz.“ Dringlichkeit ist hier das stärkste Argument."},
    },
]


# --------------------------------------------------------------------------
# HTML
# --------------------------------------------------------------------------
CSS = """
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;-webkit-text-size-adjust:100%}
body{margin:0;font-family:var(--font);background:var(--bg);color:var(--text);line-height:1.6;font-size:17px}
img,svg{display:block;max-width:100%}
a{color:inherit}
.wrap{width:min(1160px,100% - 32px);margin-inline:auto}
h1,h2,h3{font-family:var(--head);font-weight:var(--hw);line-height:1.08;margin:0;letter-spacing:-.02em;text-transform:var(--upper)}
h1{font-size:clamp(2.3rem,5.6vw,4.4rem)}
h2{font-size:clamp(1.8rem,3.6vw,2.8rem)}
h3{font-size:1.2rem;letter-spacing:-.01em}
p{margin:0}
.ico{width:22px;height:22px;flex:none}
.muted{color:var(--muted)}
.eyebrow{display:inline-flex;align-items:center;gap:8px;font-size:.82rem;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--primary-text)}
.eyebrow::before{content:"";width:22px;height:2px;background:currentColor}

/* Vorschau-Leiste */
.pv{background:#111;color:#fff;font-size:.88rem;position:relative;z-index:60}
.pv .wrap{display:flex;gap:12px;align-items:center;justify-content:space-between;padding:9px 0;flex-wrap:wrap}
.pv b{color:#ffd166}
.pv a.pvbtn{background:#ffd166;color:#111;text-decoration:none;font-weight:700;padding:6px 12px;border-radius:999px;white-space:nowrap}
.pv button{background:none;border:0;color:#fff;cursor:pointer;padding:4px;display:inline-flex}

/* Header */
.hd{position:sticky;top:0;z-index:50;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.hd .wrap{display:flex;align-items:center;justify-content:space-between;height:70px;gap:16px}
.brand{display:flex;align-items:center;gap:10px;text-decoration:none;font-family:var(--head);font-weight:var(--hw);font-size:1.15rem;letter-spacing:-.01em;text-transform:var(--upper)}
.mark{width:40px;height:40px;border-radius:calc(var(--r) * .8);background:var(--primary);color:var(--onp);display:grid;place-items:center;font-size:.95rem;font-weight:800;letter-spacing:-.03em}
.brand small{display:block;font-family:var(--font);font-weight:500;font-size:.72rem;color:var(--muted);letter-spacing:.02em;text-transform:none}
.nav{display:flex;gap:26px;font-size:.95rem}
.nav a{text-decoration:none;color:var(--muted);font-weight:500}
.nav a:hover{color:var(--text)}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:9px;border-radius:var(--r);padding:14px 22px;font-weight:700;font-size:1rem;text-decoration:none;border:2px solid transparent;cursor:pointer;font-family:inherit;transition:transform .15s,box-shadow .15s,background .15s}
.btn:hover{transform:translateY(-1px)}
.btn-p{background:var(--primary);color:var(--onp);box-shadow:0 10px 26px -12px var(--primary)}
.btn-o{border-color:var(--line);color:var(--text);background:var(--surface)}
.btn-wa{background:#1fa855;color:#fff}
.btn-sm{padding:10px 16px;font-size:.92rem}

/* Hero */
.hero{position:relative;overflow:hidden;padding:48px 0 56px}
.hero::before{content:"";position:absolute;inset:auto -10% -40% 35%;height:110%;background:radial-gradient(closest-side,color-mix(in srgb,var(--primary) 22%,transparent),transparent);pointer-events:none}
.hero .wrap{display:grid;grid-template-columns:1.1fr .9fr;gap:48px;align-items:center;position:relative}
.hero h1{margin:18px 0 20px}
.hero .lead{font-size:1.14rem;color:var(--muted);max-width:56ch}
.cta{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px}
.trust{display:flex;flex-wrap:wrap;gap:10px 22px;margin-top:30px;padding:0;list-style:none;font-size:.93rem;font-weight:600}
.trust li{display:flex;align-items:center;gap:8px}
.trust .ico{color:var(--primary-text)}
.stage{position:relative;border-radius:calc(var(--r) * 1.6);overflow:hidden;aspect-ratio:16/10;box-shadow:0 30px 60px -30px rgba(0,0,0,.5);background:var(--surface2)}
.stage img{width:100%;height:100%;object-fit:cover}
.badge{position:absolute;left:16px;bottom:44px;display:flex;align-items:center;gap:8px;background:var(--surface);color:var(--text);padding:10px 14px;border-radius:999px;font-size:.88rem;font-weight:700;box-shadow:0 10px 30px -10px rgba(0,0,0,.4)}
.badge .ico{color:var(--primary-text);width:18px;height:18px}
.stage .car{width:100%;filter:drop-shadow(0 30px 30px rgba(0,0,0,.18))}
.plate{position:absolute;left:50%;top:-6%;transform:translateX(-50%);width:84%;aspect-ratio:1;border-radius:50%;background:color-mix(in srgb,var(--primary) 14%,var(--surface2));z-index:-1}

/* Buchungskarte */
.book{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r) * 1.4);padding:24px;box-shadow:0 30px 60px -30px rgba(0,0,0,.35);margin-top:-30px;position:relative}
.book h3{margin-bottom:4px}
.book .row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
.book label{display:block;font-size:.78rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px}
.book input,.book select{width:100%;font:inherit;font-size:1rem;color:var(--text);background:var(--bg);border:1.5px solid var(--line);border-radius:calc(var(--r) * .7);padding:12px 12px;min-height:48px}
.book input:focus,.book select:focus{outline:2px solid var(--primary);outline-offset:1px}
.est{display:flex;justify-content:space-between;align-items:baseline;margin:18px 0 14px;padding:14px 16px;border-radius:calc(var(--r) * .7);background:var(--surface2);font-size:.95rem}
.est strong{font-size:1.4rem;font-family:var(--head)}
.book .btn{width:100%}
.ok{display:none;text-align:center;padding:10px 0}
.ok .tick{width:58px;height:58px;border-radius:50%;background:#1fa855;color:#fff;display:grid;place-items:center;margin:0 auto 12px}
.ok .tick .ico{width:30px;height:30px}
.ok p{color:var(--muted);font-size:.95rem;margin:8px 0 16px}
.book.sent form{display:none}.book.sent .ok{display:block}

/* Stats */
.stats{border-block:1px solid var(--line);background:var(--surface)}
.stats .wrap{display:grid;grid-template-columns:repeat(4,1fr)}
.stat{padding:26px 18px;border-left:1px solid var(--line)}
.stat:first-child{border-left:0}
.stat b{display:block;font-family:var(--head);font-size:1.8rem;font-weight:var(--hw);letter-spacing:-.02em;color:var(--primary-text)}
.stat span{font-size:.9rem;color:var(--muted)}

/* Sections */
section{padding:64px 0}
.sh{display:flex;justify-content:space-between;align-items:end;gap:16px 24px;margin-bottom:28px;flex-wrap:wrap}
.sh p{max-width:46ch;color:var(--muted)}
.sh h2{margin-top:12px}
.grid{display:grid;gap:20px}
.fleet{grid-template-columns:repeat(auto-fill,minmax(250px,1fr))}
.vc{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r) * 1.4);padding:22px;display:flex;flex-direction:column;transition:transform .2s,box-shadow .2s}
.vc:hover{transform:translateY(-4px);box-shadow:0 24px 40px -28px rgba(0,0,0,.4)}
.vc .pic{position:relative;background:var(--surface2);border-radius:var(--r);overflow:hidden;aspect-ratio:16/10;margin-bottom:18px}
.vc .pic img{width:100%;height:100%;object-fit:cover;transition:transform .5s}
.vc:hover .pic img{transform:scale(1.05)}
img[src$="van2.webp"]{object-position:50% 82%}
.vc .pic svg{padding:22px 14px 12px}
.sym{position:absolute;right:8px;bottom:8px;font-size:.66rem;background:rgba(0,0,0,.55);color:#fff;padding:2px 7px;border-radius:999px}
.vc .cat{font-size:.78rem;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--primary-text)}
.vc h3{margin:4px 0 12px}
.vc ul{list-style:none;padding:0;margin:0 0 18px;display:flex;flex-wrap:wrap;gap:6px}
.vc li{font-size:.8rem;background:var(--surface2);border-radius:999px;padding:4px 10px;color:var(--muted)}
.vc .foot{margin-top:auto;display:flex;align-items:center;justify-content:space-between;gap:10px;border-top:1px solid var(--line);padding-top:16px}
.price small{display:block;font-size:.75rem;color:var(--muted)}
.price b{font-family:var(--head);font-size:1.5rem;font-weight:var(--hw)}
.price .ask{font-size:1.05rem}
.usps{grid-template-columns:repeat(3,1fr)}
.usp{padding:26px;border-radius:calc(var(--r) * 1.4);background:var(--surface);border:1px solid var(--line)}
.usp .ib{width:48px;height:48px;border-radius:var(--r);display:grid;place-items:center;background:color-mix(in srgb,var(--primary) 14%,transparent);color:var(--primary-text);margin-bottom:16px}
.usp h3{margin-bottom:8px}
.usp p{color:var(--muted);font-size:.97rem}
.alt{background:var(--surface2)}
.steps{grid-template-columns:repeat(3,1fr);counter-reset:s}
.step{position:relative;padding:28px;background:var(--surface);border-radius:calc(var(--r) * 1.4);border:1px solid var(--line)}
.step::before{counter-increment:s;content:counter(s);display:grid;place-items:center;width:44px;height:44px;border-radius:50%;background:var(--primary);color:var(--onp);font-weight:800;margin-bottom:16px;font-size:1.1rem}
.step p{color:var(--muted);margin-top:8px}
.rate{display:grid;grid-template-columns:auto 1fr;gap:40px;align-items:center;background:var(--primary);color:var(--onp);border-radius:calc(var(--r) * 2);padding:44px}
.rate .big{font-family:var(--head);font-size:clamp(3.4rem,8vw,5.6rem);font-weight:var(--hw);line-height:1;letter-spacing:-.04em}
.stars{display:flex;gap:4px;margin:10px 0 6px}
.stars .ico{width:24px;height:24px;fill:currentColor}
.rate p{opacity:.88;max-width:52ch}
.rate .btn{margin-top:18px;background:var(--onp);color:var(--primary)}
.faq{max-width:820px}
details{border-bottom:1px solid var(--line);padding:6px 0}
summary{cursor:pointer;list-style:none;padding:18px 40px 18px 0;font-weight:700;font-size:1.06rem;position:relative}
summary::-webkit-details-marker{display:none}
summary::after{content:"+";position:absolute;right:6px;top:12px;font-size:1.6rem;font-weight:400;color:var(--primary-text);transition:transform .2s}
details[open] summary::after{transform:rotate(45deg)}
details p{padding:0 0 20px;color:var(--muted)}
.contact{display:grid;grid-template-columns:1fr 1fr;gap:24px}
.card{background:var(--surface);border:1px solid var(--line);border-radius:calc(var(--r) * 1.4);padding:30px}
.cl{list-style:none;padding:0;margin:20px 0 0;display:grid;gap:16px}
.cl li{display:flex;gap:14px;align-items:flex-start}
.cl .ico{color:var(--primary-text);margin-top:3px}
.cl a{text-decoration:none;font-weight:600}
.hrs{width:100%;border-collapse:collapse;margin-top:16px}
.hrs td{padding:11px 0;border-bottom:1px solid var(--line)}
.hrs td+td{text-align:right;font-weight:600}
.mapbtn{display:flex;align-items:center;justify-content:center;gap:10px;margin-top:22px;height:150px;border-radius:var(--r);text-decoration:none;font-weight:700;background:
  repeating-linear-gradient(45deg,var(--surface2) 0 14px,color-mix(in srgb,var(--surface2) 70%,var(--bg)) 14px 28px);border:1px dashed var(--line)}
.mapbtn .ico{color:var(--primary-text)}
.ft{border-top:1px solid var(--line);padding:28px 0 96px;font-size:.88rem;color:var(--muted)}
.ft .wrap{display:flex;flex-wrap:wrap;gap:12px 28px;justify-content:space-between}
.ft a{text-decoration:none}
.note{font-size:.8rem;color:var(--muted);margin-top:26px}

/* Mobile-Leiste */
.mb{position:fixed;left:0;right:0;bottom:0;z-index:55;display:none;grid-template-columns:1fr 1fr 1.2fr;gap:8px;padding:10px 12px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);border-top:1px solid var(--line)}
.mb .btn{padding:12px 8px;font-size:.92rem}

/* Inhalte sind immer sichtbar – keine Einblend-Effekte, die in manchen Viewern leere Flächen erzeugen */
@media (prefers-reduced-motion:reduce){html{scroll-behavior:auto}}

@media (max-width:960px){
  .hero .wrap{grid-template-columns:1fr;gap:36px}
  .usps,.steps{grid-template-columns:1fr 1fr}
  .nav{display:none}
}
@media (max-width:680px){
  body{font-size:16px}
  .hero{padding:36px 0 48px}
  .stats .wrap{grid-template-columns:1fr 1fr}
  .stat:nth-child(3){border-left:0}
  .stat:nth-child(n+3){border-top:1px solid var(--line)}
  .usps,.steps,.contact{grid-template-columns:1fr}
  .rate{grid-template-columns:1fr;gap:16px;padding:30px}
  section{padding:44px 0}
  .sh{margin-bottom:20px}
  .hero .wrap{gap:24px}
  .book .row{grid-template-columns:1fr}
  .hd .hcta{display:none}
  .mb{display:grid}
  .pv .wrap{font-size:.8rem}
}
"""


def theme_vars(t):
    # Akzentfarbe für Texte/Icons: bei fast schwarzer Primärfarbe die Akzentfarbe nehmen
    primary_text = t["accent"] if t["primary"] == "#111317" else t["primary"]
    return (f':root{{--bg:{t["bg"]};--surface:{t["surface"]};--surface2:{t["surface2"]};--text:{t["text"]};'
            f'--muted:{t["muted"]};--primary:{t["primary"]};--onp:{t["on_primary"]};--line:{t["line"]};'
            f'--primary-text:{primary_text};--font:{t["font"]};--head:{t["head"]};--hw:{t["headweight"]};'
            f'--upper:{"uppercase" if t["upper"] else "none"};--r:{t["radius"]};'
            f'color-scheme:{"dark" if t["dark"] else "light"}}}')


def price_html(v):
    if v["price"] is None:
        return '<div class="price"><small>Preis</small><b class="ask">auf Anfrage</b></div>'
    unit = v.get("unit", "Tag")
    return f'<div class="price"><small>ab</small><b>{v["price"]} €</b> <small>pro {esc(unit)}</small></div>'


def build(b):
    t = b["theme"]
    full_addr = f'{b["street"]}, {b["zip"]} {b["city"]}'.replace(", ", ", ").replace("  ", " ")
    maps_q = f'{b["legal"]} {b["street"]} {b["zip"]} {b["city"]}'
    maps = "https://www.google.com/maps/search/?api=1&query=" + re.sub(r"\s+", "+", maps_q)
    tel = "tel:+" + intl(b["phone"])
    wa = intl(b["mobile"]) if b.get("mobile") else None
    title = f'{b["name"]} – Autovermietung {b["city"]}-{b["district"]}'

    # Fahrzeugkarten
    fleet = []
    for i, v in enumerate(b["fleet"]):
        specs = "".join(f"<li>{esc(s)}</li>" for s in v["specs"])
        fleet.append(
            f'<article class="vc reveal"><div class="pic">{photo(v.get("img"), v["name"] + " – Symbolbild") if v.get("img") else svg(v["kind"], b["hero_color"])}<span class="sym">Symbolbild</span></div>'
            f'<span class="cat">{esc(v["cat"])}</span><h3>{esc(v["name"])}</h3><ul>{specs}</ul>'
            f'<div class="foot">{price_html(v)}<a href="#anfrage" class="btn btn-o btn-sm" data-pick="{i}">Anfragen</a></div></article>')

    usps = "".join(
        f'<div class="usp reveal"><div class="ib">{ico(i)}</div><h3>{esc(h)}</h3><p>{esc(p)}</p></div>'
        for i, h, p in b["usps"])
    steps = "".join(f'<div class="step reveal"><h3>{esc(h)}</h3><p>{esc(p)}</p></div>' for h, p in b["steps"])
    faq = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(a)}</p></details>' for q, a in b["faq"])
    trust = "".join(f'<li>{ico(i)}{esc(s)}</li>' for i, s in b["trust"])
    stats = "".join(f'<div class="stat"><b>{esc(n)}</b><span>{esc(l)}</span></div>' for n, l in b["stats"])
    hours = "".join(f"<tr><td>{esc(d)}</td><td>{esc(h)}</td></tr>" for d, h in b["hours"])
    options = "".join(
        f'<option value="{i}">{esc(v["name"])} · {esc(v["cat"])}</option>' for i, v in enumerate(b["fleet"]))

    rating = ""
    if b.get("rating"):
        score, count = b["rating"]
        src = b.get("rating_src", "Google")
        star = ico("star")
        rating = f'''
<section><div class="wrap"><div class="rate reveal">
  <div><div class="big">{str(score).replace(".", ",")}</div><div class="stars">{star * 5}</div><small>{count} Bewertungen auf {src}</small></div>
  <div><h2>Kunden empfehlen uns weiter.</h2><p>Ehrliche Bewertungen von echten Kundinnen und Kunden – keine gekauften Sterne. In der Live-Version erscheinen hier Ihre neuesten {src}-Bewertungen automatisch.</p>
  <a class="btn" href="https://www.google.com/search?q={re.sub(r"[^A-Za-z0-9]+", "+", b["legal"] + " " + b["city"])}+Bewertungen" target="_blank" rel="noopener">Alle Bewertungen ansehen {ico("arrow")}</a></div>
</div></div></section>'''

    contact_items = [f'<li>{ico("pin")}<div><b>Adresse</b><br>{esc(b["street"])}<br>{esc((b["zip"] + " " + b["city"]).strip())}-{esc(b["district"])}</div></li>',
                     f'<li>{ico("phone")}<div><b>Telefon</b><br><a href="{tel}">{esc(b["phone"])}</a></div></li>']
    if b.get("mobile") and b["mobile"] != b["phone"]:
        contact_items.append(f'<li>{ico("wa")}<div><b>Mobil / WhatsApp</b><br><a href="https://wa.me/{wa}">{esc(b["mobile"])}</a></div></li>')
    elif wa:
        contact_items.append(f'<li>{ico("wa")}<div><b>WhatsApp</b><br><a href="https://wa.me/{wa}">Chat starten</a></div></li>')
    if b.get("mail"):
        contact_items.append(f'<li>{ico("mail")}<div><b>E-Mail</b><br><a href="mailto:{esc(b["mail"])}">{esc(b["mail"])}</a></div></li>')

    second_cta = (f'<a class="btn btn-wa" href="https://wa.me/{wa}">{ico("wa")}WhatsApp</a>' if wa
                  else f'<a class="btn btn-o" href="{tel}">{ico("phone")}{esc(b["phone"])}</a>')
    mb_mid = (f'<a class="btn btn-wa" href="https://wa.me/{wa}">{ico("wa")}WhatsApp</a>' if wa
              else f'<a class="btn btn-o" href="#kontakt">{ico("pin")}Anfahrt</a>')

    pv_msg = (f'Hallo, ich habe die Website-Vorschau für {b["name"]} gesehen und möchte mehr wissen.')
    pv_link = f'https://wa.me/{AGENCY["wa"]}?text=' + re.sub(" ", "%20", pv_msg)

    data = {
        "name": b["name"],
        "wa": wa,
        "mail": b.get("mail"),
        "tel": tel,
        "fleet": [{"n": v["name"], "c": v["cat"], "p": v["price"]} for v in b["fleet"]],
    }

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
<style>{theme_vars(t)}{CSS}</style>
</head>
<body>

<div class="pv" id="pv"><div class="wrap">
  <span><b>Vorschau</b> · Entwurf von {AGENCY["name"]} für {esc(b["name"])}. Gefällt sie Ihnen? Diese Seite kann in wenigen Tagen live sein.</span>
  <span style="display:flex;gap:8px;align-items:center"><a class="pvbtn" href="{pv_link}" target="_blank" rel="noopener">Jetzt übernehmen</a><button aria-label="Hinweis schließen" onclick="document.getElementById('pv').remove()">{ico("x")}</button></span>
</div></div>

<header class="hd"><div class="wrap">
  <a class="brand" href="#top"><span class="mark">{esc(b["logo_mark"])}</span><span>{esc(b["name"])}<small>Autovermietung {esc(b["city"])}</small></span></a>
  <nav class="nav" aria-label="Hauptnavigation"><a href="#fahrzeuge">Fahrzeuge</a><a href="#vorteile">Vorteile</a><a href="#ablauf">Ablauf</a><a href="#faq">FAQ</a><a href="#kontakt">Kontakt</a></nav>
  <a class="btn btn-p btn-sm hcta" href="{tel}">{ico("phone")}{esc(b["phone"])}</a>
</div></header>

<main id="top">
<section class="hero"><div class="wrap">
  <div>
    <span class="eyebrow">{esc(b["eyebrow"])}</span>
    <h1>{b["h1"]}</h1>
    <p class="lead">{esc(b["lead"])}</p>
    <div class="cta"><a class="btn btn-p" href="#anfrage">Fahrzeug anfragen {ico("arrow")}</a>{second_cta}</div>
    <ul class="trust">{trust}</ul>
  </div>
  <div>
    <div class="stage">{photo(b["hero_img"], b["name"] + " – " + b["eyebrow"], eager=True)}<div class="badge">{ico(b["trust"][0][0])}<span>{esc(b["trust"][0][1])}</span></div></div>
    <div class="book" id="anfrage">
      <form id="bf" novalidate>
        <h3>Verfügbarkeit anfragen</h3>
        <p class="muted" style="font-size:.92rem">Unverbindlich · Antwort in Kürze</p>
        <div class="row" style="grid-template-columns:1fr"><div><label for="veh">Fahrzeug</label><select id="veh">{options}</select></div></div>
        <div class="row"><div><label for="d1">Abholung</label><input type="date" id="d1" required></div><div><label for="d2">Rückgabe</label><input type="date" id="d2" required></div></div>
        <div class="row"><div><label for="nm">Name</label><input id="nm" autocomplete="name" placeholder="Ihr Name" required></div><div><label for="ph">Telefon</label><input id="ph" type="tel" autocomplete="tel" placeholder="Für die Rückmeldung" required></div></div>
        <div class="est"><span id="estl">Geschätzter Preis</span><strong id="est">–</strong></div>
        <button class="btn btn-p" type="submit">Anfrage senden {ico("arrow")}</button>
      </form>
      <div class="ok" role="status">
        <div class="tick">{ico("check")}</div>
        <h3>Anfrage ist angekommen</h3>
        <p id="oktext">Vorschau-Demo: In der Live-Version landet diese Anfrage sofort bei {esc(b["name"])} – per E-Mail{" und WhatsApp" if wa else ""}.</p>
        <button class="btn btn-o btn-sm" type="button" id="again">Neue Anfrage</button>
      </div>
    </div>
  </div>
</div></section>

<div class="stats"><div class="wrap">{stats}</div></div>

<section id="fahrzeuge"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">Unsere Flotte</span><h2>Das passende Fahrzeug<br>für jedes Vorhaben.</h2></div><p>Klare Preise, gepflegte Fahrzeuge und ehrliche Beratung – direkt vom Vermieter aus {esc(b["city"])}.</p></div>
  <div class="grid fleet">{"".join(fleet)}</div>
</div></section>

<section id="vorteile" class="alt"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">Warum {esc(b["name"])}</span><h2>Lokal mieten lohnt sich.</h2></div><p>Kein Konzern, keine Hotline, kein Kleingedrucktes-Labyrinth. Sondern ein Vermieter, der in {esc(b["city"])} zu Hause ist.</p></div>
  <div class="grid usps">{usps}</div>
</div></section>

<section id="ablauf"><div class="wrap">
  <div class="sh"><div><span class="eyebrow">So einfach geht’s</span><h2>In drei Schritten auf der Straße.</h2></div></div>
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
    <div class="card reveal"><h3>{esc(b["legal"])}</h3><ul class="cl">{"".join(contact_items)}</ul>
      <a class="mapbtn" href="{maps}" target="_blank" rel="noopener">{ico("pin")}Route in Google Maps öffnen</a></div>
    <div class="card reveal"><h3>Öffnungszeiten</h3><table class="hrs">{hours}</table>
      <div class="cta"><a class="btn btn-p" href="{tel}">{ico("phone")}Jetzt anrufen</a><a class="btn btn-o" href="#anfrage">Online anfragen</a></div></div>
  </div>
  <p class="note">* Angaben in dieser Vorschau stammen aus öffentlich verfügbaren Quellen (Stand 10/2026) und werden vor dem Livegang gemeinsam mit Ihnen geprüft und ergänzt. Preise und Fahrzeuge sind beispielhaft.</p>
</div></section>
</main>

<footer class="ft"><div class="wrap">
  <span>© 2026 {esc(b["legal"])} · {esc(full_addr)}</span>
  <span><a href="#">Impressum</a> · <a href="#">Datenschutz</a> · <a href="#">AGB</a> · Fotos: Unsplash (Symbolbilder) · Website: <a href="{AGENCY["url"]}" target="_blank" rel="noopener">{AGENCY["name"]}</a></span>
</div></footer>

<nav class="mb" aria-label="Schnellkontakt">
  <a class="btn btn-o" href="{tel}">{ico("phone")}Anrufen</a>{mb_mid}<a class="btn btn-p" href="#anfrage">Anfragen</a>
</nav>

<script>
(function(){{
  var D={json.dumps(data, ensure_ascii=False)};
  var f=document.getElementById('bf'),veh=document.getElementById('veh'),d1=document.getElementById('d1'),d2=document.getElementById('d2');
  var est=document.getElementById('est'),estl=document.getElementById('estl'),box=document.querySelector('.book');
  function iso(d){{return d.toISOString().slice(0,10)}}
  var t=new Date();t.setDate(t.getDate()+1);var u=new Date(t);u.setDate(u.getDate()+1);
  d1.value=iso(t);d2.value=iso(u);d1.min=iso(new Date());d2.min=d1.value;
  function days(){{var a=new Date(d1.value),b=new Date(d2.value);var n=Math.round((b-a)/864e5);return isNaN(n)?0:Math.max(1,n)}}
  function calc(){{
    if(d2.value<d1.value){{d2.value=d1.value}}d2.min=d1.value;
    var v=D.fleet[veh.value],n=days();
    if(v.p){{est.textContent='ab '+(v.p*n).toLocaleString('de-DE')+' €';estl.textContent='Geschätzt für '+n+(n==1?' Tag':' Tage')}}
    else{{est.textContent='auf Anfrage';estl.textContent=n+(n==1?' Tag':' Tage')+' · individueller Preis'}}
  }}
  [veh,d1,d2].forEach(function(e){{e.addEventListener('change',calc)}});calc();
  document.querySelectorAll('[data-pick]').forEach(function(a){{a.addEventListener('click',function(){{veh.value=a.getAttribute('data-pick');calc()}})}});
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


# --------------------------------------------------------------------------
# Übersicht für den Vertrieb (nur intern, noindex)
# --------------------------------------------------------------------------
def overview():
    cards = []
    for b in BUSINESSES:
        t = b["theme"]
        wa_text = (f"Hallo, hier ist {{Ihr Name}} von SocialClip aus Erlangen. Ich habe für {b['name']} "
                   f"eine Website-Vorschau gebaut – ganz ohne Verpflichtung. Hier können Sie sie sich ansehen: "
                   f"https://socialclip.art/vorschau/{b['slug']}/ . Wenn sie Ihnen gefällt, ist sie in wenigen Tagen live. "
                   f"Darf ich Sie kurz anrufen?")
        cards.append(f'''
<article class="c">
  <div class="sw" style="background:{t["primary"]};color:{t["on_primary"]}">{esc(b["logo_mark"])}</div>
  <div class="bd">
    <span class="tag">{esc(b["city"])} · {esc(b["district"])}</span>
    <h2>{esc(b["name"])}</h2>
    <p class="m">{esc(b["street"])}, {esc(b["zip"])} {esc(b["city"])} · <a href="tel:+{intl(b["phone"])}">{esc(b["phone"])}</a>{(" · " + esc(b["mail"])) if b.get("mail") else ""}</p>
    <p><b>Ist-Zustand:</b> {esc(b["pitch"]["status"])}</p>
    <p><b>Verkaufsargument:</b> {esc(b["pitch"]["angle"])}</p>
    <details><summary>Nachricht zum Kopieren</summary><textarea readonly>{esc(wa_text)}</textarea></details>
    <a class="go" href="{b["slug"]}/index.html" target="_blank" rel="noopener">Vorschau öffnen →</a>
  </div>
</article>''')
    return f'''<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Vorschau-Übersicht Autovermietungen</title>
<style>
:root{{color-scheme:dark;--bg:#121212;--s:#1c1c1c;--l:#2c2c2c;--t:#f1ece2;--m:#a6a198;--a:#ffd166}}
*{{box-sizing:border-box}}body{{margin:0;background:var(--bg);color:var(--t);font:16px/1.6 system-ui,-apple-system,'Segoe UI',sans-serif}}
.w{{width:min(980px,100% - 32px);margin:0 auto;padding:48px 0 80px}}h1{{font-size:clamp(1.8rem,4vw,2.6rem);margin:0 0 8px;line-height:1.1}}
.i{{color:var(--m);max-width:65ch}}.c{{display:grid;grid-template-columns:72px 1fr;gap:20px;background:var(--s);border:1px solid var(--l);border-radius:16px;padding:22px;margin-top:18px}}
.sw{{width:72px;height:72px;border-radius:14px;display:grid;place-items:center;font-weight:800;font-size:1.2rem}}
.tag{{font-size:.78rem;text-transform:uppercase;letter-spacing:.08em;color:var(--a);font-weight:700}}h2{{margin:2px 0 4px;font-size:1.35rem}}
.m{{color:var(--m);font-size:.9rem;margin:0 0 10px}}.bd p{{margin:6px 0}}a{{color:var(--a)}}
.go{{display:inline-block;margin-top:12px;background:var(--a);color:#111;text-decoration:none;font-weight:700;padding:10px 16px;border-radius:10px}}
details{{margin-top:10px}}summary{{cursor:pointer;color:var(--m)}}textarea{{width:100%;min-height:120px;margin-top:8px;background:var(--bg);color:var(--t);border:1px solid var(--l);border-radius:10px;padding:10px;font:inherit;font-size:.9rem}}
@media(max-width:560px){{.c{{grid-template-columns:1fr}}}}
</style></head><body><div class="w">
<h1>Website-Vorschauen: Autovermietungen Nürnberg & Erlangen</h1>
<p class="i">Unabhängige, inhabergeführte Vermieter – keine Franchise-Ketten. Jede Vorschau ist mobil optimiert, lädt ohne externe Anfragen (DSGVO-freundlich) und hat ein funktionierendes Anfrageformular mit Preisrechner. Interne Seite, nicht für Suchmaschinen.</p>
{"".join(cards)}
</div></body></html>
'''


def main():
    os.makedirs(OUT, exist_ok=True)
    for b in BUSINESSES:
        d = os.path.join(OUT, b["slug"])
        os.makedirs(d, exist_ok=True)
        with open(os.path.join(d, "index.html"), "w", encoding="utf-8") as fh:
            fh.write(build(b))
    with open(os.path.join(OUT, "index.html"), "w", encoding="utf-8") as fh:
        fh.write(overview())
    print(f"{len(BUSINESSES)} Vorschauen erzeugt in {OUT}")
    # Einzeldateien mit eingebetteten Bildern – zum direkten Verschicken/Öffnen
    global INLINE
    INLINE = True
    d = os.path.join(OUT, "einzeldateien")
    os.makedirs(d, exist_ok=True)
    for b in BUSINESSES:
        with open(os.path.join(d, b["slug"] + ".html"), "w", encoding="utf-8") as fh:
            fh.write(build(b))
    print(f"Einzeldateien in {d}")


if __name__ == "__main__":
    main()
