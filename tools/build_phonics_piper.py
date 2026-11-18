#!/usr/bin/env python3
"""Build the isolated phoneme library with one consistent female voice.

The old library was cut out of continuous CMU ARCTIC sentences. Each clip
therefore carried coarticulation from its neighbours (a /l/ sounded like
"el", a /v/ like "vuh", a /ʌ/ had sentence intonation). Played alone they
sounded like fragments of words, not phonemes.

This script synthesises every phoneme from a phoneme-level neural TTS
(Piper, LJSpeech single female speaker, public-domain dataset). Piper gives
us the exact phoneme boundaries, so each WAV contains only the target
phoneme plus a few milliseconds of silence. All clips come from the same
speaker and have a flat, controlled pitch.

Requirements:  .venv with piper-tts and onnx
  python3 -m venv .venv
  .venv/bin/pip install piper-tts onnx

The voice files live in tools/piper/. Download with:
  curl -L -o tools/piper/en_US-ljspeech-medium.onnx \
    https://hf-mirror.com/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx
  curl -L -o tools/piper/en_US-ljspeech-medium.onnx.json \
    https://hf-mirror.com/rhasspy/piper-voices/resolve/main/en/en_US/ljspeech/medium/en_US-ljspeech-medium.onnx.json

Run: .venv/bin/python tools/build_phonics_piper.py
"""
import argparse
import math
import os
import wave

import numpy as np
from piper import PiperVoice, SynthesisConfig

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEFAULT_VOICE = os.path.join(ROOT, 'tools', 'piper', 'en_US-ljspeech-medium.onnx')
DEFAULT_OUT = os.path.join(ROOT, 'web', 'assets', 'phonics')

# file: (eSpeak phoneme sequence, target seconds, minimum, maximum)
TARGETS = {
    # vowels and diphthongs
    'ee': ('iː', 0.26, 0.18, 0.40),
    'ih': ('ɪ', 0.18, 0.12, 0.28),
    'eh': ('ɛ', 0.20, 0.14, 0.30),
    'aah': ('æ', 0.22, 0.15, 0.32),
    'ah': ('ɑː', 0.24, 0.16, 0.36),
    'lot': ('ɑ', 0.20, 0.14, 0.30),
    'aw': ('ɔː', 0.24, 0.16, 0.36),
    'foot': ('ʊ', 0.18, 0.12, 0.28),
    'oo': ('uː', 0.24, 0.16, 0.36),
    'u_short': ('u', 0.14, 0.09, 0.24),
    'uh': ('ʌ', 0.20, 0.14, 0.30),
    'er': ('ɜː', 0.22, 0.15, 0.34),
    'schwa': ('ə', 0.14, 0.09, 0.24),
    'ay': ('eɪ', 0.30, 0.20, 0.42),
    'eye': ('aɪ', 0.30, 0.20, 0.42),
    'oy': ('ɔɪ', 0.30, 0.20, 0.42),
    'ow': ('aʊ', 0.30, 0.20, 0.42),
    'oh': ('oʊ', 0.30, 0.20, 0.42),
    'i': ('i', 0.16, 0.10, 0.26),
    # r-coloured vowels
    'ear': ('ɪɹ', 0.28, 0.18, 0.40),
    'air': ('ɛɹ', 0.28, 0.18, 0.40),
    'oor': ('ʊɹ', 0.28, 0.18, 0.40),
    'er_r': ('ɜːɹ', 0.28, 0.18, 0.40),
    'ah_r': ('ɑːɹ', 0.28, 0.18, 0.40),
    'aw_r': ('ɔːɹ', 0.28, 0.18, 0.40),
    'er_schwa': ('ɚ', 0.18, 0.12, 0.28),
    # stops
    'p': ('p', 0.10, 0.06, 0.18),
    'b': ('b', 0.10, 0.06, 0.18),
    't': ('t', 0.10, 0.06, 0.18),
    'd': ('d', 0.10, 0.06, 0.18),
    'k': ('k', 0.10, 0.06, 0.18),
    'g': ('ɡ', 0.10, 0.06, 0.18),
    # fricatives
    'f': ('f', 0.14, 0.09, 0.24),
    'v': ('v', 0.14, 0.09, 0.24),
    's': ('s', 0.15, 0.09, 0.24),
    'z': ('z', 0.15, 0.09, 0.24),
    'th': ('θ', 0.15, 0.09, 0.24),
    'dh': ('ð', 0.15, 0.09, 0.24),
    'sh': ('ʃ', 0.16, 0.10, 0.26),
    'zh': ('ʒ', 0.16, 0.10, 0.26),
    'h': ('h', 0.12, 0.08, 0.22),
    # affricates
    'ch': ('tʃ', 0.18, 0.12, 0.28),
    'j': ('dʒ', 0.18, 0.12, 0.28),
    # nasals and approximants
    'm': ('m', 0.15, 0.10, 0.24),
    'n': ('n', 0.15, 0.10, 0.24),
    'ng': ('ŋ', 0.15, 0.10, 0.24),
    'l': ('l', 0.16, 0.10, 0.26),
    'r': ('ɹ', 0.16, 0.10, 0.26),
    'w': ('w', 0.16, 0.10, 0.26),
    'y': ('j', 0.14, 0.09, 0.24),
}

LENGTH_SCALES = [1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0, 6.0, 8.0]


def measure(alignments):
    """Return (duration, nonsilent alignment index range) for a raw block."""
    pos = 0
    start = end = None
    for a in alignments:
        dur = int(a.num_samples)
        if a.phoneme not in ('^', '$'):
            if start is None:
                start = pos
            end = pos + dur
        pos += dur
    if start is None:
        return 0.0, 0, 0
    return (end - start) / 22050.0, start, end


def synth(v, seq, ls):
    chunks = list(v.synthesize(
        '[[' + seq + ']]',
        SynthesisConfig(length_scale=ls, noise_scale=0.667, noise_w_scale=0.8),
        include_alignments=True,
    ))
    if not chunks:
        return None
    c = chunks[0]
    align = c.phoneme_alignments or []
    dur, start, end = measure(align)
    return c.audio_float_array, dur, start, end


def process(v, name, seq, target, lo, hi, out_dir):
    best = None
    for ls in LENGTH_SCALES:
        got = synth(v, seq, ls)
        if not got:
            continue
        audio, dur, start, end = got
        score = abs(dur - target)
        if lo <= dur <= hi:
            score -= 1.0  # prefer in-range candidates
        if best is None or score < best[0]:
            best = (score, ls, audio, dur, start, end)
    if best is None:
        raise RuntimeError(f'could not synthesise {name} /{seq}/')
    _, ls, audio, dur, start, end = best
    sr = 22050
    pad_before = int(sr * 0.003)
    pad_after = int(sr * 0.010)
    a = max(0, start - pad_before)
    b = min(len(audio), end + pad_after)
    x = np.array(audio[a:b], dtype=np.float32, copy=True)
    x -= float(x.mean())
    # gentle fades keep the clip clean when played in a chain
    fi = min(len(x), int(sr * 0.004))
    fo = min(len(x), int(sr * 0.010))
    if fi:
        x[:fi] *= np.linspace(0.0, 1.0, fi, dtype=np.float32)
    if fo:
        x[-fo:] *= np.linspace(1.0, 0.0, fo, dtype=np.float32)
    rms = float(np.sqrt(np.mean(x * x))) if len(x) else 0.0
    if rms < 1e-4:
        raise RuntimeError(f'{name} /{seq}/ is silent')
    gain = min(8.0, 0.12 / rms)
    y = x * gain
    peak = float(np.max(np.abs(y))) if len(y) else 0.0
    if peak > 0.85:
        y *= 0.95 / peak
    y = np.clip(y, -0.95, 0.95)
    path = os.path.join(out_dir, name + '.wav')
    with wave.open(path, 'wb') as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(np.clip(y * 32767, -32768, 32767).astype('<i2').tobytes())
    return {
        'name': name, 'seq': seq, 'ls': ls, 'dur': len(y) / sr,
        'peak': float(np.max(np.abs(y))), 'rms': float(np.sqrt(np.mean(y * y))),
        'gain': gain,
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--voice', default=DEFAULT_VOICE)
    ap.add_argument('--out', default=DEFAULT_OUT)
    ap.add_argument('--only', nargs='*', help='only build these files')
    args = ap.parse_args()
    if not os.path.exists(args.voice):
        raise SystemExit('missing voice: ' + args.voice)
    os.makedirs(args.out, exist_ok=True)
    v = PiperVoice.load(args.voice, include_alignments=True)
    keys = args.only or list(TARGETS)
    print(f'{"file":<10} {"seq":<6} {"ls":>4} {"dur":>6} {"peak":>5} {"rms":>5} {"gain":>5}')
    for name in keys:
        seq, target, lo, hi = TARGETS[name]
        r = process(v, name, seq, target, lo, hi, args.out)
        print(f'{r["name"]:<10} {r["seq"]:<6} {r["ls"]:>4} '
              f'{r["dur"]:>6.3f} {r["peak"]:>5.2f} {r["rms"]:>5.3f} {r["gain"]:>5.2f}')
    print('done', len(keys), 'files ->', args.out)


if __name__ == '__main__':
    main()
