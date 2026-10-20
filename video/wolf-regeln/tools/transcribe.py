"""Wort-Zeitstempel mit faster-whisper (lokal). Aufruf: whisper-venv/bin/python -I transcribe.py <audio> <out.json>"""
import json, subprocess, sys
import numpy as np
from faster_whisper import WhisperModel

audio, out = sys.argv[1], sys.argv[2]
m = WhisperModel('small', device='cpu', compute_type='int8', download_root='/root/.cache/motion-video-director/models/whisper')
pcm = subprocess.run(['ffmpeg', '-v', 'error', '-i', audio, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
samples = np.frombuffer(pcm, np.int16).astype(np.float32) / 32768
segs, info = m.transcribe(samples, language='de', word_timestamps=True, vad_filter=False, beam_size=5)
words = []
for s in segs:
    for w in s.words:
        words.append({'w': w.word.strip(), 'a': round(w.start, 3), 'b': round(w.end, 3), 'p': round(w.probability, 3)})
json.dump({'duration': info.duration, 'words': words}, open(out, 'w'), ensure_ascii=False, indent=1)
print(len(words), 'words')
print(' '.join(w['w'] for w in words))
