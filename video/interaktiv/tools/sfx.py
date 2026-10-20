"""SFX für die interaktiven Hooks. Aufruf: python3 -I tools/sfx.py <slot|gold> <dur> <out.wav>"""
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfxlib as S  # noqa: E402

hook, dur, outp = sys.argv[1], float(sys.argv[2]), sys.argv[3]
S.rng = np.random.default_rng(11 if hook == 'slot' else 12)
S.reset(dur)
P, tt, SR = S.place, S.tt, S.SR


def ratchet(d=.3, n=7):
    s = np.zeros(int(SR * d))
    for i in range(n):
        c = S.click()[: int(.02 * SR)]; k = int(i / n * d * SR); s[k:k + len(c)] += c * (1 - i / n * .5)
    return S.norm(s)


def coin():
    t = tt(.5)
    return S.fade(S.norm(sum(np.sin(2 * np.pi * f * t) * np.exp(-t / d) for f, d in ((3200, .12), (4700, .08), (6100, .05)))), .001, .05)


def zap():
    t = tt(.12)
    return S.fade(S.norm(np.sign(np.sin(2 * np.pi * np.cumsum(2400 - 1800 * t / .12) / SR)) * np.exp(-t / .05)), .001, .02)


def change_hit():
    return S.norm(S.whoosh(.25, 600, 5000, .85) * .7 + np.pad(S.thump(170, 70, .2), (0, int(.05 * SR))) [: int(.25 * SR)])


if hook == 'slot':
    P(S.whoosh(.4, 3000, 300, .3), .02, .3)
    P(S.boom(1.8), .42, .8)
    P(S.thump(110, 40, .5), .42, .7)
    P(ratchet(), 1.35, .5, .4)
    P(S.thump(160, 70, .25), 1.6, .4, .4)
    P(S.whoosh(.6, 300, 3000, .7), 1.5, .25)
    k = 2.0
    while k < 10.0 - 1e-6:                      # Walzen-/Anzeigen-Ticken im Takt der Ergebnisse
        P(S.click()[: int(.015 * SR)], k, .12, (-.3, .3)[int(k * 10) % 2]); k += .1
    for i in range(14):
        P(coin(), 2.3 + i * .55 + S.rng.uniform(0, .2), .12, S.rng.uniform(-.7, .7))
    for i, t0 in enumerate((10.0, 10.22, 10.44)):
        P(S.thump(120 + i * 15, 50, .3), t0, .55, (-.3, 0, .3)[i])
        P(S.click(), t0, .3)
    P(S.ding(), 10.5, .3)
    P(S.pop(), 11.5, .35)
    P(S.sparkle(1.2), 10.55, .15)
else:
    P(S.whoosh(.8, 200, 3000, .8), 0, .3)
    P(S.sparkle(1.2), .6, .15)
    for k in (.2, .45, .9, 1.3):
        P(zap(), k, .12, .2)
    P(S.tick(), 1.75, .3)
    for t0 in (5.38, 5.92, 6.49):
        P(S.thump(150, 60, .25), t0, .5)
        P(S.click(), t0, .25)
    P(S.boom(1.6), 7.2, .7)
    for t0 in (7.2, 7.68, 8.15, 8.6, 9.02, 9.42, 9.52, 9.95, 10.42, 11.0):
        P(change_hit(), t0, .45, S.rng.uniform(-.2, .2))   # identisch für jede Farbe, Gold verrät sich nicht
    P(S.boom(1.8), 11.15, .6)
    P(S.sparkle(1.4), 12.35, .3)
    P(S.ding(), 12.35, .3)
    P(S.pop(), 12.55, .35)

out = S.out[: int(SR * dur)]
peak = float(np.max(np.abs(out)))
if peak > .98:
    out *= .98 / peak
pcm = (out * (2 ** 23 - 1)).astype('<i4')
with wave.open(outp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR)
    w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
print(hook, 'sfx peak', round(peak, 3))
