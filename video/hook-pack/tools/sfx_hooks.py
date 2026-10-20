"""Action-SFX für das Hook-Pack. Aufruf: python3 -I tools/sfx_hooks.py <glass|bomb|trailer> <dur> <out.wav>"""
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfxlib as S  # noqa: E402

hook, dur, outp = sys.argv[1], float(sys.argv[2]), sys.argv[3]
S.rng = np.random.default_rng({'glass': 1, 'bomb': 2, 'trailer': 3}[hook])
S.reset(dur)
P, tt, SR = S.place, S.tt, S.SR


def shatter(d=1.6):
    """Glasbruch: harter Knack + viele kurze, hohe Splitter, abklingend."""
    s = np.zeros(int(SR * d))
    crack = S.bandpass(S.noise(.08), 1500, 12000) * np.exp(-tt(.08) / .012)
    s[:len(crack)] += S.norm(crack)
    for _ in range(140):
        t0 = abs(S.rng.normal(0, .25)) + S.rng.uniform(0, .05)
        if t0 > d - .2:
            continue
        f = S.rng.uniform(2500, 9000); dd = S.rng.uniform(.02, .12)
        tink = np.sin(2 * np.pi * f * tt(dd)) * np.exp(-tt(dd) / (dd / 4)) + S.bandpass(S.noise(dd), 3000, 12000) * np.exp(-tt(dd) / .005) * .5
        i = int(t0 * SR); s[i:i + len(tink)] += tink * S.rng.uniform(.15, .6) * np.exp(-t0 * 2)
    return S.fade(S.norm(s), .001, .2)


def braam(d=1.6, f0=55):
    """Trailer-Hit: verstimmte Sägezähne, Tiefpass-Hüllkurve, Sub."""
    t = tt(d)
    saw = sum(((f0 * k * (1 + det) * t) % 1 * 2 - 1) for k, det in ((1, 0), (1, .006), (2, -.004), (1.5, .003)))
    body = S.sweep_lp(saw, 1800, 220) * np.exp(-t / .9)
    sub = np.sin(2 * np.pi * f0 / 2 * t) * np.exp(-t / .8)
    hit = S.bandpass(S.noise(.15), 80, 3000) * np.exp(-tt(.15) / .03)
    out = S.norm(body) * .8 + sub * .7
    out[:len(hit)] += S.norm(hit) * .5
    return S.fade(S.norm(out), .002, .3)


def beep():
    t = tt(.13)
    return S.fade(np.sin(2 * np.pi * 1320 * t) * (1 - t / .13) ** .3, .002, .02)


def explosion(d=2.6):
    t = tt(d)
    rumble = S.sweep_lp(S.noise(d), 3000, 90) * np.exp(-t / .7)
    crack = S.bandpass(S.noise(.2), 400, 9000) * np.exp(-tt(.2) / .04)
    out = S.norm(rumble) + S.boom(d) * .9
    out[:len(crack)] += S.norm(crack) * .8
    return S.fade(S.norm(out), .001, .4)


def fuse(d):
    n = S.bandpass(S.noise(d), 2000, 9000)
    crackle = (S.rng.random(len(n)) > .9985).astype(float)
    crackle = np.convolve(crackle, np.exp(-np.arange(200) / 30), 'same')
    return S.norm(n * .25 + crackle * S.norm(n) * 2)


if hook == 'glass':
    k = 0.0
    while k < .55:                       # schnelles Wischen
        P(S.whoosh(.18, 1500, 4000, .5), k, .06, .4)
        k += .14
    P(S.whoosh(.35, 400, 6000, .9), .28, .2)  # Anlauf
    P(shatter(1.8), .6, .9)
    P(S.boom(2.0), .6, .75)
    P(S.thump(80, 35, .6), .6, .7)
    P(S.slam(), 1.0, .6)
    P(S.sparkle(1.2), 1.02, .2)
    P(S.slam(), 1.45, .45)
    P(S.riser(.5), 2.72, .3)
elif hook == 'bomb':
    P(fuse(2.3), 0, .18, .2)
    for i, t0 in enumerate((.2, .9, 1.6)):
        P(beep(), t0, .45)
        P(S.thump(140 + i * 20, 60, .25), t0, .35)
        for k in range(1, 4):            # Ticken dazwischen
            P(S.click(), t0 + k * .17, .16, -.2)
    P(S.riser(.55), 1.75, .35)
    P(explosion(2.6), 2.3, 1.0)
    P(S.cash_counter(1.0), 2.45, .22, .3)
    P(S.flutter(1.2), 2.5, .2, -.3)
    P(S.slam(), 2.45, .5)
    P(S.slam(), 2.75, .55)
    P(S.riser(.4), 3.2, .25)
elif hook == 'trailer':
    for i, t0 in enumerate((.12, 1.12, 2.12)):
        P(braam(1.4 if i < 2 else 1.8, 55 if i < 2 else 41), t0, .85 if i < 2 else 1.0)
    P(S.whoosh(.5, 200, 2500, .85), 2.62, .3)
    P(S.boom(2.0), 3.02, .8)
    P(S.bell(), 3.02, .3)
    P(S.sparkle(1.4), 3.05, .25)
    P(S.riser(.5), 3.4, .3)

out = S.out[: int(SR * dur)]
peak = float(np.max(np.abs(out)))
if peak > .98:
    out *= .98 / peak
pcm = (out * (2 ** 23 - 1)).astype('<i4')
with wave.open(outp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR)
    w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
print(hook, 'peak', round(peak, 3))
