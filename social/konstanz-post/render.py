"""Rendert die Karussell-Slides (1080x1350, zwei Bildhälften + Text in der Mitte jeder Hälfte).

Fotos in ./fotos/ ablegen (Namen siehe slides.json). Fehlt ein Foto, wird ein Platzhalter
mit Motiv-Beschreibung gerendert. Aufruf: python3 render.py
"""
import json
import pathlib

from PIL import Image, ImageDraw, ImageFilter, ImageFont, ImageOps

W, H = 1080, 1350
HALF = H // 2
BASE = pathlib.Path(__file__).parent
FONT = "/usr/share/fonts/opentype/inter/InterDisplay-Bold.otf"
FONT_SMALL = "/usr/share/fonts/opentype/inter/Inter-Medium.otf"


def placeholder(half, tint):
    img = Image.new("RGB", (W, HALF), tuple(tint))
    shade = Image.linear_gradient("L").resize((W, HALF))
    dark = Image.new("RGB", (W, HALF), tuple(c // 3 for c in tint))
    img = Image.composite(dark, img, shade)
    d = ImageDraw.Draw(img)
    f = ImageFont.truetype(FONT_SMALL, 26)
    label = "FOTO: " + half["shot"]
    # Motivbeschreibung unten links, umbrechen
    words, lines, line = label.split(), [], ""
    for w in words:
        test = (line + " " + w).strip()
        if d.textlength(test, font=f) > W - 120:
            lines.append(line)
            line = w
        else:
            line = test
    lines.append(line)
    y = HALF - 50 - len(lines) * 36
    for ln in lines:
        d.text((48, y), ln, font=f, fill=(255, 255, 255, 150))
        y += 36
    return img


def photo(half):
    p = BASE / "fotos" / half["foto"]
    if p.exists():
        return ImageOps.fit(ImageOps.exif_transpose(Image.open(p)).convert("RGB"), (W, HALF))
    return placeholder(half, half["tint"])


def text_on(img, text):
    size = 92
    while True:
        f = ImageFont.truetype(FONT, size)
        if ImageDraw.Draw(img).textlength(text, font=f) <= W - 100 or size <= 50:
            break
        size -= 2
    cx, cy = W // 2, int(HALF * 0.5)
    shadow = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(shadow).text((cx, cy + 3), text, font=f, fill=(0, 0, 0, 170), anchor="mm")
    shadow = shadow.filter(ImageFilter.GaussianBlur(10))
    out = Image.alpha_composite(img.convert("RGBA"), shadow)
    ImageDraw.Draw(out).text((cx, cy), text, font=f, fill="white", anchor="mm")
    return out.convert("RGB")


def main():
    slides = json.loads((BASE / "slides.json").read_text())
    out_dir = BASE / "export"
    out_dir.mkdir(exist_ok=True)
    for i, s in enumerate(slides, 1):
        canvas = Image.new("RGB", (W, H))
        canvas.paste(text_on(photo(s["top"]), s["top"]["text"]), (0, 0))
        canvas.paste(text_on(photo(s["bottom"]), s["bottom"]["text"]), (0, HALF))
        canvas.save(out_dir / f"slide-{i}.png")
    print(f"{len(slides)} Slides in {out_dir}")


if __name__ == "__main__":
    main()
