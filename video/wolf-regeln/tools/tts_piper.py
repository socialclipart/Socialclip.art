"""Piper-TTS (lokal): erzeugt pro Regel eine WAV + Satz-Zeitstempel.
Aufruf: whisper-venv/bin/python -I tts_piper.py <script.json> <outdir> <model.onnx> [speaker_id]
script.json: {"rules": [[[text, pause], ...], ...]}"""
import json, sys, wave
from pathlib import Path
import numpy as np
from piper import PiperVoice, SynthesisConfig

script, outdir = json.load(open(sys.argv[1])), Path(sys.argv[2])
outdir.mkdir(parents=True, exist_ok=True)
voice = PiperVoice.load(sys.argv[3])
spk = int(sys.argv[4]) if len(sys.argv) > 4 else None
SR = voice.config.sample_rate
cfg = SynthesisConfig(speaker_id=spk, length_scale=1.08, noise_scale=0.5, noise_w_scale=0.6)

def trim(x, thr=200):
    idx = np.where(np.abs(x) > thr)[0]
    return x[max(0, idx[0] - 200): idx[-1] + 400] if len(idx) else x

for n, rule in enumerate(script['rules'], 1):
    parts, beats, t = [np.zeros(int(.35 * SR), np.int16)], [], .35
    for text, pause in rule:
        audio = trim(np.concatenate([np.frombuffer(c.audio_int16_bytes, np.int16) for c in voice.synthesize(text, cfg)]))
        beats.append({'text': text, 'a': round(t, 3), 'b': round(t + len(audio) / SR, 3)})
        parts += [audio, np.zeros(int(pause * SR), np.int16)]
        t += len(audio) / SR + pause
    parts.append(np.zeros(int(.4 * SR), np.int16))
    pcm = np.concatenate(parts)
    with wave.open(str(outdir / f'regel{n}_raw.wav'), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
    json.dump({'sr': SR, 'duration': round(len(pcm) / SR, 3), 'sentences': beats}, open(outdir / f'regel{n}_raw.json', 'w'), ensure_ascii=False, indent=1)
    print(n, round(len(pcm) / SR, 2), 's')
