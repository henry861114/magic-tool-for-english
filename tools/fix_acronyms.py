#!/usr/bin/env python3
"""Give all-caps acronyms their own audio key and letter-name recordings.

The word audio is indexed by a lowercased slug, so "US" (美国) and "us"
(我们) shared us.m4a, and "WHO" shared who.m4a. This script writes an
`audio` field such as us_caps for acronyms and synthesises the letter names
(e.g. "U S") with the female US voice.
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

TEXTS = {
    'AI': 'A I', 'OK': 'O K', 'PE': 'P E', 'PLA': 'P L A',
    'PRC': 'P R C', 'TV': 'T V', 'UK': 'U K', 'UN': 'U N',
    'US': 'U S', 'USA': 'U S A', 'VR': 'V R', 'WHO': 'W H O',
}


def slug(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')


def trim_wav(src, dst):
    with wave.open(src, 'rb') as w:
        params = w.getparams()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype='<i2').astype(np.float32) / 32768
    if not len(data):
        raise RuntimeError('empty')
    peak = float(np.max(np.abs(data))) or 1.0
    active = np.where(np.abs(data) > peak * 0.015)[0]
    pad = int(params.framerate * 0.035)
    a = max(0, int(active[0]) - pad)
    b = min(len(data), int(active[-1]) + pad)
    data = data[a:b]
    with wave.open(dst, 'wb') as w:
        w.setparams(params)
        w.writeframes(np.clip(data * 32767, -32768, 32767).astype('<i2').tobytes())


def make(text, out):
    if os.path.exists(out) and os.path.getsize(out) > 500:
        return
    os.makedirs(os.path.dirname(out), exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        raw = os.path.join(td, 'raw.wav')
        tr = os.path.join(td, 'trim.wav')
        subprocess.run(['say', '-v', 'Samantha', '-r', '150', '-o', raw,
                        '--file-format=WAVE', '--data-format=LEI16@22050', text],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        trim_wav(raw, tr)
        subprocess.run(['afconvert', '-f', 'm4af', '-d', 'aac', '-b', '64000', tr, out],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def main():
    data = open(DATA, encoding='utf-8').read()
    units = json.loads(data[data.index('['):data.rindex(']') + 1])
    changed = 0
    for unit in units:
        for word in unit['words']:
            w = word['w']
            if w.isupper() and len(w) > 1 and w in TEXTS:
                key = slug(w) + '_caps'
                if word.get('audio') != key:
                    word['audio'] = key
                    changed += 1
                make(TEXTS[w], os.path.join(AUDIO, key + '.m4a'))
    open(DATA, 'w', encoding='utf-8').write(
        'const PEP_ALL_UNITS = ' + json.dumps(units, ensure_ascii=False, indent=2) + ';\n')
    print('audio fields', changed)


if __name__ == '__main__':
    main()
