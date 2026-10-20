"""SFX für eine Wolf-Regel aus ihrer Zeitachse.
Aufruf: python3 -I tools/sfx_series.py <timeline.json> <out.wav>"""
import json
import sys
import wave
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import sfxlib as S  # noqa: E402

TL = json.loads(Path(sys.argv[1]).read_text())
S.rng = np.random.default_rng(100 + TL['n'])
S.reset(TL['dur'])
L = TL['lines']
cue = {l['fx']: l for l in L if l.get('fx')}
P = S.place

# Intro: Handelsglocke, Einschlag der Nummer, Whoosh zum Titel
intro, title = L[0], cue['title']
P(S.bell(), .12, .32)
P(S.boom(1.6), intro['a'] + .35, .5)
P(S.sparkle(1.1), intro['a'] + .4, .12)
P(S.whoosh(.5, 300, 3000, .8), title['a'] - .45, .26)
P(S.tick(), title['a'] + .05, .3)
if 'title2' in cue:
    P(S.tick(), cue['title2']['a'], .3)

# Satz-Rhythmus: leiser Tick beim Einblenden, Slam bei großen Zeilen, Strich bei ~rot~
for l in L:
    if l.get('fx') in ('intro', 'title', 'title2', 'outro', 'cta'):
        continue
    show = l.get('show')
    if l.get('big'):
        P(S.slam(), l['a'] - .01, .55)
    elif show:
        P(S.tick(), l['a'], .14, .1)
    if show and '~' in show:
        P(S.strike(), l['b'] - .03, .42, .15)


def at(name, off=0.0):
    return cue[name]['a'] + off if name in cue else None


def end(name):
    return cue[name]['b'] if name in cue else None


n = TL['n']
if n == 1:
    d = at('drill')
    P(S.whoosh(.45, 400, 3000, .8), d - .1, .25, .4)
    whirr = S.bandpass(S.noise(1.6), 300, 3000) * (0.6 + 0.4 * np.sin(2 * np.pi * 38 * S.tt(1.6)))
    whirr += np.sin(2 * np.pi * np.cumsum(np.full(len(whirr), 140.0)) / S.SR) * .3
    P(S.fade(S.norm(whirr), .05, .3), d + .35, .14, .3)
    P(S.thump(90, 40, .5), at('drillX'), .5)
    P(S.whoosh(.5, 2000, 300, .3), at('drillX', .5), .2)
    P(S.thump(160, 60, .3), at('hole', .02), .6)
    P(S.bandpass(S.noise(.25), 200, 2500) * np.exp(-S.tt(.25) / .05), at('hole', .02), .3)
    P(S.whoosh(.4, 2500, 600, .4), at('picture'), .2)
    P(S.tink(1500, .9), at('picture', .42), .22)
    P(S.sparkle(1.4), at('home'), .14)
elif n == 2:
    for nm in ('watch10', 'watch5', 'watch2'):
        a = at(nm)
        for k in range(3):
            P(S.click(), a + k * .25, .22, -.1)
    alarm = sum(np.sin(2 * np.pi * f * S.tt(.6)) for f in (1760, 2093)) * (np.sin(2 * np.pi * 12 * S.tt(.6)) > 0)
    P(S.fade(S.norm(alarm)), at('watch2', .05), .12)
    P(S.whoosh(.5, 300, 2500, .7), at('boring') - .1, .22)
    P(S.whoosh(.45, 600, 5000, .4), at('swipe', .02), .4, .2)
    P(S.whoosh(.7, 300, 2500, .6), at('hook') - .1, .25, -.2)
    P(S.tink(2400, .8), at('hook', .5), .2)
elif n == 3:
    for i, nm in enumerate(('shout1', 'shout2', 'shout3')):
        P(S.slam(), at(nm), .5, (-.3, .3, 0)[i])
        P(S.buzzer(.22), at(nm), .1)
    P(S.whoosh(.7, 2500, 300, .3), at('shoutX'), .22)
    for i in range(6):
        P(S.pop(), at('calm', .2 + i * .55), .2, (i % 3 - 1) * .4)
    P(S.whoosh(.5, 300, 3000, .8), at('dm') - .1, .25)
    P(S.ding(), at('dm', .3), .3, .1)
    tA, tB = at('dmText'), end('dmText')
    k = tA
    while k < tB:
        P(S.click()[: int(.012 * S.SR)], k, .1, .2)
        k += max(.05, (tB - tA) / 26)
    P(S.sparkle(1.4), at('win'), .25)
    P(S.thump(140, 60, .3), at('win'), .4)
elif n == 4:
    P(S.sparkle(1.0), at('one'), .16)
    P(S.thump(90, 40, .5), at('oneX'), .45)
    for i in range(12):
        P(S.pop(), at('calendar', .2 + i * .2), .14, ((i % 3) - 1) * .5)
    P(S.riser(2.2), at('chart'), .22)
    P(S.sparkle(1.0), at('chart', 2.2), .14)
    for nm in ('step1', 'step2', 'step3'):
        P(S.thump(150, 60, .3), at(nm), .35)
elif n == 5:
    a = at('likes')
    P(S.pop(), a, .25)
    k = a
    while k < a + 1.3:
        P(S.click()[: int(.012 * S.SR)], k, .08)
        k += .06
    pl = next(l for l in L if l.get('fx') == 'likesPop')
    burst = S.bandpass(S.noise(.5), 500, 6000) * np.exp(-S.tt(.5) / .08)
    P(S.norm(burst), pl['b'] - .15, .45)
    P(S.thump(120, 40, .4), pl['b'] - .15, .4)
    P(S.buzzer(.3), pl['b'] + .05, .1)
    for nm in ('led1', 'led2', 'led3'):
        P(S.ding(), at(nm), .18)
    P(S.cash_counter(1.2), at('led3', .3), .2)
    P(S.thump(160, 60, .3), at('last'), .45)
    P(S.sparkle(1.0), at('last'), .14)

# Outro: Logo-Einschlag, Follow-Button bzw. CTA
o = cue['outro']['a']
P(S.boom(1.8), o - .05, .45)
P(S.sparkle(1.4), o, .16)
if n < 5:
    P(S.slam(), o + .45, .35)
    P(S.pop(), o + 1.0, .3)
else:
    P(S.sub_drop(1.1), cue['cta']['a'], .5)
    P(S.tick(), cue['cta']['a'], .4)

out = S.out[: int(S.SR * TL['dur'])]
peak = float(np.max(np.abs(out)))
if peak > .98:
    out *= .98 / peak
pcm = (out * (2 ** 23 - 1)).astype('<i4')
with wave.open(sys.argv[2], 'wb') as w:
    w.setnchannels(2); w.setsampwidth(3); w.setframerate(S.SR)
    w.writeframes(pcm.reshape(-1).view(np.uint8).reshape(-1, 4)[:, :3].tobytes())
print('rule', n, 'peak', round(peak, 3))
