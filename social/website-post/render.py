"""Rendert die Karussell-Slides (1080x1350): je Slide zwei Bildhälften mit Text.

Bilder kommen aus ./fotos (erzeugt von screenshots.js oder eigene Fotos).
"y" in slides.json = wo im Bild der Ausschnitt beginnt (0 = oben, 1 = unten),
"ty" = Höhe des Textes in der Bildhälfte (Standard 0.5 = Mitte).
Aufruf: python3 render.py
"""
import json
import pathlib

from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps

W, H = 1080, 1350
HALF = H // 2
BASE = pathlib.Path(__file__).parent
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"


def band(half):
    img = ImageOps.exif_transpose(Image.open(BASE / "fotos" / half["bild"])).convert("RGB")
    img = img.resize((W, round(img.height * W / img.width)))
    if img.height < HALF:
        return ImageOps.fit(img, (W, HALF))
    top = min(round(img.height * half.get("y", 0)), img.height - HALF)
    img = img.crop((0, top, W, top + HALF))
    # leicht abdunkeln, damit der Text immer lesbar bleibt
    return ImageEnhance.Brightness(img).enhance(0.62)


def text_on(img, text, ty=0.5):
    size = 96
    while True:
        f = ImageFont.truetype(FONT, size)
        if ImageDraw.Draw(img).textlength(text, font=f) <= W - 110 or size <= 50:
            break
        size -= 2
    cx, cy = W // 2, round(HALF * ty)
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.text((cx, cy + 4), text, font=f, fill=(0, 0, 0, 230), anchor="mm")
    sd.text((cx, cy + 4), text, font=f, fill=(0, 0, 0, 230), anchor="mm", stroke_width=10, stroke_fill=(0, 0, 0, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(16))
    out = Image.alpha_composite(img.convert("RGBA"), shadow)
    ImageDraw.Draw(out).text((cx, cy), text, font=f, fill="white", anchor="mm")
    return out.convert("RGB")


def main():
    slides = json.loads((BASE / "slides.json").read_text())
    out_dir = BASE / "export"
    out_dir.mkdir(exist_ok=True)
    for i, s in enumerate(slides, 1):
        canvas = Image.new("RGB", (W, H))
        canvas.paste(text_on(band(s["top"]), s["top"]["text"], s["top"].get("ty", 0.5)), (0, 0))
        canvas.paste(text_on(band(s["bottom"]), s["bottom"]["text"], s["bottom"].get("ty", 0.5)), (0, HALF))
        canvas.save(out_dir / f"slide-{i}.png")
    print(f"{len(slides)} Slides in {out_dir}")


if __name__ == "__main__":
    main()
