#!/usr/bin/env python3
"""Re-align per-chunk IPA in pep_all.js with the corrected word IPA.

The chunk splitter in build_pep_all.py splits CMUdict phones by syllable
count, which puts the wrong sound under many letter tiles (e.g. "listen"
got t=/s/). Now that every word has a dictionary-checked IPA, this script
aligns the letters of each chunk to the word's phoneme sequence and writes
the matching slice back to chunks[i][1]. Concatenating the chunks always
reproduces the whole word IPA, so per-chunk playback can no longer invent a
sound that is not in the word.

Run:  python3 tools/fix_chunk_ipa.py [--dry-run]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'web', 'assets', 'pep_all.js')

TOKENS = ['tʃ', 'dʒ', 'aɪ', 'eɪ', 'ɔɪ', 'aʊ', 'oʊ', 'əʊ', 'ɪə', 'eə', 'ʊə',
          'ɑː', 'ɔː', 'ɜː', 'iː', 'uː', 'ŋ', 'θ', 'ð', 'ʃ', 'ʒ', 'p', 'b',
          't', 'd', 'k', 'g', 'f', 'v', 's', 'z', 'm', 'n', 'l', 'r', 'w',
          'j', 'h', 'ɪ', 'e', 'æ', 'ɒ', 'ʊ', 'ʌ', 'ɜ', 'ɐ', 'ə', 'ɑ', 'ɔ',
          'u', 'i', 'a']

CAND = {
    'a': {'æ', 'eɪ', 'ə', 'ɑː', 'ɔː', 'e', 'ɒ', 'ɪ', 'ʌ'},
    'b': {'b'},
    'c': {'k', 's', 'tʃ', 'ʃ'},
    'd': {'d', 'dʒ', 't'},
    'e': {'e', 'iː', 'ɪ', 'ə', 'ɜː', 'ʌ', 'ɑː'},
    'f': {'f'},
    'g': {'g', 'dʒ', 'ʒ'},
    'h': {'h'},
    'i': {'ɪ', 'aɪ', 'iː', 'i', 'ə', 'j'},
    'j': {'dʒ', 'j'},
    'k': {'k'},
    'l': {'l'},
    'm': {'m'},
    'n': {'n', 'ŋ'},
    'o': {'ɑː', 'ɔː', 'oʊ', 'ʌ', 'ə', 'ʊ', 'uː', 'ɜː'},
    'p': {'p'},
    'q': {'k'},
    'r': {'r'},
    's': {'s', 'z', 'ʃ', 'ʒ'},
    't': {'t', 'ʃ', 'tʃ', 'd', 'θ', 'ð'},
    'u': {'ʌ', 'uː', 'ʊ', 'ə', 'ɜː'},
    'v': {'v'},
    'w': {'w'},
    'x': {'k', 'g', 'z'},
    'y': {'j', 'i', 'aɪ', 'ɪ'},
    'z': {'z'},
}

DIGRAPHS = {
    'th': {'θ', 'ð'}, 'sh': {'ʃ'}, 'ch': {'tʃ'}, 'ph': {'f'}, 'wh': {'w'},
    'ck': {'k'}, 'ng': {'ŋ'}, 'qu': {'k'}, 'gh': {'f'},
    'ea': {'iː', 'e', 'eɪ'}, 'ee': {'iː'}, 'oo': {'uː', 'ʊ', 'ʌ'},
    'oa': {'oʊ'}, 'ai': {'eɪ'}, 'ay': {'eɪ'}, 'ou': {'aʊ', 'uː', 'ʌ', 'oʊ'},
    'ow': {'aʊ', 'oʊ'}, 'oi': {'ɔɪ'}, 'oy': {'ɔɪ'}, 'au': {'ɔː'},
    'aw': {'ɔː'}, 'ew': {'uː'}, 'ie': {'iː', 'aɪ', 'ɪ'}, 'ei': {'eɪ', 'iː'},
    'ey': {'eɪ', 'i'}, 'ue': {'uː'}, 'ui': {'uː'}, 'ar': {'ɑː'},
    'or': {'ɔː'}, 'er': {'ɜː'}, 'ir': {'ɜː'}, 'ur': {'ɜː'}, 'air': {'e'},
    'ear': {'ɪ', 'iː'}, 'ure': {'ʊ'}, 'igh': {'aɪ'}, 'eigh': {'eɪ'},
    'ough': {'ɔː', 'uː', 'oʊ'},
}

SILENT = 1.0       # a letter with no phoneme (silent letter)
MISMATCH = 2.0     # letter -> implausible phoneme
EXTRA_TOKEN = 3.0  # phoneme with no letter
DIGRAPH_HIT = 0.0
DIGRAPH_SILENT = 0.7


def tokenize(ipa):
    s = re.sub(r"[\/\[\]ˈˌ\s\-]", '', ipa or '')
    out = []
    i = 0
    while i < len(s):
        for tok in TOKENS:
            if s.startswith(tok, i):
                out.append(tok)
                i += len(tok)
                break
        else:
            i += 1
    return out


def chunk_cost(letters, tokens):
    """Minimum cost of matching letter string to a token slice."""
    n, m = len(letters), len(tokens)
    INF = 1e9
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0
    for i in range(n + 1):
        for j in range(m + 1):
            cur = dp[i][j]
            if cur >= INF:
                continue
            if i < n:  # silent letter
                dp[i + 1][j] = min(dp[i + 1][j], cur + SILENT)
            if i < n and j < m:  # one letter -> one token
                c = letters[i]
                cost = DIGRAPH_HIT if tokens[j] in CAND.get(c, set()) else MISMATCH
                dp[i + 1][j + 1] = min(dp[i + 1][j + 1], cur + cost)
            if i + 1 < n and j < m:  # two letters -> one token
                pair = letters[i:i + 2]
                if pair in DIGRAPHS:
                    cost = DIGRAPH_HIT if tokens[j] in DIGRAPHS[pair] else MISMATCH
                    dp[i + 2][j + 1] = min(dp[i + 2][j + 1], cur + cost)
            if i + 2 < n and j < m:  # three letters -> one token (ear, air)
                tri = letters[i:i + 3]
                if tri in DIGRAPHS:
                    cost = DIGRAPH_HIT if tokens[j] in DIGRAPHS[tri] else MISMATCH
                    dp[i + 3][j + 1] = min(dp[i + 3][j + 1], cur + cost)
            if i + 3 < n and j < m:  # four letters -> one token (eigh, ough)
                quad = letters[i:i + 4]
                if quad in DIGRAPHS:
                    cost = DIGRAPH_HIT if tokens[j] in DIGRAPHS[quad] else MISMATCH
                    dp[i + 4][j + 1] = min(dp[i + 4][j + 1], cur + cost)
            if i < n and j + 1 < m and letters[i] == 'x':  # x -> k s
                dp[i + 1][j + 2] = min(dp[i + 1][j + 2], cur + 0.3)
            if i + 1 == n and j == m:
                pass
            if j < m:  # token with no letter
                dp[i][j + 1] = min(dp[i][j + 1], cur + EXTRA_TOKEN)
    return dp[n][m]


def align(chunks, tokens):
    """Return list of token slices, one per chunk."""
    k = len(chunks)
    t = len(tokens)
    INF = 1e9
    dp = [[INF] * (t + 1) for _ in range(k + 1)]
    back = [[None] * (t + 1) for _ in range(k + 1)]
    dp[0][0] = 0.0
    for ci in range(1, k + 1):
        letters = re.sub(r'[^a-z]', '', chunks[ci - 1].lower())
        for j in range(t + 1):
            best, arg = INF, None
            for i in range(j + 1):
                if dp[ci - 1][i] >= INF:
                    continue
                c = dp[ci - 1][i] + chunk_cost(letters, tokens[i:j])
                if c < best:
                    best, arg = c, i
            dp[ci][j] = best
            back[ci][j] = arg
    # last chunk must consume every remaining token
    slices = []
    j = t
    for ci in range(k, 0, -1):
        i = back[ci][j]
        slices.append(tokens[i:j])
        j = i
    slices.reverse()
    return slices


def main():
    dry = '--dry-run' in sys.argv
    text = open(DATA, encoding='utf-8').read()
    units = json.loads(text[text.index('['):text.rindex(']') + 1])
    changed = total = 0
    samples = []
    for unit in units:
        for word in unit['words']:
            toks = tokenize(word.get('ipa', ''))
            chunks = word.get('chunks') or []
            if not toks or not chunks:
                continue
            if len(chunks) == 1:
                chunks[0][1] = word.get('ipa', '')
                continue
            slices = align([c[0] for c in chunks], toks)
            for chunk, sl in zip(chunks, slices):
                value = '/' + ''.join(sl) + '/' if sl else ''
                total += 1
                if chunk[1] != value:
                    changed += 1
                    if dry and len(samples) < 60:
                        samples.append((word['w'], chunk[0], chunk[1], value))
                chunk[1] = value
            if word['w'] in ('listen', 'name', 'grandfather', 'grandmother',
                             'family', 'have', 'teacher', 'beautiful',
                             'computer', 'basketball', 'Wednesday'):
                samples.append((word['w'], '+', word['ipa'],
                                ' '.join('[%s]%s' % (c[0], c[1]) for c in chunks)))
    for s in samples[:60]:
        print(s)
    print(f'chunks={total} changed={changed}')
    if not dry:
        open(DATA, 'w', encoding='utf-8').write(
            'const PEP_ALL_UNITS = ' +
            json.dumps(units, ensure_ascii=False, indent=2) + ';\n')
        print('written', DATA)


if __name__ == '__main__':
    main()
