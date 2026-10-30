"""Holt die aktuellen Inserate von CarZone bei mobile.de und speichert sie als vorschau/carzone/autos.json.

Läuft automatisch über GitHub Actions (.github/workflows/carzone-autos.yml).
Zugangsdaten nur als GitHub-Secrets: MOBILEDE_USER, MOBILEDE_PASS, MOBILEDE_KUNDENNR.
Verkaufte Autos verschwinden bei mobile.de aus der Suche und damit beim nächsten Lauf auch hier.
"""
import base64
import json
import os
import urllib.request

ZIEL = "vorschau/carzone/autos.json"
API = "https://services.mobile.de/search-api/search"
KRAFTSTOFF = {"PETROL": "Benzin", "DIESEL": "Diesel", "ELECTRICITY": "Elektro", "HYBRID": "Hybrid (Benzin)",
              "HYBRID_DIESEL": "Hybrid (Diesel)", "LPG": "Autogas (LPG)", "CNG": "Erdgas (CNG)", "HYDROGENIUM": "Wasserstoff"}
GETRIEBE = {"MANUAL_GEAR": "Schaltgetriebe", "AUTOMATIC_GEAR": "Automatik", "SEMIAUTOMATIC_GEAR": "Halbautomatik"}


def abrufen(user, passwort, kundennr):
    auth = base64.b64encode(f"{user}:{passwort}".encode()).decode()
    ads, seite = [], 1
    while True:
        url = f"{API}?customerNumber={kundennr}&page.size=100&page.number={seite}&sort.field=modificationTime&sort.order=DESCENDING"
        req = urllib.request.Request(url, headers={"Authorization": f"Basic {auth}",
                                                   "Accept": "application/vnd.de.mobile.api+json"})
        with urllib.request.urlopen(req, timeout=60) as r:
            daten = json.load(r)
        ads += daten.get("ads", [])
        if seite >= daten.get("maxPages", 1):
            return ads
        seite += 1


def bild(b):
    for groesse in ("xxl", "xl", "l", "m", "s"):
        if b.get(groesse):
            return b[groesse]
    return None


def auto(a):
    ez = str(a.get("firstRegistration") or "")
    preis = (a.get("price") or {}).get("consumerPriceGross")
    leistung = a.get("power")  # kW
    return {
        "id": a.get("mobileAdId"),
        "marke": (a.get("make") or "").replace("_", " ").title(),
        "modell": a.get("modelDescription") or a.get("model") or "",
        "preis": round(float(preis)) if preis else None,
        "km": a.get("mileage"),
        "erstzulassung": f"{ez[4:6]}/{ez[:4]}" if len(ez) == 6 else None,
        "kraftstoff": KRAFTSTOFF.get(a.get("fuel"), a.get("fuel")),
        "getriebe": GETRIEBE.get(a.get("gearbox"), a.get("gearbox")),
        "ps": round(leistung * 1.35962) if leistung else None,
        "highlights": a.get("highlights") or [],
        "bilder": [u for u in (bild(b) for b in a.get("images") or []) if u][:12],
        "link": a.get("detailPageUrl"),
    }


def main():
    user, passwort, kundennr = (os.environ.get(k, "").strip() for k in ("MOBILEDE_USER", "MOBILEDE_PASS", "MOBILEDE_KUNDENNR"))
    if not (user and passwort and kundennr):
        print("mobile.de-Zugangsdaten fehlen noch (GitHub-Secrets) – nichts geändert.")
        return
    # Bei einem Fehler bricht das Skript ab, die alte autos.json bleibt dann unverändert stehen.
    autos = [auto(a) for a in abrufen(user, passwort, kundennr)]
    with open(ZIEL, "w", encoding="utf-8") as f:
        json.dump({"autos": autos}, f, ensure_ascii=False, indent=1)
    print(f"{len(autos)} Autos gespeichert")


if __name__ == "__main__":
    main()
