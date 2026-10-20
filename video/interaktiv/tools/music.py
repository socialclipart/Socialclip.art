"""Prozeduraler Beat (120 BPM, a-Moll) für die interaktiven Hooks. Kein Fremd-Sample.
Aufruf: python3 -I tools/music.py <slot|gold> <out.wav>"""
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfxlib as S  # noqa: E402

SR = S.SR
BPM = 120
BEAT = 60 / BPM
hook, outp = sys.argv[1], sys.argv[2]
# Abschnitte: intro bis drop, Beat bis brk, danach Ausklang
CFG = {
    'slot': dict(dur=13.0, drop=2.0, brk=10.0),
    'gold': dict(dur=14.0, drop=7.2, brk=11.0),
}[hook]
DUR, DROP, BRK = CFG['dur'], CFG['drop'], CFG['brk']
rng = np.random.default_rng(7)
S.rng = rng
mix = np.zeros((int(SR * (DUR + 1)), 2))


def put(sig, t0, g=1.0, pan=0.0):
    i = int(t0 * SR)
    sig = sig[: max(0, mix.shape[0] - i)] * g
    a = (pan + 1) * np.pi / 4
    mix[i:i + len(sig), 0] += sig * np.cos(a)
    mix[i:i + len(sig), 1] += sig * np.sin(a)


def tt(d):
    return np.arange(int(SR * d)) / SR


def lp1(x, fc):
    """schneller Ein-Pol-Tiefpass via FFT-Maske"""
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X / np.sqrt(1 + (f / fc) ** 4), len(x))


def kick():
    t = tt(.4)
    ph = 2 * np.pi * np.cumsum(45 + 110 * np.exp(-t / .03)) / SR
    k = np.sin(ph) * np.exp(-t / .12)
    k[:120] += np.linspace(1, 0, 120) * .6
    return np.tanh(k * 1.6)


def clap():
    s = np.zeros(int(SR * .3))
    for off in (0, .011, .022):
        b = S.bandpass(S.noise(.012), 900, 6000)
        i = int(off * SR); s[i:i + len(b)] += b
    tail = S.bandpass(S.noise(.28), 1000, 5000) * np.exp(-tt(.28) / .06)
    s[:len(tail)] += tail * .7
    return S.norm(s)


def hat(open_=False):
    d = .18 if open_ else .035
    return S.norm(S.bandpass(S.noise(d), 7000, 16000) * np.exp(-tt(d) / (d / 3)))


def bass808(f, d):
    t = tt(d)
    ph = 2 * np.pi * np.cumsum(f * (1 + .5 * np.exp(-t / .02))) / SR
    return np.tanh(np.sin(ph) * 2.2 * np.exp(-t / (d * .8))) * .9


def saw(f, t):
    return 2 * ((f * t) % 1) - 1


def pluck(f, d=.22):
    t = tt(d)
    x = saw(f, t) + saw(f * 1.005, t) * .6
    return S.fade(lp1(x * np.exp(-t / .07), 2600), .002, .03)


def pad(freqs, d):
    t = tt(d)
    x = sum(saw(f, t) + saw(f * 1.007, t) + saw(f * .993, t) for f in freqs)
    x = lp1(x, 900)
    env = np.minimum(1, t / .25) * np.minimum(1, (d - t) / .3)
    return S.norm(x) * env


NOTE = lambda n: 440 * 2 ** ((n - 69) / 12)  # noqa: E731
CHORDS = [(57, 60, 64), (53, 57, 60), (48, 52, 55), (55, 59, 62)]   # Am F C G
ROOTS = [33, 29, 36, 31]                                            # A1 F1 C2 G1

# Pad durch das ganze Stück (Akkord je Takt = 4 Schläge)
bar = 4 * BEAT
t0 = 0.0; i = 0
while t0 < DUR:
    d = min(bar, DUR - t0)
    put(pad([NOTE(n) for n in CHORDS[i % 4]], d + .3), t0, .16 if t0 < DROP else .11, (i % 2 - .5) * .3)
    t0 += bar; i += 1

# Intro: Spannung (gedämpfte Kick auf jedem Schlag, Ticken), Riser in den Drop
nb = int(DROP / BEAT)
for b in range(nb):
    put(lp1(kick(), 400), b * BEAT, .35)
    put(hat(), b * BEAT + BEAT / 2, .12, .3)
put(S.riser(min(2.0, DROP)), max(0, DROP - 2.0), .45)

# Drop bis Break: voller Beat
b = 0
while DROP + b * BEAT < BRK - 1e-6:
    tb = DROP + b * BEAT
    put(kick(), tb, .9)
    if b % 2 == 1:
        put(clap(), tb, .45)
    for h in range(2):
        put(hat(open_=(h == 1 and b % 4 == 3)), tb + h * BEAT / 2, .16, .35 if h else -.35)
    bi = int((tb - 0) / bar) % 4
    if b % 2 == 0:
        put(bass808(NOTE(ROOTS[bi]), BEAT * 1.6), tb, .55)
    # Arp in 16teln
    ch = CHORDS[bi]
    for s16 in range(4):
        n = [ch[0] + 12, ch[1] + 12, ch[2] + 12, ch[1] + 24][s16]
        put(pluck(NOTE(n)), tb + s16 * BEAT / 4, .14, (-.4, .4, -.2, .2)[s16])
    b += 1

# Break: Einschlag + Ausklang
put(S.boom(2.5), BRK, .7)
put(S.sparkle(1.4), BRK, .2)
put(kick(), BRK, .8)

out = mix[: int(SR * DUR)]
out *= .95 / max(1e-9, np.max(np.abs(out)))
pcm = (out * (2 ** 23 - 1)).astype('<i4')
with wave.open(outp, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR)
    w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
print(hook, 'music ok')
