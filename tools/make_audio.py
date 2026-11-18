#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成离线单词、例句与自然拼读音素音频（macOS say + afconvert）。

音频会写入 web/assets/audio 与 web/assets/phonics，构建 APK 时随应用打包。
"""
import os
import re
import subprocess
import tempfile
import wave
from concurrent.futures import ThreadPoolExecutor

import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, "web", "assets", "data.js")
AUDIO = os.path.join(ROOT, "web", "assets", "audio")
PHONICS = os.path.join(ROOT, "web", "assets", "phonics")

VOICES = {"us": "Samantha", "uk": "Daniel"}

# 自然拼读音素：用清晰的音节近似，避免合成器产生不清晰的机械音
PHONEME_TEXTS = {
    "iː": ("ee", "ee"), "ɪ": ("ih", "ih"), "e": ("eh", "eh"),
    "æ": ("aah", "aah"), "ɑː": ("ah", "ah"), "ɒ": ("aw", "aw"),
    "ɔː": ("aw", "aw"), "ʊ": ("oo", "oo"), "uː": ("oo", "oo"),
    "ʌ": ("uh", "uh"), "ɜː": ("er", "er"), "ə": ("uh", "uh"),
    "eɪ": ("ay", "ay"), "aɪ": ("eye", "eye"), "ɔɪ": ("oy", "oy"),
    "aʊ": ("ow", "ow"), "əʊ": ("oh", "oh"),
    "ɪə": ("ear", "ear"), "eə": ("air", "air"), "ʊə": ("oor", "oor"),
    "p": ("puh", "p"), "b": ("buh", "b"), "t": ("tuh", "t"),
    "d": ("duh", "d"), "k": ("kuh", "k"), "g": ("guh", "g"),
    "f": ("fuh", "f"), "v": ("vuh", "v"), "s": ("suh", "s"),
    "z": ("zuh", "z"), "θ": ("thuh", "th"), "ð": ("the", "dh"),
    "ʃ": ("shuh", "sh"), "ʒ": ("zhuh", "zh"), "tʃ": ("chuh", "ch"),
    "dʒ": ("juh", "j"), "m": ("muh", "m"), "n": ("nuh", "n"),
    "ŋ": ("nguh", "ng"), "l": ("luh", "l"), "r": ("ruh", "r"),
    "w": ("wuh", "w"), "j": ("yuh", "y"), "h": ("huh", "h"),
}


def slug(text):
    return re.sub(r"[^a-z0-9]+", "_", text.lower()).strip("_")


def parse_data():
    src = open(DATA, encoding="utf-8").read()
    pairs = re.findall(r"w: '([^']+)'[\s\S]*?sentence: '([^']+)'", src)
    words = {}
    for w, s in pairs:
        words[w] = s
    return words


def trim_wav(path, out_path, threshold_ratio=0.015):
    with wave.open(path, "rb") as w:
        params = w.getparams()
        data = np.frombuffer(w.readframes(w.getnframes()), dtype="<i2").astype(np.float32) / 32768.0
    if len(data) == 0:
        raise RuntimeError("empty audio")
    peak = float(np.max(np.abs(data))) or 1.0
    active = np.where(np.abs(data) > peak * threshold_ratio)[0]
    if len(active) == 0:
        active = np.array([0, len(data) - 1])
    pad = int(params.framerate * 0.035)
    start = max(0, int(active[0]) - pad)
    end = min(len(data), int(active[-1]) + pad)
    data = data[start:end]
    with wave.open(out_path, "wb") as w:
        w.setparams(params)
        w.writeframes(np.clip(data * 32767, -32768, 32767).astype("<i2").tobytes())


def make_clip(text, voice, out_m4a, trim=True):
    if os.path.exists(out_m4a) and os.path.getsize(out_m4a) > 500:
        return out_m4a
    os.makedirs(os.path.dirname(out_m4a), exist_ok=True)
    with tempfile.TemporaryDirectory() as td:
        raw_wav = os.path.join(td, "raw.wav")
        trim_wav_path = os.path.join(td, "trim.wav")
        cmd = ["say", "-v", voice, "-r", "150", "-o", raw_wav,
               "--file-format=WAVE", "--data-format=LEI16@22050", text]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        src = raw_wav
        if trim:
            trim_wav(raw_wav, trim_wav_path)
            src = trim_wav_path
        subprocess.run(["afconvert", "-f", "m4af", "-d", "aac", "-b", "64000", src, out_m4a],
                       check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return out_m4a


def main():
    words = parse_data()
    print("words:", len(words))
    tasks = []
    for w, s in words.items():
        key = slug(w)
        for acc, voice in VOICES.items():
            tasks.append((w, voice, os.path.join(AUDIO, acc, "words", key + ".m4a")))
            tasks.append((s, voice, os.path.join(AUDIO, acc, "sentences", key + ".m4a")))
    for token, (word_text, file_key) in PHONEME_TEXTS.items():
        tasks.append((word_text, "Daniel", os.path.join(PHONICS, file_key + ".m4a")))

    print("clips:", len(tasks))
    done = 0

    def run(task):
        text, voice, path = task
        make_clip(text, voice, path)
        return path

    with ThreadPoolExecutor(max_workers=4) as pool:
        for _ in pool.map(run, tasks):
            done += 1
            if done % 40 == 0:
                print("  generated", done, "/", len(tasks))

    total = 0
    for root, _, files in os.walk(os.path.join(ROOT, "web", "assets")):
        if os.path.basename(root) in ("audio", "phonics") or "audio" in root or "phonics" in root:
            for f in files:
                total += os.path.getsize(os.path.join(root, f))
    print("done. total audio size: %.1f MB" % (total / 1024 / 1024))


if __name__ == "__main__":
    main()
