"""Rendert die Karussell-Slides (1080x1350): ein Bild pro Slide, zwei Textzeilen.

Bilder liegen in ./ki. "ty" = Höhe des Textblocks (0 = oben, 1 = unten).
Optional "bildschirm": setzt einen Screenshot von socialclip.art perspektivisch
auf einen Bildschirm im Bild (Ecken im Originalbild: oben links, oben rechts,
unten rechts, unten links).
Aufruf: python3 render.py
"""
import json
import pathlib

import numpy as np
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter, ImageFont

W, H = 1080, 1350
BASE = pathlib.Path(__file__).parent
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"


def perspective_coeffs(dst, src):
    rows, rhs = [], []
    for (x, y), (u, v) in zip(dst, src):
        rows.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        rows.append([0, 0, 0, x, y, 1, -v * x, -v * y])
        rhs += [u, v]
    return np.linalg.solve(np.array(rows, float), np.array(rhs, float)).tolist()


def put_screen(img, screen):
    shot = Image.open(BASE / "ki" / screen["bild"]).convert("RGB")
    sw, sh = shot.size
    shot = ImageEnhance.Brightness(shot).enhance(0.9)
    corners = [tuple(c) for c in screen["ecken"]]
    coeffs = perspective_coeffs(corners, [(0, 0), (sw, 0), (sw, sh), (0, sh)])
    warped = shot.transform(img.size, Image.PERSPECTIVE, coeffs, Image.BICUBIC)
    mask = Image.new("L", img.size, 0)
    ImageDraw.Draw(mask).polygon(corners, fill=255)
    img.paste(warped, (0, 0), mask.filter(ImageFilter.GaussianBlur(0.8)))
    return img


def slide(s):
    img = Image.open(BASE / "ki" / s["bild"]).convert("RGB")
    if "bildschirm" in s:
        img = put_screen(img, s["bildschirm"])
    img = img.resize((W, round(img.height * W / img.width)), Image.LANCZOS)
    top = (img.height - H) // 2
    img = img.crop((0, top, W, top + H)).convert("RGBA")

    size = 76
    while max(ImageDraw.Draw(img).textlength(z, font=ImageFont.truetype(FONT, size)) for z in s["zeilen"]) > W - 120:
        size -= 2
    font = ImageFont.truetype(FONT, size)
    gap = round(size * 1.25)
    cy = round(H * s["ty"])
    ys = [cy - gap // 2, cy + gap // 2]

    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    for z, y in zip(s["zeilen"], ys):
        sd.text((W // 2, y + 3), z, font=font, fill=(0, 0, 0, 200), anchor="mm", stroke_width=6, stroke_fill=(0, 0, 0, 90))
    img = Image.alpha_composite(img, shadow.filter(ImageFilter.GaussianBlur(14)))
    d = ImageDraw.Draw(img)
    for z, y in zip(s["zeilen"], ys):
        d.text((W // 2, y), z, font=font, fill="white", anchor="mm")
    return img.convert("RGB")


def main():
    slides = json.loads((BASE / "slides.json").read_text())
    out_dir = BASE / "export"
    out_dir.mkdir(exist_ok=True)
    for i, s in enumerate(slides, 1):
        slide(s).save(out_dir / f"slide-{i}.png")
    print(f"{len(slides)} Slides in {out_dir}")


if __name__ == "__main__":
    main()
