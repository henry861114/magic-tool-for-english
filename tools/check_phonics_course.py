#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Static validation for the course phoneme library and app mapping.

Checks:
  * every IPA token used by the 2983-word data has a file
  * every mapped/variant file exists and is a valid 22,050 Hz mono WAV
  * no clipping, no silence, sane duration
  * tokenizer does not merge e+r across syllables (very, irregular)
  * every word's chunk plan matches its whole-word IPA
"""
from __future__ import annotations

import json
import re
import sys
import wave
from pathlib import Path

# Short bursts that get an 80 ms silent lead-in so Android does not swallow
# the first /p/ or /t/ while it is still acquiring audio focus.
STOP_CLIPS = {
    "c_p", "c_b", "c_t", "c_d", "c_k", "c_g",
    "c_ch", "c_j", "c_tr", "c_dr", "c_ts", "c_dz",
    "t_initial", "t_final",
}
CLUSTER_JOIN = {"t+r": "tr", "d+r": "dr", "t+s": "ts", "d+z": "dz"}

APP = Path(__file__).resolve().parent.parent
APP_JS = APP / "web" / "assets" / "app.js"
DATA_JS = APP / "web" / "assets" / "pep_all.js"
PHONICS = APP / "web" / "assets" / "phonics"


def parse_mapping():
    src = APP_JS.read_text(encoding="utf-8")
    block = re.search(r"const PHONEME_FILES = \{(.*?)\n  \};", src, re.S).group(1)
    mapping = dict(re.findall(r"'([^']+)':\s*'([^']+)'", block))
    tokens = re.findall(r"'([^']+)'", re.search(r"const IPA_TOKENS = \[(.*?)\];", src, re.S).group(1))
    variants = re.findall(r"(\w+):\s*'(\w+)'", re.search(r"const PHONEME_VARIANTS = \{(.*?)\n  \};", src, re.S).group(1))
    return mapping, tokens, dict(variants)


VOWELS = "iɪeæaɑɒɔʊuʌɜə"
R_COLOURED = {"er", "ɪr", "ʊr", "ər", "ɑːr", "ɔːr", "ɜːr"}
R_SPLIT = {
    "er": "e", "ɪr": "ɪ", "ʊr": "ʊ", "ər": "ə",
    "ɑːr": "ɑː", "ɔːr": "ɔː", "ɜːr": "ɜː",
}


def tokenize(ipa, tokens):
    s = re.sub(r"[/\[\]ˈˌ\s\-]", "", str(ipa or ""))
    out = []
    i = 0
    while i < len(s):
        for tok in tokens:
            if not s.startswith(tok, i):
                continue
            if tok in R_COLOURED and i + len(tok) < len(s) and s[i + len(tok)] in VOWELS:
                continue
            out.append(tok)
            i += len(tok)
            break
        else:
            i += 1
    return out


def first_pronounced(chunks, index, tokens):
    for chunk in chunks[index:]:
        ts = tokenize(chunk[1], tokens)
        if ts:
            return ts[0]
    return None


def plan_tokens(word, tokens, mapped):
    """Mirror app.js wordPhonemePlan: split r-coloured chunks before a vowel,
    then rejoin a vowel + /r/ that is split across two chunks."""
    chunks = word.get("chunks") or []
    plan = []
    for ci, chunk in enumerate(chunks):
        ts = tokenize(chunk[1], tokens)
        nxt = first_pronounced(chunks, ci + 1, tokens)
        if ts and nxt and nxt[0] in VOWELS and ts[-1] in R_SPLIT:
            ts = ts[:-1] + [R_SPLIT[ts[-1]], "r"]
        for t in ts:
            plan.append((t, ci))
    merged = []
    i = 0
    while i < len(plan):
        cur = plan[i]
        nxt = plan[i + 1] if i + 1 < len(plan) else None
        after = plan[i + 2] if i + 2 < len(plan) else None
        joined = cur[0] + (nxt[0] if nxt else "")
        r_is_coda = not after or after[0][0] not in VOWELS
        join = None
        if nxt and nxt[1] == cur[1] + 1:
            if nxt[0] == "r" and r_is_coda and joined in mapped:
                join = joined
            else:
                cluster = CLUSTER_JOIN.get(cur[0] + "+" + nxt[0])
                if cluster and cluster in mapped:
                    join = cluster
        if join:
            merged.append(join)
            i += 2
        else:
            merged.append(cur[0])
            i += 1
    return merged


def wav_stats(path):
    with wave.open(str(path), "rb") as w:
        sr = w.getframerate()
        ch = w.getnchannels()
        sw = w.getsampwidth()
        n = w.getnframes()
        data = w.readframes(n)
    samples = memoryview(data).cast("h")
    peak = max(abs(x) for x in samples) / 32768.0 if samples else 0.0
    rms = (sum(x * x for x in samples) / len(samples)) ** 0.5 / 32768.0 if samples else 0.0
    lead_n = min(len(samples), int(sr * 0.06))
    lead_rms = ((sum(x * x for x in samples[:lead_n]) / lead_n) ** 0.5 / 32768.0
                if lead_n else 0.0)
    return sr, ch, sw, n / float(sr), peak, rms, lead_rms


def main():
    mapping, tokens, variants = parse_mapping()
    units = json.loads(DATA_JS.read_text(encoding="utf-8").split("=", 1)[1].strip().rstrip(";"))
    words = []
    for unit in units:
        words.extend(unit["words"])

    issues = []
    used = set()
    for word in words:
        for chunk in word.get("chunks") or []:
            for tok in tokenize(chunk[1], tokens):
                used.add(tok)
                if tok not in mapping:
                    issues.append("unmapped token %r in %s %r" % (tok, word["w"], chunk[1]))
        if not word.get("chunks"):
            for tok in tokenize(word.get("ipa"), tokens):
                used.add(tok)
                if tok not in mapping:
                    issues.append("unmapped token %r in word %s" % (tok, word["w"]))

    for tok in sorted(used):
        if tok not in mapping:
            issues.append("used token without mapping: %r" % tok)

    referenced = set(mapping.values()) | set(variants.values())
    for name in sorted(referenced):
        path = PHONICS / (name + ".wav")
        if not path.exists():
            issues.append("missing file: %s" % path.name)
            continue
        sr, ch, sw, dur, peak, rms, lead_rms = wav_stats(path)
        if sr != 22050 or ch != 1 or sw != 2:
            issues.append("%s: expected 22050/1/16, got %s/%s/%s" % (path.name, sr, ch, sw * 8))
        if dur < 0.02 or dur > 0.62:
            issues.append("%s: odd duration %.3fs" % (path.name, dur))
        if peak < 0.05:
            issues.append("%s: too quiet (peak %.3f)" % (path.name, peak))
        if peak > 0.99:
            issues.append("%s: clipping (peak %.3f)" % (path.name, peak))
        if rms < 0.01:
            issues.append("%s: near-silent (rms %.4f)" % (path.name, rms))
        if name in STOP_CLIPS:
            if dur < 0.10:
                issues.append("%s: stop too short (%.3fs)" % (path.name, dur))
            if lead_rms > 0.02:
                issues.append("%s: stop missing silent lead-in (lead rms %.3f)"
                              % (path.name, lead_rms))

    # every word's chunk plan should reproduce the whole-word IPA
    plan_bad = 0
    for word in words:
        whole = tokenize(word.get("ipa"), tokens)
        planned = plan_tokens(word, tokens, mapping)
        if whole != planned:
            plan_bad += 1
            if plan_bad <= 10:
                issues.append("plan mismatch %s: ipa=%r plan=%r" % (word["w"], whole, planned))

    # tokenizer regressions
    for ipa, expected in [
        ("/ˈveri/", ["v", "e", "r", "i"]),
        ("/ˈɪˈreɪsər/", ["ɪ", "r", "eɪ", "s", "ər"]),
        ("/ʃer/", ["ʃ", "er"]),
        ("/bɜːrd/", ["b", "ɜːr", "d"]),
        ("/ˈsɑːri/", ["s", "ɑː", "r", "i"]),
        ("/ˈɔːrɪndʒ/", ["ɔː", "r", "ɪ", "n", "dʒ"]),
        ("/ˈstɔːri/", ["s", "t", "ɔː", "r", "i"]),
        ("/ˈtiːtʃər/", ["t", "iː", "tʃ", "ər"]),
        ("/triː/", ["tr", "iː"]),
        ("/driːm/", ["dr", "iː", "m"]),
        ("/kæts/", ["k", "æ", "ts"]),
        ("/kɪdz/", ["k", "ɪ", "dz"]),
    ]:
        got = tokenize(ipa, tokens)
        if got != expected:
            issues.append("tokenize %s = %r, expected %r" % (ipa, got, expected))

    print("words: %d, distinct tokens used: %d, mapped files: %d, plan mismatches: %d"
          % (len(words), len(used), len(referenced), plan_bad))
    print("tokens:", " ".join(sorted(used)))
    if issues:
        print("ISSUES (%d):" % len(issues))
        for x in issues[:50]:
            print(" -", x)
        raise SystemExit(1)
    print("OK")


if __name__ == "__main__":
    main()
