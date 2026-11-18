#!/usr/bin/env python3
"""Per-entry IPA/audio for homographs that occur with different meanings.

The same spelling can have different pronunciations in different units
(read present /riːd/ vs past /red/, close verb /kloʊz/ vs adjective
/kloʊs/). This script sets the IPA and a distinct audio key for those
entries and synthesises the matching clip.
"""
import json
import os
import re
import subprocess
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'web', 'assets', 'pep_all.js')
AUDIO = os.path.join(ROOT, 'web', 'assets', 'audio', 'us', 'words')

SPECIAL = {
    ('p6x2', 'read'): ('/red/', 'read_past', 'red', 'direct'),
    ('p7x2', 'close'): ('/kloʊs/', 'close_adj', 'close, friend', 'trim'),
    ('p8s7', 'research'): ('/ˈriːsɜːrtʃ/', 'research', 'research, paper', 'trim'),
}


def synth(text):
    td = tempfile.mkdtemp(prefix='esp-')
    raw = os.path.join(td, 'raw.wav')
    subprocess.run(['say', '-v', 'Samantha', '-r', '150', '-o', raw,
                    '--file-format=WAVE', '--data-format=LEI16@22050', text],
                   check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    with wave.open(raw, 'rb') as w:
        sr = w.getframerate()
        d = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
        if w.getnchannels() > 1:
            d = d.reshape(-1, w.getnchannels())[:, 0]
    return d, sr


def segments(d, sr):
    hop = int(sr * 0.01)
    n = len(d) // hop
    e = np.array([np.sqrt(np.mean(d[i * hop:(i + 1) * hop] ** 2)) for i in range(n)])
    thr = max(0.01, e.max() * 0.05)
    v = e > thr
    out = []
    i = 0
    while i < n:
        if v[i]:
            j = i
            while j < n and (v[j] or (j + 5 < n and v[j:j + 5].any())):
                j += 1
            if (j - i) * hop > int(sr * 0.05):
                out.append((i * hop, j * hop))
            i = j
        else:
            i += 1
    return out


def save(d, sr, path):
    peak = float(np.max(np.abs(d))) or 1.0
    active = np.where(np.abs(d) > peak * 0.012)[0]
    a = max(0, int(active[0]) - int(sr * 0.01))
    b = min(len(d), int(active[-1]) + int(sr * 0.03))
    d = d[a:b]
    f = int(sr * 0.008)
    d[:f] *= np.linspace(0, 1, f)
    d[-f:] *= np.linspace(1, 0, f)
    d = d / max(0.05, float(np.max(np.abs(d)))) * 0.8
    with tempfile.TemporaryDirectory() as td:
        wav = os.path.join(td, 'o.wav')
        with wave.open(wav, 'wb') as w:
            w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
            w.writeframes(np.clip(d * 32767, -32768, 32767).astype('<i2').tobytes())
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', wav, path],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    data = open(DATA, encoding='utf-8').read()
    units = json.loads(data[data.index('['):data.rindex(']') + 1])
    for unit in units:
        for word in unit['words']:
            key = (unit['id'], word['w'].lower())
            if key not in SPECIAL:
                continue
            ipa, audio, text, mode = SPECIAL[key]
            word['ipa'] = ipa
            word['audio'] = audio
            d, sr = synth(text)
            if mode == 'trim':
                segs = segments(d, sr)
                if len(segs) >= 2:
                    d = d[:segs[0][1] + int(sr * 0.02)]
            save(d, sr, os.path.join(AUDIO, audio + '.m4a'))
            print(key, ipa, audio, round(len(d) / sr, 3))
    open(DATA, 'w', encoding='utf-8').write(
        'const PEP_ALL_UNITS = ' + json.dumps(units, ensure_ascii=False, indent=2) + ';\n')


if __name__ == '__main__':
    main()
