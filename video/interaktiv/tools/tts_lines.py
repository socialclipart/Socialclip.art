"""Einzelne Sprecher-Zeilen mit Piper (Thorsten, CC0) -> audio/vo/<id>.wav + audio/vo/lines.json (Längen).
Aufruf: whisper-venv/bin/python -I tools/tts_lines.py"""
import json, subprocess, wave
from pathlib import Path
import numpy as np
from piper import PiperVoice, SynthesisConfig

LINES = {
    'slot_stopp': 'Stopp!',
    'slot_pause': 'Drück auf Pause. Genau jetzt.',
    'slot_was': 'Was hast du bekommen?',
    'slot_komm': 'Schreib es in die Kommentare.',
    'gold_eins': 'Nur ein Prozent schafft das.',
    'gold_regel': 'Halte das Video an, sobald das Logo golden wird.',
    'gold_bereit': 'Bereit? Drei. Zwei. Eins.',
    'gold_und': 'Und? Hast du es geschafft?',
    'gold_komm': 'Schreib Gold in die Kommentare.',
}
out = Path('audio/vo'); out.mkdir(parents=True, exist_ok=True)
v = PiperVoice.load('/root/.cache/motion-video-director/models/piper/de_DE-thorsten-high.onnx'); SR = v.config.sample_rate
cfg = SynthesisConfig(length_scale=1.0, noise_scale=.55, noise_w_scale=.7)
meta = {}
for k, txt in LINES.items():
    a = np.concatenate([np.frombuffer(c.audio_int16_bytes, np.int16) for c in v.synthesize(txt, cfg)])
    idx = np.where(np.abs(a) > 200)[0]; a = a[max(0, idx[0] - 150): idx[-1] + 300]
    raw = out / f'{k}_raw.wav'
    with wave.open(str(raw), 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(a.tobytes())
    # tiefer, wärmer, präsenter (wie bei den Wolf-Regeln)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(raw), '-af',
        'asetrate=22050*0.92,aresample=48000,atempo=1.0869565,highpass=f=60,equalizer=f=140:t=q:w=1:g=3,'
        'equalizer=f=3500:t=q:w=1.2:g=2,equalizer=f=7500:t=q:w=1:g=-2,acompressor=threshold=-20dB:ratio=3:attack=5:release=100:makeup=2',
        '-c:a', 'pcm_s24le', str(out / f'{k}.wav')], check=True)
    meta[k] = {'text': txt, 'dur': round(len(a) / SR, 3)}
    print(k, meta[k]['dur'])
json.dump(meta, open(out / 'lines.json', 'w'), ensure_ascii=False, indent=1)
