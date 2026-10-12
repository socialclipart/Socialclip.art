"""Rendert die Karussell-Slides (1080x1350) im Look von socialclip.art.

Jede Slide hat zwei Hälften. Pro Hälfte: Text oben auf Schwarz, darunter ein
ruhiger Ausschnitt der Website (aus ./fotos, erzeugt von screenshots.js).
"y" in slides.json = obere Kante des Ausschnitts im Screenshot (in Pixeln).
Aufruf: python3 render.py
"""
import json
import pathlib

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
HALF = H // 2
BG = (14, 14, 14)
TEXT_Y = 150          # Mitte der Textzeile in der Hälfte
IMG_TOP = 255         # ab hier beginnt der Website-Ausschnitt
FADE = 90             # weicher Übergang vom Schwarz in den Ausschnitt
BASE = pathlib.Path(__file__).parent
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"


def half_image(half):
    img = Image.new("RGB", (W, HALF), BG)
    shot = Image.open(BASE / "fotos" / half["bild"]).convert("RGB")
    shot = shot.resize((W, round(shot.height * W / shot.width)))
    y = round(half["y"] * W / 1170)
    crop = shot.crop((0, y, W, y + HALF - IMG_TOP))
    mask = Image.new("L", crop.size, 255)
    d = ImageDraw.Draw(mask)
    for i in range(FADE):
        d.line([(0, i), (W, i)], fill=round(255 * i / FADE))
    img.paste(crop, (0, IMG_TOP), mask)

    d = ImageDraw.Draw(img)
    size = 84
    while d.textlength(half["text"], font=ImageFont.truetype(FONT, size)) > W - 120:
        size -= 2
    d.text((W // 2, TEXT_Y), half["text"], font=ImageFont.truetype(FONT, size), fill="white", anchor="mm")
    return img


def main():
    slides = json.loads((BASE / "slides.json").read_text())
    out_dir = BASE / "export"
    out_dir.mkdir(exist_ok=True)
    for i, s in enumerate(slides, 1):
        canvas = Image.new("RGB", (W, H), BG)
        canvas.paste(half_image(s["top"]), (0, 0))
        canvas.paste(half_image(s["bottom"]), (0, HALF))
        # feine Trennlinie zwischen den Hälften, wie die Linien auf der Website
        ImageDraw.Draw(canvas).line([(0, HALF), (W, HALF)], fill=(48, 48, 48), width=2)
        canvas.save(out_dir / f"slide-{i}.png")
    print(f"{len(slides)} Slides in {out_dir}")


if __name__ == "__main__":
    main()
