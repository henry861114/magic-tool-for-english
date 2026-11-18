#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the app phoneme library from the user's 48-IPA course recordings.

Source: app/course_audio/  (copied from
  /Users/henry/Downloads/english/跟读音频（音标与例词）)
The PDF is the 48-symbol chart; each DayX-1 / DayX-2 MP3 starts with the
target sound twice, then repeats each example word twice.

The app's word IPA is CMUDict/American, so American r-coloured vowels and
/oʊ/ are composed from the same speaker's base sounds, exactly like the old
yinsu build.  Nothing here mixes speakers.

Output: web/assets/phonics/*.wav, 22,050 Hz, mono, 16-bit PCM.
"""

from __future__ import annotations

import json
import math
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
SRC = APP / "course_audio"
OUT = APP / "web" / "assets" / "phonics"
CACHE = Path(tempfile.gettempdir()) / "opencode" / "course_phonics_cache"
SR = 22050

# day file -> phoneme (from the PDF cards)
DAY_PHONEME = {
    "Day1-1": "ɑː", "Day1-2": "iː",
    "Day2-1": "uː", "Day2-2": "ɜː",
    "Day3-1": "ɔː", "Day3-2": "ʌ",
    "Day4-1": "ɪ", "Day4-2": "ʊ",
    "Day5-1": "ə", "Day5-2": "ɒ",
    "Day6-1": "e", "Day6-2": "æ",
    "Day7-1": "eɪ", "Day7-2": "aɪ",
    "Day8-1": "ɔɪ", "Day8-2": "ɪə",
    "Day9-1": "eə", "Day9-2": "ʊə",
    "Day10-1": "əʊ", "Day10-2": "aʊ",
    "Day11-1": "p", "Day11-2": "t",
    "Day12-1": "k", "Day12-2": "b",
    "Day13-1": "d", "Day13-2": "g",
    "Day14-1": "f", "Day14-2": "s",
    "Day15-1": "θ", "Day15-2": "ʃ",
    "Day16-1": "h", "Day16-2": "v",
    "Day17-1": "z", "Day17-2": "ð",
    "Day18-1": "ʒ", "Day18-2": "tʃ",
    "Day19-1": "tr", "Day19-2": "ts",
    "Day20-1": "dʒ", "Day20-2": "dr",
    "Day21-1": "dz", "Day21-2": "m",
    "Day22-1": "n", "Day22-2": "ŋ",
    "Day23-1": "r", "Day23-2": "l",
    "Day24-1": "w", "Day24-2": "j",
}

# output basename for each base phoneme (keeps app.js file names stable)
BASE_OUT = {
    "ɑː": "v_a_long", "iː": "v_i_long", "uː": "v_u_long", "ɜː": "v_er_long",
    "ɔː": "v_o_long", "ʌ": "v_uh", "ɪ": "v_i_short", "ʊ": "v_u_short",
    "ə": "v_schwa", "ɒ": "v_o_short", "e": "v_e", "æ": "v_ae",
    "eɪ": "d_ei", "aɪ": "d_ai", "ɔɪ": "d_oi", "ɪə": "d_ie",
    "eə": "d_ea", "ʊə": "d_ue", "əʊ": "d_ou", "aʊ": "d_au",
    "p": "c_p", "t": "c_t", "k": "c_k", "b": "c_b", "d": "c_d", "g": "c_g",
    "f": "c_f", "s": "c_s", "θ": "c_th", "ʃ": "c_sh", "h": "c_h",
    "v": "c_v", "z": "c_z", "ð": "c_dh", "ʒ": "c_zh",
    "tʃ": "c_ch", "tr": "c_tr", "ts": "c_ts", "dʒ": "c_j",
    "dr": "c_dr", "dz": "c_dz",
    "m": "c_m", "n": "c_n", "ŋ": "c_ng", "r": "c_r", "l": "c_l",
    "w": "c_w", "j": "c_y",
}

LONG_VOWELS = {"ɑː", "iː", "uː", "ɜː", "ɔː", "eɪ", "aɪ", "ɔɪ",
               "ɪə", "eə", "ʊə", "əʊ", "aʊ"}
SHORT_VOWELS = {"ʌ", "ɪ", "ʊ", "ə", "ɒ", "e", "æ"}
STOPS = {"p", "t", "k", "b", "d", "g", "tʃ", "dʒ", "tr", "ts", "dr", "dz"}

# Consonants that are said with a following vowel/schwa in the lesson need a
# cut before the vowel.  None means "use the whole first repetition".
CUT = {
    "p": None, "t": None, "k": None,
    "b": 0.08, "d": 0.08, "g": 0.08,
    "f": None, "s": None, "θ": None, "ʃ": None, "h": None,
    "v": 0.15, "z": 0.16, "ð": 0.14, "ʒ": 0.16,
    "tʃ": None, "dʒ": 0.12, "tr": None, "ts": None,
    "dr": 0.16, "dz": 0.14,
    "m": 0.14, "n": 0.14, "ŋ": 0.16,
    "r": 0.16, "l": 0.15, "w": 0.16, "j": 0.16,
}

# Voiced stops/affricates have a long weak pre-voicing before the release.
# Start at the release so the isolated sound is a clear stop, not a hum.
START_OFFSET = {
    "b": 0.09, "d": 0.16, "g": 0.18,
    "dʒ": 0.06, "dr": 0.06, "dz": 0.08,
}

# Same-speaker context variants cut from example words in the course MP3s.
# (day, absolute start, absolute end) in the decoded 22,050 Hz WAV.
VARIANT_SRC = {
    "l_dark": ("Day23-2", 9.30, 9.42),    # ball, final l
    "r_initial": ("Day23-1", 4.39, 4.47), # red, onset r
    "t_final": ("Day10-1", 10.98, 11.08), # boat, final t
    "m_final": ("Day21-2", 14.38, 14.52), # mum, final m
    "ng_final": ("Day22-2", 14.76, 14.90),# song, final ŋ
}


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def decode(mp3: Path) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / (mp3.stem + ".wav")
    if not out.exists() or out.stat().st_mtime < mp3.stat().st_mtime:
        run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", "-c", "1",
             str(mp3), str(out)])
    return out


def read_wav(path: Path):
    with wave.open(str(path), "rb") as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError("expected mono 16-bit WAV: %s" % path)
        sr = w.getframerate()
        data = w.readframes(w.getnframes())
    return list(struct.unpack("<%dh" % (len(data) // 2), data)), sr


def write_wav(path: Path, samples, sr=SR):
    path.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(struct.pack("<%dh" % len(samples), *samples))


def find_segments(samples, sr=SR, threshold=0.03, merge_gap=0.12):
    win = int(sr * 0.01)
    rms = []
    for i in range(0, len(samples) - win + 1, win):
        seg = samples[i:i + win]
        rms.append(math.sqrt(sum(x * x for x in seg) / len(seg)))
    if not rms:
        return []
    peak = max(rms) or 1.0
    segs = []
    start = None
    for i, v in enumerate(rms):
        on = v > peak * threshold
        if on and start is None:
            start = i
        elif not on and start is not None:
            segs.append((start * 0.01, i * 0.01))
            start = None
    if start is not None:
        segs.append((start * 0.01, len(rms) * 0.01))
    merged = []
    for a, b in segs:
        if merged and a - merged[-1][1] < merge_gap:
            merged[-1] = (merged[-1][0], b)
        else:
            merged.append((a, b))
    return merged


def slice_seconds(samples, sr, start, end):
    a = max(0, int(round(start * sr)))
    b = min(len(samples), int(round(end * sr)))
    if b <= a:
        raise ValueError("empty slice %.3f-%.3f" % (start, end))
    return samples[a:b]


def normalize(samples, target_rms=0.14, peak_limit=0.85):
    if not samples:
        return samples
    mean = sum(samples) / len(samples)
    samples = [x - mean for x in samples]
    peak = max(abs(x) for x in samples) or 1.0
    rms = math.sqrt(sum(x * x for x in samples) / len(samples)) or 1.0
    gain = min(target_rms * 32768.0 / rms, peak_limit * 32768.0 / peak)
    gain = max(0.05, min(gain, 12.0))
    return [max(-32768, min(32767, int(round(x * gain)))) for x in samples]


def fade(samples, sr=SR, ms=6):
    ms = min(ms, (len(samples) / float(sr)) * 1000.0 / 8.0)
    n = max(1, int(sr * ms / 1000.0))
    n = min(n, len(samples) // 2)
    for i in range(n):
        g = i / float(n)
        samples[i] = int(samples[i] * g)
        samples[-1 - i] = int(samples[-1 - i] * g)
    return samples


def finish(samples, loud=False):
    samples = normalize(samples, target_rms=0.20 if loud else 0.14,
                        peak_limit=0.94 if loud else 0.85)
    return fade(samples)


def add_lead(samples, seconds):
    return [0] * int(SR * seconds) + samples


def join(a, b, overlap=0.008):
    n = max(1, int(SR * overlap))
    n = min(n, len(a), len(b))
    return (a[:-n] + [int((x + y) / 2) for x, y in zip(a[-n:], b[:n])] + b[n:])


def build():
    if not SRC.is_dir():
        sys.exit("missing course_audio folder: %s" % SRC)
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.wav"):
        old.unlink()

    raw = {}
    manifest = {}

    # ---- base phonemes from the first repetition -----------------------
    for day, ph in DAY_PHONEME.items():
        mp3 = SRC / (day + ".MP3")
        if not mp3.exists():
            sys.exit("missing source: %s" % mp3)
        samples, sr = read_wav(decode(mp3))
        segs = find_segments(samples, sr)
        if not segs:
            sys.exit("no speech found in %s" % mp3)
        a, b = segs[0]
        if ph in LONG_VOWELS:
            dur = min(b - a, 0.40)
        elif ph in SHORT_VOWELS:
            dur = b - a
        else:
            cut = CUT.get(ph)
            dur = (b - a) if cut is None else min(b - a, cut)
        a += START_OFFSET.get(ph, 0.0)
        clip = slice_seconds(samples, sr, a, a + dur)
        loud = ph in STOPS
        clip = finish(clip, loud=loud)
        name = BASE_OUT[ph]
        raw[name] = clip
        manifest[name] = {
            "phoneme": ph,
            "source": day + ".MP3",
            "source_kind": "course-phoneme",
            "start": round(a, 3),
            "end": round(a + dur, 3),
            "duration": round(len(clip) / float(SR), 3),
        }

    # ---- same-speaker context variants ---------------------------------
    for name, (day, start, end) in VARIANT_SRC.items():
        samples, sr = read_wav(decode(SRC / (day + ".MP3")))
        clip = finish(slice_seconds(samples, sr, start, end), loud=(name == "t_final"))
        raw[name] = clip
        manifest[name] = {
            "phoneme": name,
            "source": day + ".MP3",
            "source_kind": "course-example-word",
            "start": start,
            "end": end,
            "duration": round(len(clip) / float(SR), 3),
        }

    # t_initial and n_final are the isolated sounds; copy after normalizing
    for name, base in [("t_initial", "c_t"), ("n_final", "c_n"), ("l_clear", "c_l")]:
        raw[name] = raw[base][:]
        manifest[name] = dict(manifest[base], source_kind="course-phoneme-copy")

    # ---- short happy /i/ and reduced /u/ -------------------------------
    for name, base, keep in [
        ("v_i_happy", "v_i_long", 0.20),
        ("v_u_reduced", "v_u_long", 0.20),
    ]:
        raw[name] = finish(raw[base][: int(keep * SR)])
        manifest[name] = dict(manifest[base], source_kind="course-phoneme-shortened",
                              duration=round(len(raw[name]) / float(SR), 3))

    # ---- American /oʊ/ from the same speaker's /ɔː/ + /ʊ/ --------------
    o = raw["v_o_long"][: int(0.18 * SR)]
    u = raw["v_u_short"][: int(0.10 * SR)]
    raw["d_o_us"] = finish(join(o, u))
    manifest["d_o_us"] = {
        "phoneme": "oʊ",
        "source": "v_o_long + v_u_short",
        "source_kind": "composite",
        "duration": round(len(raw["d_o_us"]) / float(SR), 3),
    }

    # ---- American r-coloured vowels ------------------------------------
    r_on = raw["c_r"][: int(0.075 * SR)]
    for name, base, keep in [
        ("r_er", "v_er_long", 0.30),
        ("r_ah", "v_a_long", 0.30),
        ("r_aw", "v_o_long", 0.30),
        ("r_schwa", "v_schwa", 0.17),
        ("r_ir", "v_i_short", 0.17),
        ("r_oor", "v_u_short", 0.19),
        ("r_air_us", "v_e", 0.17),
    ]:
        raw[name] = finish(join(raw[base][: int(keep * SR)], r_on))
        manifest[name] = {
            "phoneme": name,
            "source": base + " + c_r",
            "source_kind": "composite",
            "duration": round(len(raw[name]) / float(SR), 3),
        }

    # ---- write output with a short silent lead -------------------------
    stop_names = {BASE_OUT[p] for p in STOPS}
    for name, samples in raw.items():
        lead = 0.10 if name in stop_names or name in {"t_initial", "t_final"} else 0.05
        out = add_lead(samples, lead)
        write_wav(OUT / (name + ".wav"), out)
        manifest[name]["lead"] = lead
        manifest[name]["duration"] = round(len(out) / float(SR), 3)

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print("wrote %d clips to %s" % (len(raw), OUT))
    for name in sorted(raw):
        print("  %-14s %5.3fs  %s" % (name, len(raw[name]) / float(SR),
                                      manifest[name].get("phoneme", "")))


if __name__ == "__main__":
    build()
