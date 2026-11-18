#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Build the app's phoneme library from the local `yinsu` recordings.

Source: abelard.org, "a phonetics chart for british english"
https://www.abelard.org/briefings/phonetic_chart_british_english.php

Each source MP3 is a short lesson: the target sound three times, then two
example words.  This script cuts the *first* repetition and removes the
teaching schwa that abelard adds after consonants ("d-uh", not "d").

Output: web/assets/phonics/*.wav, 22,050 Hz, mono, 16-bit PCM.
"""

from __future__ import annotations

import json
import math
import shutil
import struct
import subprocess
import sys
import tempfile
import wave
from pathlib import Path

APP = Path(__file__).resolve().parent.parent
SRC = APP / "yinsu" / "english-phonetic-chart" / "audio"
WORD_SRC = APP / "yinsu" / "english-phonetic-chart" / "docs" / "audio" / "words"
OUT = APP / "web" / "assets" / "phonics"
CACHE = Path(tempfile.gettempdir()) / "opencode" / "yinsu_build_cache"
SR = 22050

# (source mp3, start sec, end sec).  Times refer to the first repetition in
# the lesson recording.  The end is deliberately placed before the trailing
# teaching schwa for consonants.
CLIPS = {
    # ---- vowels ---------------------------------------------------------
    "v_i_long": ("i_long.mp3", 0.38, 0.80),
    "v_i_short": ("i_short.mp3", 0.57, 0.78),
    "v_e": ("e_short.mp3", 0.68, 0.85),
    "v_ae": ("ae.mp3", 0.49, 0.65),
    "v_a_long": ("a_long.mp3", 0.68, 1.08),
    "v_o_short": ("o_short.mp3", 0.33, 0.52),
    "v_o_long": ("o_long.mp3", 0.45, 0.83),
    "v_u_short": ("u_short.mp3", 0.33, 0.58),
    "v_u_long": ("u_long.mp3", 0.65, 1.08),
    "v_uh": ("uh.mp3", 0.75, 0.89),
    "v_er_long": ("er_long.mp3", 0.57, 1.00),
    "v_schwa": ("schwa.mp3", 0.57, 0.75),
    # ---- diphthongs -----------------------------------------------------
    "d_ei": ("ei.mp3", 0.80, 1.22),
    "d_ai": ("ai.mp3", 0.49, 0.99),
    "d_oi": ("oi.mp3", 0.66, 1.10),
    "d_au": ("au.mp3", 0.36, 0.80),
    "d_ou": ("ou.mp3", 0.54, 0.98),
    "d_ie": ("ie.mp3", 0.62, 1.00),
    "d_ea": ("ea.mp3", 0.61, 1.08),
    "d_ue": ("ue.mp3", 0.49, 0.82, "highpass"),
    # ---- consonants -----------------------------------------------------
    # Stops are taken from word onsets below: the lesson recordings say
    # "puh/buh/tuh" and their release burst is too weak to cut cleanly.
    "c_g": ("g.mp3", 0.36, 0.45),
    "c_f": ("f.mp3", 0.78, 0.95),
    "c_v": ("v.mp3", 0.24, 0.315),
    "c_s": ("s.mp3", 0.23, 0.40),
    "c_z": ("z.mp3", 0.50, 0.68),
    "c_sh": ("sh.mp3", 0.55, 0.78),
    "c_zh": ("zh.mp3", 0.49, 0.67),
    "c_th": ("th_voiceless.mp3", 0.62, 0.74),
    "c_dh": ("th_voiced.mp3", 0.41, 0.57),
    "c_h": ("h.mp3", 0.38, 0.49),
    "c_ch": ("tsh.mp3", 0.43, 0.54),
    "c_j": ("dz.mp3", 0.56, 0.62),
    "c_m": ("m.mp3", 0.59, 0.76),
    "c_n": ("n.mp3", 0.18, 0.34),
    "c_ng": ("ng.mp3", 0.11, 0.30),
    "c_l": ("l.mp3", 0.22, 0.34),
    "c_r": ("r.mp3", 0.29, 0.43),
    "c_w": ("w.mp3", 0.57, 0.67),
    "c_y": ("j.mp3", 1.28, 1.38),
}

# Context variants cut from the example words in the same yinsu set.  These
# let the app use a natural word-final allophone where it matters.
WORD_CLIPS = {
    # Stops: onset burst + a little aspiration/vowel transition.  A 30-40 ms
    # burst is almost inaudible on a phone speaker, so keep ~50-65 ms while
    # still stopping before the vowel becomes a clear schwa.
    "c_p": ("pen.mp3", 0.195, 0.260),
    "c_b": ("boy.mp3", 0.215, 0.255),
    "c_t": ("tea.mp3", 0.185, 0.245),
    "c_d": ("dog.mp3", 0.190, 0.235),
    "c_k": ("cat.mp3", 0.190, 0.240),
    # allophones
    "l_dark": ("ball.mp3", 0.510, 0.600),
    "t_final": ("cat.mp3", 0.570, 0.630),
    "m_final": ("name.mp3", 0.520, 0.600),
    "n_final": ("sun.mp3", 0.500, 0.580),
    "ng_final": ("sing.mp3", 0.450, 0.560),
    "r_initial": ("red.mp3", 0.180, 0.255),
    "l_clear": ("like.mp3", 0.195, 0.245),
    "t_initial": ("tea.mp3", 0.185, 0.245),
}

# r-coloured vowels are not in yinsu (British RP is non-rhotic).  Compose
# them from the same speaker's base vowel plus a short /r/.
R_BASE = {
    "r_er": ("v_er_long", 0.30),
    "r_ah": ("v_a_long", 0.30),
    "r_aw": ("v_o_long", 0.30),
    "r_schwa": ("v_schwa", 0.17),
    "r_ir": ("v_i_short", 0.17),
    "r_oor": ("v_u_short", 0.19),
    "r_air_us": ("v_e", 0.17),
}

# happy /i/ and reduced /u/ are shorter than the cardinal long vowels.
SHORTEN = {
    "v_i_happy": ("v_i_long", 0.20),
    "v_u_reduced": ("v_u_long", 0.20),
}

# yinsu has British /əʊ/; the app's CMUdict IPA uses American /oʊ/.
# Build /oʊ/ from the same speaker's /ɔː/ + /ʊ/ instead of using /əʊ/.
VOWEL_COMPOSITES = {
    "d_o_us": ("v_o_long", 0.18, "v_u_short", 0.10),
}

# Stops are short high-frequency bursts; a phone speaker renders them much
# quieter than vowels at the same RMS.  Give them a little more gain.
LOUD = {"c_p", "c_b", "c_t", "c_d", "c_k", "c_g", "t_initial", "t_final"}


def run(cmd):
    subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)


def decode(mp3: Path) -> Path:
    CACHE.mkdir(parents=True, exist_ok=True)
    out = CACHE / (mp3.stem + ".wav")
    if not out.exists() or out.stat().st_mtime < mp3.stat().st_mtime:
        run(["afconvert", "-f", "WAVE", "-d", f"LEI16@{SR}", str(mp3), str(out)])
    return out


def read_wav(path: Path):
    with wave.open(str(path), "rb") as w:
        if w.getnchannels() != 1 or w.getsampwidth() != 2:
            raise ValueError("expected mono 16-bit WAV: %s" % path)
        sr = w.getframerate()
        data = w.readframes(w.getnframes())
    samples = list(struct.unpack("<%dh" % (len(data) // 2), data))
    return samples, sr


def write_wav(path: Path, samples, sr=SR):
    path.parent.mkdir(parents=True, exist_ok=True)
    peak = max(1, max(abs(x) for x in samples))
    with wave.open(str(path), "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes(struct.pack("<%dh" % len(samples), *samples))
    return peak


def highpass(samples, sr=SR, cutoff=80.0, q=0.7071):
    """RBJ biquad high-pass, used only to remove low-frequency room hum."""
    w0 = 2.0 * math.pi * cutoff / sr
    alpha = math.sin(w0) / (2.0 * q)
    cosw = math.cos(w0)
    a0 = 1.0 + alpha
    b0 = (1.0 + cosw) / 2.0 / a0
    b1 = -(1.0 + cosw) / a0
    b2 = b0
    a1 = -2.0 * cosw / a0
    a2 = (1.0 - alpha) / a0
    x1 = x2 = y1 = y2 = 0.0
    out = []
    for x in samples:
        y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2
        x2, x1 = x1, x
        y2, y1 = y1, y
        out.append(y)
    return out


def slice_clip(samples, sr, start, end):
    a = max(0, int(round(start * sr)))
    b = min(len(samples), int(round(end * sr)))
    if b <= a:
        raise ValueError("empty slice %.3f-%.3f" % (start, end))
    return samples[a:b]


def normalize(samples, target_rms=0.14, peak_limit=0.85):
    if not samples:
        return samples
    # remove DC
    mean = sum(samples) / len(samples)
    samples = [x - mean for x in samples]
    peak = max(abs(x) for x in samples) or 1.0
    rms = math.sqrt(sum(x * x for x in samples) / len(samples)) or 1.0
    # samples are int16, so compare against int16-scaled targets
    gain = min(target_rms * 32768.0 / rms, peak_limit * 32768.0 / peak)
    gain = max(0.05, min(gain, 12.0))
    return [max(-32768, min(32767, int(round(x * gain)))) for x in samples]


def fade(samples, sr=SR, ms=6):
    # Short stop bursts cannot afford a 6 ms fade on both ends; scale the
    # fade to the clip so a 30 ms /g/ does not lose most of its energy.
    ms = min(ms, (len(samples) / float(sr)) * 1000.0 / 8.0)
    n = max(1, int(sr * ms / 1000.0))
    n = min(n, len(samples) // 2)
    for i in range(n):
        g = i / float(n)
        samples[i] = int(samples[i] * g)
        samples[-1 - i] = int(samples[-1 - i] * g)
    return samples


def concat(parts):
    out = []
    for p in parts:
        out.extend(p)
    return out


def build():
    if not SRC.is_dir():
        sys.exit("missing yinsu source folder: %s" % SRC)
    OUT.mkdir(parents=True, exist_ok=True)
    # Remove only generated wav files; keep README.txt and other docs.
    for old in OUT.glob("*.wav"):
        old.unlink()

    made = {}
    manifest = {}
    for name, spec in CLIPS.items():
        mp3 = SRC / spec[0]
        start, end = spec[1], spec[2]
        samples, sr = read_wav(decode(mp3))
        if sr != SR:
            raise ValueError("unexpected sample rate %s for %s" % (sr, mp3))
        clip = slice_clip(samples, sr, start, end)
        if len(spec) > 3 and spec[3] == "highpass":
            clip = highpass(clip, sr)
        loud = name in LOUD
        clip = normalize(clip, target_rms=0.20 if loud else 0.14,
                          peak_limit=0.94 if loud else 0.85)
        clip = fade(clip)
        if loud:
            # Give Android's audio pipeline time to acquire focus/decode
            # before the very short burst, otherwise the first /p/ or /t/
            # can be swallowed on a cold start.
            clip = [0] * int(SR * 0.10) + clip
        made[name] = clip
        manifest[name] = {
            "source": mp3.name,
            "source_kind": "phoneme",
            "start": start,
            "end": end,
            "duration": round(len(clip) / float(SR), 3),
        }

    for name, (mp3name, start, end) in WORD_CLIPS.items():
        mp3 = WORD_SRC / mp3name
        samples, sr = read_wav(decode(mp3))
        clip = slice_clip(samples, sr, start, end)
        loud = name in LOUD
        clip = normalize(clip, target_rms=0.20 if loud else 0.14,
                          peak_limit=0.94 if loud else 0.85)
        clip = fade(clip)
        if loud:
            clip = [0] * int(SR * 0.10) + clip
        made[name] = clip
        manifest[name] = {
            "source": "words/" + mp3name,
            "source_kind": "example-word",
            "start": start,
            "end": end,
            "duration": round(len(clip) / float(SR), 3),
        }

    # short happy /i/ and reduced /u/
    for name, (base, keep) in SHORTEN.items():
        made[name] = fade(normalize(made[base][: int(keep * SR)]), ms=6)
        manifest[name] = dict(manifest[base], source_kind="phoneme-shortened", duration=round(len(made[name]) / float(SR), 3))

    # American /oʊ/ from the same speaker's /ɔː/ + /ʊ/
    for name, (base, keep, tail, tail_keep) in VOWEL_COMPOSITES.items():
        a = made[base][: int(keep * SR)]
        b = made[tail][: int(tail_keep * SR)]
        overlap = int(0.008 * SR)
        joined = a[:-overlap] + [int((x + y) / 2) for x, y in zip(a[-overlap:], b[:overlap])] + b[overlap:]
        joined = fade(normalize(joined), ms=8)
        made[name] = joined
        manifest[name] = {
            "source": base + " + " + tail,
            "source_kind": "composite",
            "duration": round(len(joined) / float(SR), 3),
        }

    # r-coloured composites
    for name, (base, keep) in R_BASE.items():
        r = made["c_r"]
        # use only the onset of /r/; a long tail would sound like a separate
        # consonant after the vowel instead of r-colouring it
        r = r[: int(0.075 * SR)]
        body = made[base][: int(keep * SR)]
        # overlap by 8 ms so the join is smooth
        overlap = int(0.008 * SR)
        joined = body[:-overlap] + [int((a + b) / 2) for a, b in zip(body[-overlap:], r[:overlap])] + r[overlap:]
        joined = fade(normalize(joined), ms=8)
        made[name] = joined
        manifest[name] = {
            "source": base + " + c_r",
            "source_kind": "composite",
            "duration": round(len(joined) / float(SR), 3),
        }

    for name, samples in made.items():
        write_wav(OUT / (name + ".wav"), samples)

    (OUT / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2, sort_keys=True) + "\n",
        encoding="utf-8",
    )
    print("wrote %d clips to %s" % (len(made), OUT))
    for name in sorted(made):
        print("  %-14s %5.3fs  %s" % (name, len(made[name]) / float(SR), manifest[name]["source"]))


if __name__ == "__main__":
    build()
