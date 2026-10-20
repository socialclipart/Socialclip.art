"""Builds the 48 kHz stereo mix for the STONE reel from cue data (same times the renderer uses)."""
import os
import json, subprocess, sys, numpy as np, librosa, soundfile as sf, scipy.signal as ss
from pathlib import Path

SR, DUR = 48000, 20.0
ROOT = Path(__file__).parent
SKILL = Path(os.environ.get('SFX_LIBRARY', ROOT / 'sfx'))  # bundled CC0 library of the sound-effects skill
K_IMP, K_RPG = ROOT / 'dl/impact-sounds/Audio', ROOT / 'dl/rpg-audio/Audio'
MX = ROOT / 'dl/mixkit'
N = int(SR * DUR)

def load(p):
    y, _ = librosa.load(str(p), sr=SR, mono=True)
    return y

def onset_offset(y):
    a = np.abs(y); thr = a.max() * .3
    return max(0, int(np.argmax(a > thr)) - int(.004 * SR))

def peak_offset(y):
    env = ss.filtfilt(*ss.butter(2, 20 / (SR / 2)), np.abs(y))
    return int(np.argmax(env))

# (time, file, gain dB, align, pan, max length s, desc)
CUES = [
    (0.33, K_IMP / 'impactPlank_medium_000.ogg', -4, 'onset', 0, .5, 'stone hits table (wood body)'),
    (0.33, K_IMP / 'impactGeneric_light_000.ogg', -6, 'onset', 0, .3, 'stone hits table (click)'),
    (0.33, K_IMP / 'impactMining_000.ogg', -16, 'onset', 0, .25, 'stone hits table (stone grit)'),
    (0.486, K_IMP / 'impactGeneric_light_002.ogg', -15, 'onset', 0, .2, 'small bounce'),
    (3.28, SKILL / 'kit/click.ogg', -9, 'onset', .15, None, 'cursor selects stone'),
    (3.31, SKILL / 'kit/tick.ogg', -14, 'onset', .15, None, 'selection box'),
    (3.74, SKILL / 'transition/fs-702773-swipe-wav.ogg', -16, 'onset', -.2, None, 'grid draws in'),
    (4.21, SKILL / 'click/kenney-interface-click-001.ogg', -10, 'onset', .4, None, 'click black swatch'),
    (4.21, SKILL / 'kit/whoosh.ogg', -9, 'onset', .2, None, 'black floods frame'),
    (4.25, SKILL / 'impact/kenney-impact-impactsoft-heavy-000.ogg', -14, 'onset', 0, None, 'flood weight'),
    (4.44, SKILL / 'pop/kenney-interface-pluck-001.ogg', -12, 'onset', .4, None, 'champagne swatch'),
    (4.67, SKILL / 'pop/kenney-interface-pluck-002.ogg', -12, 'onset', .4, None, 'warm white swatch'),
    (5.14, SKILL / 'click/kenney-interface-select-001.ogg', -13, 'onset', -.2, None, 'letter S'),
    (5.256, SKILL / 'click/kenney-interface-select-002.ogg', -13, 'onset', -.1, None, 'letter T'),
    (5.372, SKILL / 'click/kenney-interface-select-003.ogg', -13, 'onset', 0, None, 'letter O'),
    (5.488, SKILL / 'click/kenney-interface-select-001.ogg', -13, 'onset', .1, None, 'letter N'),
    (5.604, SKILL / 'click/kenney-interface-select-002.ogg', -12, 'onset', .2, None, 'letter E'),
    (5.62, SKILL / 'ding/kenney-interface-glass-001.ogg', -13, 'onset', 0, None, 'wordmark locks'),
    (6.05, SKILL / 'whoosh/fs810485.ogg', -9, 'peak', 0, None, 'podium rises'),
    (6.47, SKILL / 'impact/kenney-impact-impactsoft-heavy-001.ogg', -10, 'onset', 0, None, 'podium meets stone'),
    (6.6, SKILL / 'whoosh/fs-264777-swoosh.ogg', -20, 'onset', 0, 1.6, 'camera orbit'),
    (8.02, MX / '1530.mp3', -6, 'onset', 0, None, 'box net slides in'),
    (8.39, K_RPG / 'bookFlip1.ogg', -4, 'peak', .1, .45, 'front flap folds'),
    (8.62, K_RPG / 'bookFlip2.ogg', -4, 'peak', .3, .45, 'right flap'),
    (8.85, K_RPG / 'bookFlip3.ogg', -7, 'peak', -.1, .45, 'back flap'),
    (9.08, K_RPG / 'bookFlip1.ogg', -4, 'peak', -.3, .45, 'left flap'),
    (9.45, SKILL / 'transition/fs-816262-broomstick-whoosh-3-quiet-okm1.ogg', -10, 'onset', 0, None, 'lid descends'),
    (9.78, K_RPG / 'bookPlace1.ogg', -8, 'onset', 0, None, 'lid closes'),
    (9.78, SKILL / 'impact/kenney-impact-impactsoft-heavy-000.ogg', -15, 'onset', 0, None, 'lid weight'),
    (9.92, SKILL / 'transition/fs-786514-swoosh-v2.ogg', -14, 'onset', 0, None, 'website slides up'),
    (10.4, SKILL / 'transition/kenney-interface-scroll-001.ogg', -15, 'onset', 0, None, 'scroll'),
    (10.7, SKILL / 'transition/kenney-interface-scroll-002.ogg', -17, 'onset', 0, None, 'scroll'),
    (11.0, SKILL / 'transition/kenney-interface-scroll-001.ogg', -20, 'onset', 0, None, 'scroll'),
    (11.64, SKILL / 'kit/click.ogg', -8, 'onset', 0, None, 'add to cart click'),
    (11.70, SKILL / 'ding/kenney-interface-confirmation-001.ogg', -13, 'onset', .2, None, 'added'),
    (11.94, SKILL / 'whoosh/fs830856.ogg', -10, 'onset', 0, None, 'website drops away'),
    (12.57, SKILL / 'impact/fs-177242-cinematic-impact.ogg', -14, 'onset', 0, 1.4, 'Millionen Jahre'),
    (14.0, SKILL / 'kit/riser.ogg', -12, 'peak', 0, None, 'build into the hit'),
    (14.0, SKILL / 'impact/fs-222517-dramatic-hit.ogg', -8, 'onset', 0, 2.6, 'campaign hit'),
    (14.46, SKILL / 'ding/fs-349504-triangle-open-04.ogg', -20, 'onset', .25, 1.5, 'glint'),
    (15.39, SKILL / 'ding/kenney-interface-glass-002.ogg', -21, 'onset', -.25, None, 'glint'),
    (16.31, SKILL / 'ding/kenney-interface-glass-001.ogg', -21, 'onset', .2, None, 'glint'),
    (18.55, SKILL / 'pop/kenney-interface-pluck-001.ogg', -13, 'onset', 0, None, 'question pops'),
]
VO = [(0.26, ROOT / 'audio/vo/k_vo1.wav', 0), (17.02, ROOT / 'audio/vo/k_vo2.wav', 0)]  # kikiri-tts voice 'martin'
MUSIC = ROOT / 'dl/music/371.mp3'
MUSIC_SEGS = [(3.0, 3.68, 11.0), (14.0, 29.618, 3.0)]  # (video start, track start, length) — hard stop at 17.0

def place(buf, y, t, gain_db, pan=0.):
    s = int(round(t * SR)); g = 10 ** (gain_db / 20)
    if s < 0: y = y[-s:]; s = 0
    e = min(N, s + len(y)); y = y[:e - s] * g
    l, r = np.cos((pan + 1) * np.pi / 4), np.sin((pan + 1) * np.pi / 4)
    buf[0, s:e] += y * l * 1.414; buf[1, s:e] += y * r * 1.414

def fade(y, fin=.003, fout=.02):
    y = y.copy(); a, b = int(fin * SR), int(fout * SR)
    if a: y[:a] *= np.linspace(0, 1, a)
    if b: y[-b:] *= np.linspace(1, 0, b)
    return y

def lufs_gain(y, target):
    # quick K-weighted-ish loudness estimate via ffmpeg would be exact; rough RMS match is enough for stems
    rms = np.sqrt(np.mean(y ** 2) + 1e-12); return target - 20 * np.log10(rms)

sfx, vo, mus, room = (np.zeros((2, N)) for _ in range(4))
log = []
for t, f, g, al, pan, mx, desc in CUES:
    y = load(f)
    off = onset_offset(y) if al == 'onset' else peak_offset(y)
    if mx: y = fade(y[:off + int(mx * SR)], 0, .06)
    place(sfx, fade(y, 0, .01), t - off / SR, g, pan)
    log.append({'t': t, 'file': f.name, 'gain_db': g, 'align': al, 'desc': desc, 'src': str(f.relative_to(ROOT) if ROOT in f.parents else 'sound-effects/sfx/' + str(f.relative_to(SKILL)))})

# voice: clean broadcast chain via ffmpeg, then place
for t, f, g in VO:
    proc = ROOT / 'cache' / (f.stem + '_proc.wav')
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-i', str(f), '-af',
                    'aresample=48000,highpass=f=90,equalizer=f=180:t=q:w=1.2:g=2.5,equalizer=f=3200:t=q:w=1:g=3,equalizer=f=7000:t=q:w=1:g=-2,acompressor=threshold=-22dB:ratio=3:attack=4:release=90:makeup=2',
                    '-ac', '1', str(proc)], check=True)
    y = load(proc); y = y / (np.abs(y).max() + 1e-9) * .5
    place(vo, fade(y, .002, .03), t, g)

# music: two segments, hard stop
for vs, ts, ln in MUSIC_SEGS:
    y, _ = librosa.load(str(MUSIC), sr=SR, mono=False, offset=ts, duration=ln)
    if y.ndim == 1: y = np.stack([y, y])
    y = y * np.r_[np.linspace(0, 1, int(.006 * SR)), np.ones(y.shape[1] - int(.009 * SR)), np.linspace(1, 0, int(.003 * SR))][None, :y.shape[1]]
    s = int(vs * SR); mus[:, s:s + y.shape[1]] += y
# shape: intro sits low, build swells into 14.0, climax full
tt = np.arange(N) / SR
env = np.interp(tt, [3.0, 6.0, 10.0, 12.5, 13.99, 14.0, 17.0], [.8, .85, .95, 1.05, 1.3, 1.0, 1.0])
mus *= env[None]

# room tone under the boring table scenes only
rt = load(SKILL / 'ambience/fs-426767-apartment-room-tone-wav.ogg')
rt = np.tile(rt, 2)[:N]
renv = np.interp(tt, [0, 2.9, 3.05, 16.999, 17.0, 20], [1, 1, 0, 0, 1, 1])
room[0] = room[1] = rt * renv

# levels: VO > SFX > music; duck music under VO (music only overlaps VO in theory; keeps rule)
def rms_db(x, a, b): seg = x[:, int(a * SR):int(b * SR)]; return 10 * np.log10(np.mean(seg ** 2) + 1e-12)
a, b = int(3.0 * SR), int(14.0 * SR)
mus[:, a:b] *= 10 ** ((-24 - rms_db(mus, 3.0, 13.9)) / 20)
mus[:, b:] *= 10 ** ((-15.5 - rms_db(mus, 14.0, 17.0)) / 20)
room *= 10 ** ((-50 - rms_db(room, 0, 3)) / 20)
vo *= 10 ** ((-15 - rms_db(vo, .5, 1.96)) / 20)
mix = (vo if os.environ.get("NO_VO") is None else 0) + sfx + mus + room
mix *= 10 ** (float(sys.argv[1]) / 20) if len(sys.argv) > 1 else 1
(ROOT / 'audio').mkdir(exist_ok=True)
sf.write(ROOT / 'audio/mix_pre.wav', mix.T.astype(np.float32), SR, subtype='FLOAT')
for name, x in [('vo', vo), ('sfx', sfx), ('music', mus)]: sf.write(ROOT / f'audio/stem_{name}.wav', x.T.astype(np.float32), SR, subtype='FLOAT')
json.dump({'cues': log, 'vo': [(t, f.name) for t, f, _ in VO], 'music_segments': MUSIC_SEGS}, open(ROOT / 'audio/cues.json', 'w'), indent=1)
print('peak', 20 * np.log10(np.abs(mix).max()))
