"""Holt Geschäfte in Erlangen von OpenStreetMap und speichert sie als map/firmen.json.

Läuft automatisch über GitHub Actions (.github/workflows/map-daten.yml).
"""
import json
import time
import urllib.parse
import urllib.request

BBOX = "49.36,10.85,49.65,11.22"  # Nürnberg, Fürth, Erlangen
SERVERS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
]
QUERY = (
    "[out:json][timeout:180];("
    + "".join(f'nwr["{k}"]["name"]({BBOX});' for k in ["shop", "craft", "office", "healthcare"])
    + 'nwr["amenity"~"^(restaurant|cafe|fast_food|bar|pub|ice_cream|biergarten|doctors|dentist|pharmacy|clinic|'
    + f'veterinary|car_wash|fuel|car_rental|bank|post_office|driving_school)$"]["name"]({BBOX});'
    + f'nwr["leisure"~"^(fitness_centre|sports_centre)$"]["name"]({BBOX});'
    + ");out center tags;"
)
TAGS = ["shop", "beauty", "amenity", "craft", "office", "healthcare", "leisure", "addr:street", "addr:housenumber",
        "addr:city", "opening_hours", "website", "contact:website", "phone", "contact:phone", "cuisine", "description"]


def abrufen(query=QUERY):
    body = urllib.parse.urlencode({"data": query}).encode()
    for runde in range(3):
        for url in SERVERS:
            try:
                req = urllib.request.Request(url, data=body, headers={"User-Agent": "SocialClip-Map (socialclip.art)"})
                with urllib.request.urlopen(req, timeout=240) as r:
                    return json.load(r)
            except Exception as e:  # nächster Server
                print(f"{url}: {e}")
        time.sleep(30 * (runde + 1))
    raise SystemExit("Kein Overpass-Server erreichbar")


def main():
    daten = []
    for e in abrufen()["elements"]:
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        t = e.get("tags", {})
        if not lat or not t.get("name"):
            continue
        daten.append({"id": e["type"] + str(e["id"]), "name": t["name"], "lat": round(lat, 6), "lon": round(lon, 6),
                      "t": {k: t[k] for k in TAGS if k in t}})
    if len(daten) < 100:
        raise SystemExit(f"Nur {len(daten)} Einträge – Datei wird nicht überschrieben")
    daten.sort(key=lambda d: d["id"])
    with open("map/firmen.json", "w", encoding="utf-8") as f:
        json.dump(daten, f, ensure_ascii=False, separators=(",", ":"))
    print(f"{len(daten)} Geschäfte gespeichert")

    # Bäume für die Karte (nur Standorte, gerundet)
    baeume = [[round(e["lon"], 5), round(e["lat"], 5)] for e in abrufen(f'[out:json][timeout:120];node["natural"="tree"]({BBOX});out;')["elements"]]
    if len(baeume) > 100:
        baeume.sort()
        with open("map/baeume.json", "w", encoding="utf-8") as f:
            json.dump(baeume, f, separators=(",", ":"))
        print(f"{len(baeume)} Bäume gespeichert")


main()
