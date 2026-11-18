#!/usr/bin/env python3
"""Regenerate audio for heteronyms with the reading used by the textbook.

Many English homographs change pronunciation with part of speech. The TTS
picks one reading for an isolated word, which is often the wrong one for the
textbook meaning. Each entry below supplies a short carrier phrase that forces
the intended reading; the target word is cut from the start of the phrase.
Homophones (read/reed, close/cloze, bass/base) are synthesised directly.
"""
import os
import re
import subprocess
import tempfile
import wave

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
AUDIO = os.path.join(ROOT, 'web', 'assets', 'audio', 'us', 'words')

# word: (text, mode)   mode 'direct' or 'trim'
TARGETS = {
    'read': ('reed', 'direct'),
    'close': ('cloze', 'direct'),
    'bass': ('base', 'direct'),
    'dr': ('Doctor', 'direct'),
    'live': ('live, in a house', 'trim'),
    'use': ('use, it', 'trim'),
    'wind': ('wind, direction', 'trim'),
    'tear': ('tear, drop', 'trim'),
    'bow': ('bow, down', 'trim'),
    'record': ('record, player', 'trim'),
    'content': ('content, area', 'trim'),
    'permit': ('permit me, please', 'trim'),
    'excuse': ('excuse, me', 'trim'),
    'produce': ('produce, goods', 'trim'),
    'increase': ('increase, sales', 'trim'),
    'decrease': ('decrease, costs', 'trim'),
    'graduate': ('graduate, from', 'trim'),
    'separate': ('separate, the eggs', 'trim'),
    'address': ('address, book', 'trim'),
    'research': ('research, paper', 'trim'),
    'object': ('object, lesson', 'trim'),
    'project': ('project, manager', 'trim'),
    'subject': ('subject, English', 'trim'),
    'present': ('present, tense', 'trim'),
    'desert': ('desert, sand', 'trim'),
    'wound': ('wound, care', 'trim'),
    'row': ('row, of seats', 'trim'),
    'sow': ('sow, seeds', 'trim'),
    'lead': ('lead, the way', 'trim'),
}


def synth(text):
    td = tempfile.mkdtemp(prefix='het-')
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


def trim_and_save(d, sr, out):
    peak = float(np.max(np.abs(d))) or 1.0
    active = np.where(np.abs(d) > peak * 0.012)[0]
    if not len(active):
        return
    a = max(0, int(active[0]) - int(sr * 0.01))
    b = min(len(d), int(active[-1]) + int(sr * 0.03))
    d = d[a:b]
    f = int(sr * 0.008)
    if len(d) > 2 * f:
        d[:f] *= np.linspace(0, 1, f)
        d[-f:] *= np.linspace(1, 0, f)
    d = d / max(0.05, float(np.max(np.abs(d)))) * 0.8
    with wave.open(out, 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
        w.writeframes(np.clip(d * 32767, -32768, 32767).astype('<i2').tobytes())


def main():
    for word, (text, mode) in TARGETS.items():
        path = os.path.join(AUDIO, word + '.m4a')
        if not os.path.exists(path):
            # some words may be stored under a different slug
            pass
        d, sr = synth(text)
        if mode == 'trim':
            wd, wsr = synth(word)
            iso = len(wd) / wsr
            segs = segments(d, sr)
            if len(segs) >= 2 and (segs[0][1] - segs[0][0]) / sr >= 0.15:
                cut = segs[0][1] + int(sr * 0.02)
            else:
                cut = min(len(d), int(iso * sr) + int(sr * 0.08))
            # never take the next word if the first segment merged
            cut = min(cut, int((iso * 1.18 + 0.04) * sr))
            d = d[:cut]
        with tempfile.TemporaryDirectory() as td:
            wav = os.path.join(td, 'o.wav')
            trim_and_save(d, sr, wav)
            subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', wav, path],
                           check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        print(word, mode, len(d) / sr)


if __name__ == '__main__':
    main()
