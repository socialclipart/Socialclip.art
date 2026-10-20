"""Prozedurale SFX-Bausteine (übernommen aus dem Stift-Projekt)."""
import json
import wave
from pathlib import Path

import numpy as np

SR = 48000
DUR = 42.0
rng = np.random.default_rng(1234)

out = None


def reset(dur):
    global out
    out = np.zeros((int(SR * dur) + SR, 2))
    return out


def tt(d):
    return np.arange(int(SR * d)) / SR


def place(sig, t0, gain=1.0, pan=0.0):
    """Mono-Signal bei t0 einmischen; pan -1..1 (gleiche Leistung)."""
    i = int(t0 * SR)
    sig = sig[: max(0, out.shape[0] - i)] * gain
    a = (pan + 1) * np.pi / 4
    out[i:i + len(sig), 0] += sig * np.cos(a)
    out[i:i + len(sig), 1] += sig * np.sin(a)


def bandpass(x, lo, hi):
    X = np.fft.rfft(x)
    f = np.fft.rfftfreq(len(x), 1 / SR)
    m = ((f >= lo) & (f <= hi)).astype(float)
    # weiche Flanken
    m = np.convolve(m, np.hanning(31) / np.hanning(31).sum(), mode='same')
    return np.fft.irfft(X * m, len(x))


def sweep_lp(x, f0, f1):
    """Ein-Pol-Tiefpass mit gleitender Grenzfrequenz (exponentiell)."""
    n = len(x)
    fc = f0 * (f1 / f0) ** (np.arange(n) / max(1, n - 1))
    a = 1 - np.exp(-2 * np.pi * fc / SR)
    y = np.empty(n); s = 0.0
    for i in range(n):
        s += a[i] * (x[i] - s); y[i] = s
    return y


def norm(x, peak=1.0):
    m = np.max(np.abs(x)) or 1
    return x / m * peak


def fade(x, fi=0.003, fo=0.01):
    n = len(x); a = int(fi * SR); b = int(fo * SR)
    if a: x[:a] *= np.linspace(0, 1, a)
    if b: x[-b:] *= np.linspace(1, 0, b)
    return x


def noise(d):
    return rng.standard_normal(int(SR * d))


# ---------- Bausteine ----------
def click():
    s = np.zeros(int(SR * .06))
    for off, g in ((0, 1), (.018, .7)):
        n = bandpass(noise(.006), 2500, 9000) * np.exp(-tt(.006) / .0012)
        tone = np.sin(2 * np.pi * 3100 * tt(.006)) * np.exp(-tt(.006) / .002) * .5
        i = int(off * SR); s[i:i + len(n)] += (n * .7 + tone) * g
    return norm(s)


def thump(f0=110, f1=45, d=.4):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f1 + (f0 - f1) * np.exp(-t / .05)) / SR
    return fade(np.sin(ph) * np.exp(-t / (d / 4)))


def slam():
    body = thump(140, 55, .35)
    slap = bandpass(noise(.35), 300, 2500) * np.exp(-tt(.35) / .03)
    return norm(body * .9 + norm(slap) * .6)


def strike():
    d = .14
    n = sweep_lp(bandpass(noise(d), 900, 7000), 1500, 6000)
    am = 0.6 + 0.4 * np.sin(2 * np.pi * 90 * tt(d))
    return fade(norm(n * am * np.hanning(len(n)) ** .4), .002, .03)


def whoosh(d=.6, f0=300, f1=2500, peak_at=.6):
    n = noise(d)
    y = sweep_lp(n, f0, f1)
    env = np.interp(tt(d), [0, d * peak_at, d], [0, 1, 0]) ** 1.5
    return norm(y * env)


def boom(d=1.6):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(36 + 60 * np.exp(-t / .12)) / SR
    sub = np.sin(ph) * np.exp(-t / .45)
    tail = sweep_lp(noise(d), 600, 80) * np.exp(-t / .5)
    return fade(norm(sub + norm(tail) * .35))


def paper_slide(d=.75):
    n = bandpass(noise(d), 700, 4500)
    fr = np.abs(np.convolve(rng.standard_normal(len(n)), np.ones(400) / 400, 'same'))
    env = np.interp(tt(d), [0, .08, d * .7, d], [0, 1, .8, 0])
    return norm(n * (0.4 + fr * 8) * env)


def scribble(d=.65):
    n = bandpass(noise(d), 2500, 9000)
    am = np.clip(np.sin(2 * np.pi * 11 * tt(d)) + .3, 0, None)
    env = np.interp(tt(d), [0, .05, d - .1, d], [0, 1, 1, 0])
    return norm(n * am * env)


def pop():
    t = tt(.09)
    ph = 2 * np.pi * np.cumsum(500 + 900 * (t / .09)) / SR
    return fade(np.sin(ph) * np.exp(-t / .025))


def roll(d=.7):
    t = tt(d)
    rate = 34 - 18 * t / d
    ph = np.cumsum(rate) / SR
    pulses = (np.sin(2 * np.pi * ph) > .92).astype(float)
    n = bandpass(noise(d), 1800, 7000) * (0.25 + pulses)
    return fade(norm(n * np.interp(t, [0, .1, d], [0, 1, .7])))


def tink(f=2100, d=1.1):
    t = tt(d)
    s = sum(a * np.sin(2 * np.pi * f * r * t) * np.exp(-t / (dec)) for r, a, dec in
            ((1, 1, .35), (1.62, .6, .25), (2.71, .4, .15), (4.05, .25, .1)))
    return fade(norm(s), .001, .05)


def tick():
    t = tt(.07)
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t / .015)
    n = bandpass(noise(.07), 1500, 6000) * np.exp(-t / .004)
    return fade(norm(body * .8 + norm(n) * .6))


def riser(d=1.05):
    t = tt(d)
    n = sweep_lp(noise(d), 200, 5000)
    ph = 2 * np.pi * np.cumsum(180 * (4.5 ** (t / d))) / SR
    tone = np.sin(ph) * .25
    env = (t / d) ** 2
    return fade(norm((norm(n) + tone) * env), .01, .02)


def sparkle(d=1.2):
    t = tt(d); s = np.zeros_like(t)
    for _ in range(14):
        f = rng.uniform(3000, 9000); st = rng.uniform(0, d * .6)
        e = np.where(t >= st, np.exp(-(t - st) / .12), 0)
        s += np.sin(2 * np.pi * f * t) * e * rng.uniform(.3, 1)
    return fade(norm(s))


def cash_counter(d=1.25):
    t = tt(d); s = np.zeros_like(t)
    k = 0.0
    while k < d - .02:
        i = int(k * SR); b = bandpass(noise(.012), 2000, 9000) * np.exp(-tt(.012) / .003)
        s[i:i + len(b)] += b * rng.uniform(.6, 1)
        k += 1 / 26 + rng.uniform(-.004, .004)
    return fade(norm(s * np.interp(t, [0, .05, d - .15, d], [0, 1, 1, 0])))


def flutter(d=2.0):
    n = bandpass(noise(d), 400, 3000)
    am = np.clip(np.sin(2 * np.pi * 7 * tt(d) + np.sin(2 * np.pi * .7 * tt(d)) * 3), 0, None) ** 2
    return norm(n * am * np.interp(tt(d), [0, .3, d - .4, d], [0, 1, 1, 0]))


def ding():
    t = tt(.7)
    s = np.sin(2 * np.pi * 1318.5 * t) * np.exp(-t / .12)
    t2 = np.where(t >= .09, t - .09, 0)
    s += np.where(t >= .09, np.sin(2 * np.pi * 1760 * t2) * np.exp(-t2 / .25), 0)
    return fade(norm(s))


def buzzer(d=.32):
    t = tt(d)
    s = np.sign(np.sin(2 * np.pi * 196 * t)) * .5 + np.sign(np.sin(2 * np.pi * 207 * t)) * .5
    s = bandpass(s, 100, 3000)
    return fade(norm(s), .005, .05)


def bell():
    """Handelsglocke: drei schnelle Schläge, inharmonische Teiltöne."""
    d = 2.6; t = tt(d); s = np.zeros_like(t)
    for k, g in ((0, 1), (.13, .8), (.26, .9)):
        tk = np.where(t >= k, t - k, 0)
        on = (t >= k).astype(float)
        for r, a, dec in ((1, 1, 1.1), (2.0, .55, .8), (2.76, .45, .6), (5.4, .25, .3), (8.93, .12, .15)):
            s += on * g * a * np.sin(2 * np.pi * 760 * r * tk) * np.exp(-tk / dec)
        s += on * g * bandpass(np.concatenate([noise(.004), np.zeros(len(t) - int(.004 * SR))]), 2000, 9000) * .6
    return fade(norm(s), .001, .1)


def sub_drop(d=1.1):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(32 + 40 * np.exp(-t / .2)) / SR
    return fade(norm(np.sin(ph) * np.exp(-t / .5)))


