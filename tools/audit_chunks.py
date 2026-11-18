#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Audit how each letter inside every distinct chunk is mapped to a sound.

Mirrors letterTokenMap() in web/assets/app.js (including CHUNK_LETTER_RULES
and CHUNK_IPA_RULES) and writes dist/chunk_audit.csv.  Use it after changing
the chunk data or the letter rules to find chunks whose per-letter tap would
be misleading.

Run:  .venv/bin/python tools/audit_chunks.py
"""
import csv
import json
import re
from collections import Counter, defaultdict

ROOT = __import__('pathlib').Path(__file__).resolve().parent.parent
DATA = ROOT / 'web' / 'assets' / 'pep_all.js'
APPJS = ROOT / 'web' / 'assets' / 'app.js'
OUT = ROOT / 'dist' / 'chunk_audit.csv'

VOWELS = 'iɪeæaɑɒɔʊuʌɜə'
R_COLOURED = {'er', 'ɪr', 'ʊr', 'ər', 'ɑːr', 'ɔːr', 'ɜːr'}
R_SPLIT = {'er': 'e', 'ɪr': 'ɪ', 'ʊr': 'ʊ', 'ər': 'ə', 'ɑːr': 'ɑː', 'ɔːr': 'ɔː', 'ɜːr': 'ɜː'}
LETTER_RULES = {
    'ence': [0, 1, 2, None], 'ance': [0, 1, 2, None],
    'tion': [0, None, 1, 2], 'sion': [0, None, 1, 2], 'cian': [0, None, 1, 2],
    'sci': [0, None, 1], 'ture': [0, None, 1, None], 'sure': [0, None, 1, None],
    'air': [0, None, 1], 'are': [0, 1, None], 'ing': [0, 1, None], 'ear': [0, None, 1],
    'ness': [0, 1, 2, None], 'less': [0, 1, 2, None], 'igh': [0, None, None],
    'ough': [0, None, None, None], 'eigh': [0, None, None, None], 'tch': [0, None, None],
    'dge': [0, None, None], 'eye': [0, None, None], 'the': [0, None, None],
    'que': [0, None, None], 'gue': [0, None, None],
}
IPA_RULES = {
    'le|əl': [1, None], 'al|l': [None, 0], 'er|r': [None, 0], 'or|r': [None, 0],
    'nes|nz': [0, None, 1], 'xe|ks': [[0, 1], None],
    'rowling|roʊlɪŋ': [0, 1, None, 2, 3, 4, None],
}


def ipa_key(ipa):
    return re.sub(r'[/\[\]ˈˌ\s\-]', '', ipa or '')


def load_tokens():
    src = APPJS.read_text(encoding='utf-8')
    return re.findall(r"'([^']+)'", re.search(r'const IPA_TOKENS = \[(.*?)\];', src, re.S).group(1))


def tokenize(ipa, tokens):
    text = ipa_key(ipa)
    out, i = [], 0
    while i < len(text):
        for tok in tokens:
            if not text.startswith(tok, i):
                continue
            if tok in R_COLOURED and i + len(tok) < len(text) and text[i + len(tok)] in VOWELS:
                continue
            out.append(tok)
            i += len(tok)
            break
        else:
            i += 1
    return out


def letter_map(text, ipa, tokens):
    raw = list(text.lower())
    letters, positions = [], []
    for i, ch in enumerate(raw):
        if re.match(r'[a-z]', ch):
            letters.append(ch)
            positions.append(i)
    out = [None] * len(raw)
    toks = tokenize(ipa, tokens)
    if not letters or not toks:
        return out, toks, 'none'

    def put(li, value):
        if 0 <= li < len(positions):
            out[positions[li]] = value

    if len(toks) == 1 and toks[0] in R_SPLIT:
        ri = max((k for k, ch in enumerate(letters) if ch == 'r'), default=-1)
        if ri > 0:
            put(0, [R_SPLIT[toks[0]]])
            put(ri, ['r'])
            return out, toks, 'rsplit'

    key = ''.join(letters)

    def apply(rule):
        for i, val in enumerate(rule):
            if val is None:
                continue
            idxs = val if isinstance(val, list) else [val]
            picked = [toks[j] for j in idxs if j < len(toks)]
            if picked:
                put(i, picked)

    ipa_rule = IPA_RULES.get(key + '|' + ipa_key(ipa))
    if ipa_rule:
        apply(ipa_rule)
        return out, toks, 'ipa-rule'
    if key in LETTER_RULES:
        apply(LETTER_RULES[key])
        return out, toks, 'rule'

    # Whole-word / abbreviation chunks: more phonemes than letters.
    if len(toks) > len(letters) and letters:
        put(0, toks)
        return out, toks, 'whole-word'

    # Doubled letters share one sound: both l in ball, both p in apple.
    core = letters[:]
    if len(core) > 1 and core[-1] == 'e':
        core.pop()
    if len(toks) == 1 and len(core) > 1 and all(ch == core[0] for ch in core):
        for i in range(len(core)):
            put(i, [toks[0]])
        return out, toks, 'doubled'

    active = letters[:]
    if len(active) > len(toks) and active[-1] == 'e':
        active.pop()
    for i in range(len(active)):
        if i < len(toks):
            put(i, [toks[i]])
    if len(toks) > len(active) and active:
        put(0, toks)
    return out, toks, 'generic'


def main():
    raw = DATA.read_text(encoding='utf-8')
    units = json.loads(raw.split('=', 1)[1].strip().rstrip(';'))
    tokens = load_tokens()
    info = defaultdict(lambda: {'words': set(), 'display': '', 'out': None, 'toks': None, 'kind': ''})
    for unit in units:
        for word in unit['words']:
            for chunk in word.get('chunks') or []:
                key = (chunk[0].lower(), chunk[1])
                info[key]['words'].add(word['w'])
                info[key]['display'] = chunk[0]
    rows = []
    for (text, ipa), data in sorted(info.items()):
        out, toks, kind = letter_map(text, ipa, tokens)
        letters = sum(1 for ch in text if ch.isalpha())
        rows.append({
            'chunk': text,
            'ipa': ipa,
            'tokens': ' '.join(toks),
            'kind': kind,
            'letters': letters,
            'phonemes': len(toks),
            'map': ' | '.join(('·' if not cell else ','.join(cell)) for cell in out),
            'words': len(data['words']),
            'examples': ', '.join(sorted(data['words'])[:8]),
        })
    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open('w', encoding='utf-8-sig', newline='') as fh:
        writer = csv.DictWriter(fh, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)
    print('wrote', OUT)
    print('chunks:', len(rows))
    print('kinds:', dict(Counter(r['kind'] for r in rows)))


if __name__ == '__main__':
    main()
