#!/usr/bin/env python3
"""Rebuild per-word letter chunks from graphemes aligned to the word IPA.

The old build split words by a crude syllable counter, which produced chunks
like o= (silent) + w=/aʊ/ in "flower", or pl=/p/ in "people". This script
tokenises each word into graphemes (keeping ow/ea/oo/th/ture/tion together),
aligns them to the corrected word IPA with dynamic programming, and merges
silent letters/double letters into neighbouring chunks.

Run: python3 tools/rebuild_chunks.py [--dry-run]
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

VOWEL_DIGRAPHS = set('ai ay ea ee ei ey ie oa oo ou ow oi oy ue ui ew eu eau igh eigh ough augh air ear eer our ure are ere ire ore oar oor ar er ir or ur'.split())

VOWEL_TOKENS = set('aɪ eɪ ɔɪ aʊ oʊ əʊ ɪə eə ʊə ɑː ɔː ɜː iː uː ɪ e æ ɒ ʊ ʌ ɜ ɐ ə ɑ ɔ u i a'.split())

# graphemes that may be silent
SILENT_OK = {'e', 'h', 'w', 'k', 'b', 'g', 'gh', 'ue', 'ue', 'ue', 'ue'}

# multi-letter graphemes (longest first when matching)
GRAPHEMES = set('''
a b c d e f g h i j k l m n o p q r s t u v w x y z
sh ch th ph wh ck ng qu gh kn wr gn mb mn ps tch dge
tion sion ture cian cious tious sure
ai ay au aw ea ee ei ey ie oa oo ou ow oi oy ue ui ew eu eau
igh eigh ough augh air ear eer our ure are ere ire ore oar oor
iew eow
ar er ir or ur sc sci eo ful less ness ment ing ed es le al el il ul
'''.split())

# exact grapheme -> token tuples
G2P = {
    # vowels / digraphs
    'a': {('æ',), ('eɪ',), ('ə',), ('ɑː',), ('ɔː',), ('e',), ('ɪ',)},
    'e': {('e',), ('iː',), ('ɪ',), ('ə',), ('ɜː',), ('ʌ',)},
    'i': {('ɪ',), ('aɪ',), ('i',), ('ə',), ('j',)},
    'o': {('ɑː',), ('ɔː',), ('oʊ',), ('ʌ',), ('ə',), ('ʊ',), ('uː',), ('w',)},
    'u': {('ʌ',), ('uː',), ('ʊ',), ('ə',), ('juː',), ('j', 'uː'), ('j', 'u')},
    'y': {('j',), ('i',), ('aɪ',), ('ɪ',)},
    'ai': {('eɪ',)}, 'ay': {('eɪ',)}, 'au': {('ɔː',)}, 'aw': {('ɔː',)},
    'ea': {('iː',), ('e',), ('eɪ',), ('ɪ',)},
    'ee': {('iː',)},
    'ei': {('eɪ',), ('iː',)},
    'ey': {('eɪ',), ('i',)},
    'ie': {('iː',), ('aɪ',), ('ɪ',)},
    'oa': {('oʊ',)}, 'oo': {('uː',), ('ʊ',), ('ʌ',)},
    'ou': {('aʊ',), ('uː',), ('ʌ',), ('oʊ',)},
    'ow': {('aʊ',), ('oʊ',)},
    'oi': {('ɔɪ',)}, 'oy': {('ɔɪ',)},
    'ue': {('uː',)}, 'ui': {('uː',)}, 'ew': {('uː',), ('juː',)},
    'eu': {('juː',)}, 'eau': {('juː',), ('oʊ',)},
    'igh': {('aɪ',)}, 'eigh': {('eɪ',)},
    'ough': {('ɔː',), ('uː',), ('oʊ',), ('aʊ',)},
    'augh': {('ɔː',)},
    'air': {('e', 'r'), ('eə',)}, 'ear': {('ɪ', 'r'), ('iː', 'r'), ('ɜː', 'r')},
    'eer': {('ɪ', 'r'), ('iː', 'r')},
    'our': {('aʊ', 'r'), ('ɔː', 'r')},
    'ure': {('ʊ', 'r'), ('j', 'ʊ', 'r')},
    'are': {('e', 'r'), ('ɑː', 'r')}, 'ere': {('ɪ', 'r'), ('e', 'r')},
    'ire': {('aɪ', 'r'), ('aɪ', 'ə', 'r')}, 'ore': {('ɔː', 'r')},
    'oar': {('ɔː', 'r')}, 'oor': {('ɔː', 'r'), ('ʊ', 'r')},
    'iew': {('juː',), ('uː',)},
    # consonants / digraphs
    'b': {('b',)}, 'c': {('k',), ('s',), ('ʃ',)},
    'd': {('d',), ('dʒ',), ('t',)},
    'f': {('f',)}, 'g': {('g',), ('dʒ',), ('ʒ',)},
    'h': {('h',)}, 'j': {('dʒ',)},
    'k': {('k',)}, 'l': {('l',)}, 'm': {('m',)},
    'n': {('n',), ('ŋ',)}, 'p': {('p',)},
    'q': {('k',)}, 'r': {('r',)},
    's': {('s',), ('z',), ('ʃ',), ('ʒ',)},
    't': {('t',), ('ʃ',), ('tʃ',), ('d',), ('θ',), ('ð',)},
    'v': {('v',)}, 'w': {('w',), ('uː',)},
    'x': {('k', 's'), ('g', 'z'), ('z',)},
    'z': {('z',)},
    'sh': {('ʃ',)}, 'ch': {('tʃ',), ('k',), ('ʃ',)},
    'th': {('θ',), ('ð',)}, 'ph': {('f',)},
    'wh': {('w',), ('h',)}, 'ck': {('k',)}, 'ng': {('ŋ',)},
    'qu': {('k', 'w')}, 'gh': {('f',), ('g',), ()},
    'kn': {('n',)}, 'wr': {('r',)}, 'gn': {('n',)},
    'mb': {('m',)}, 'mn': {('m',)}, 'ps': {('s',)},
    'tch': {('tʃ',)}, 'dge': {('dʒ',)},
    'tion': {('ʃ', 'ə', 'n'), ('ʃ', 'n')},
    'sion': {('ʒ', 'ə', 'n'), ('ʃ', 'ə', 'n')},
    'ture': {('tʃ', 'ə', 'r'), ('tʃ', 'r')},
    'cian': {('ʃ', 'ə', 'n')}, 'cious': {('ʃ', 'ə', 's')},
    'tious': {('ʃ', 'ə', 's')}, 'sure': {('ʒ', 'ə', 'r'), ('ʃ', 'ə', 'r')},
    'ar': {('ɑː', 'r'), ('ə', 'r'), ('ɔː', 'r')},
    'er': {('ə', 'r'), ('ɜː', 'r'), ('ɪ', 'r'), ('e', 'r')},
    'ir': {('ɜː', 'r')},
    'or': {('ɔː', 'r'), ('ə', 'r'), ('ɜː', 'r')},
    'ur': {('ɜː', 'r'), ('ʊ', 'r')},
    'sc': {('s',), ('s', 'k')},
    'sci': {('s', 'aɪ',)},
    'eo': {('iː',)},
    'ful': {('f', 'ə', 'l'), ('f', 'l')},
    'less': {('l', 'ə', 's'), ('l', 'ɪ', 's')},
    'ness': {('n', 'ə', 's'), ('n', 'ɪ', 's')},
    'ment': {('m', 'ə', 'n', 't')},
    'ing': {('ɪ', 'ŋ')},
    'ed': {('d',), ('t',), ('ɪ', 'd')},
    'es': {('z',), ('ɪ', 'z'), ('s',)},
    # syllabic consonant spellings
    'le': {('ə', 'l'), ('l',)},
    'al': {('ə', 'l'), ('l',)},
    'el': {('ə', 'l'), ('l',)},
    'il': {('ə', 'l'), ('l',)},
    'ul': {('ə', 'l'), ('l',)},
}


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


def has_vowel_sound(toks):
    return any(t in VOWEL_TOKENS for t in toks)


def has_vowel_letter(g):
    return any(ch in 'aeiouy' for ch in g)


def is_vowel_tok(t):
    return t in VOWEL_TOKENS


def g_cost(g, toks, double=False):
    if tuple(toks) in G2P.get(g, set()):
        base = 0.0
        if g in VOWEL_DIGRAPHS and has_vowel_sound(toks):
            base -= 0.05
        if has_vowel_letter(g) and not has_vowel_sound(toks) and len(g) > 1 and not g.endswith('e') and g not in ('gh', 'kn', 'wr', 'mb', 'mn', 'ps', 'tch', 'dge'):
            base += 1.2
        return base
    if not toks:
        if double:
            return 0.2
        return 0.5 if g in SILENT_OK else 2.5
    if not has_vowel_letter(g) and has_vowel_sound(toks):
        if g in ('le', 'al', 'el', 'il', 'ul', 'tl', 'dl', 'pl', 'bl', 'kl', 'fl', 'sl'):
            return 0.6
        return 2.0
    if has_vowel_letter(g) and not has_vowel_sound(toks):
        if len(g) > 1 and not g.endswith('e') and g not in ('gh', 'kn', 'wr', 'mb', 'mn', 'ps', 'tch', 'dge'):
            return 1.2
        return 1.5
    return 1.0 + 0.35 * abs(len(toks) - 1)


def align(word, ipa):
    letters = word.lower()
    toks = tokenize(ipa)
    n, m = len(letters), len(toks)
    INF = 1e9
    dp = [[INF] * (m + 1) for _ in range(n + 1)]
    back = [[None] * (m + 1) for _ in range(n + 1)]
    dp[0][0] = 0.0
    for i in range(n + 1):
        for j in range(m + 1):
            cur = dp[i][j]
            if cur >= INF:
                continue
            for L in range(1, 5):
                if i + L > n:
                    break
                g = letters[i:i + L]
                if g not in GRAPHEMES:
                    continue
                for K in range(0, 4):
                    if j + K > m:
                        break
                    double = (i > 0 and len(g) == 1 and letters[i - 1] == g)
                    c = cur + g_cost(g, toks[j:j + K], double) + 0.001
                    if c < dp[i + L][j + K]:
                        dp[i + L][j + K] = c
                        back[i + L][j + K] = (i, j, g, K)
    if dp[n][m] >= INF:
        return None
    parts = []
    i, j = n, m
    while i > 0 or j > 0:
        pi, pj, g, K = back[i][j]
        parts.append((g, toks[pj:pj + K]))
        i, j = pi, pj
    parts.reverse()
    return parts


def merge(parts):
    """Merge duplicate letters and a final silent -e into readable chunks."""
    chunks = []
    for g, toks in parts:
        gl = g.lower()
        if chunks and chunks[-1][0].lower() == gl:
            # double letter: usually one sound, but cc can be /ks/ (succeed)
            chunks[-1][0] += g
            if toks:
                if not chunks[-1][1]:
                    chunks[-1][1] = list(toks)
                elif chunks[-1][1] != list(toks):
                    chunks[-1][1].extend(toks)
            continue
        if not toks and gl == 'e' and chunks and not has_vowel_sound(chunks[-1][1]):
            # final silent e: name -> n, a, me
            chunks[-1][0] += g
            continue
        if not toks and gl == 'e' and chunks and chunks[-1][0].lower() in ('r', 'l'):
            # final -er / -le
            chunks[-1][0] += g
            continue
        chunks.append([g, list(toks)])
    # merge final -er / -or / -ar if split as silent e + r
    out = []
    for text, toks in chunks:
        if out and text in ('r', 'l') and out[-1][0].endswith('e') and not out[-1][1]:
            out[-1][0] += text
            out[-1][1] = toks
            continue
        out.append([text, toks])
    # drop empty chunks that ended up with no text
    out = [c for c in out if c[0]]
    # ensure concatenation
    if ''.join(c[0] for c in out).lower() != ''.join(p[0] for p in parts).lower():
        return None
    return [[c[0], '/' + ''.join(c[1]) + '/' if c[1] else '', 1 if has_vowel_sound(c[1]) else 0] for c in out]


ACRONYM_CHUNKS = {
    'ai': [['A', '/eɪ/', 1], ['I', '/aɪ/', 1]],
    'ok': [['O', '/oʊ/', 1], ['K', '/keɪ/', 0]],
    'pe': [['P', '/piː/', 0], ['E', '/iː/', 1]],
    'pla': [['P', '/piː/', 0], ['L', '/el/', 0], ['A', '/eɪ/', 1]],
    'prc': [['P', '/piː/', 0], ['R', '/ɑːr/', 0], ['C', '/siː/', 0]],
    'tv': [['T', '/tiː/', 0], ['V', '/viː/', 0]],
    'uk': [['U', '/juː/', 1], ['K', '/keɪ/', 0]],
    'un': [['U', '/juː/', 1], ['N', '/en/', 0]],
    'us': [['U', '/juː/', 1], ['S', '/es/', 0]],
    'usa': [['U', '/juː/', 1], ['S', '/es/', 0], ['A', '/eɪ/', 1]],
    'vr': [['V', '/viː/', 0], ['R', '/ɑːr/', 0]],
    'who': [['W', '/dʌbəljuː/', 0], ['H', '/eɪtʃ/', 0], ['O', '/oʊ/', 1]],
}

IRREGULAR = {
    'eye': [['eye', '/aɪ/', 1]],
    'one': [['o', '/wʌ/', 1], ['ne', '/n/', 0]],
    'two': [['tw', '/t/', 0], ['o', '/uː/', 1]],
    'who': [['wh', '/h/', 0], ['o', '/uː/', 1]],
    'the': [['th', '/ð/', 0], ['e', '/ə/', 1]],
    'of': [['o', '/ə/', 1], ['f', '/v/', 0]],
    'mrs': [['Mrs', '/ˈmɪsɪz/', 1]],
    'ms': [['Ms', '/mɪz/', 1]],
    'mr': [['Mr', '/ˈmɪstər/', 1]],
    'people': [['p', '/p/', 0], ['eo', '/iː/', 1], ['p', '/p/', 0], ['le', '/əl/', 1]],
    'wednesday': [['Wed', '/we/', 1], ['nes', '/nz/', 0], ['day', '/deɪ/', 1]],
    'view': [['v', '/v/', 0], ['iew', '/juː/', 1]],
    'science': [['sci', '/saɪ/', 1], ['ence', '/əns/', 1]],
    'etc.': [['etc.', '/ˌetˈsetərə/', 1]],
    'km': [['km', '/ˈkɪləmiːtər/', 1]],
    'kg': [['kg', '/ˈkɪləgræm/', 1]],
    'türkiye': [['Türkiye', '/ˈtɜːrkiə/', 1]],
    't-shirt': [['T-', '/tiː/', 0], ['sh', '/ʃ/', 0], ['ir', '/ɜːr/', 1], ['t', '/t/', 0]],
    'x-ray': [['X-', '/eks/', 0], ['ray', '/reɪ/', 1]],
    'j.k.rowling': [['J.', '/dʒeɪ/', 0], ['K.', '/keɪ/', 0], ['Rowling', '/ˈroʊlɪŋ/', 1]],
    'dr': [['Dr', '/ˈdɑːktər/', 1]],
    'ice-skate': [['ice-', '/aɪs/', 1], ['skate', '/skeɪt/', 1]],
    'life-saving': [['life-', '/laɪf/', 1], ['saving', '/seɪvɪŋ/', 1]],
}


def build(word, ipa):
    key = word.lower()
    if word.isupper() and key in ACRONYM_CHUNKS:
        if len(word) == len(''.join(c[0] for c in ACRONYM_CHUNKS[key])):
            return [list(c) for c in ACRONYM_CHUNKS[key]]
    if key in IRREGULAR and len(word) == len(''.join(c[0] for c in IRREGULAR[key])):
        return [list(c) for c in IRREGULAR[key]]
    cleaned = re.sub(r'[^a-z]', '', word.lower())
    parts = align(cleaned, ipa)
    if not parts:
        return None
    # map graphemes back onto the original word, keeping hyphens/apostrophes/case
    pos = 0
    parts2 = []
    for g, toks in parts:
        text = ''
        while pos < len(word) and not word[pos].isalpha():
            text += word[pos]
            pos += 1
        for ch in g:
            if pos < len(word) and word[pos].lower() == ch:
                text += word[pos]
                pos += 1
            else:
                text += ch
        while pos < len(word) and not word[pos].isalpha():
            text += word[pos]
            pos += 1
        parts2.append((text, toks))
    if pos < len(word):
        parts2[-1] = (parts2[-1][0] + word[pos:], parts2[-1][1])
    chunks = merge(parts2)
    if not chunks:
        return None
    if ''.join(c[0] for c in chunks) != word:
        return None
    return chunks


def main():
    dry = '--dry-run' in sys.argv
    data = open(DATA, encoding='utf-8').read()
    units = json.loads(data[data.index('['):data.rindex(']') + 1])
    changed = failed = 0
    samples = []
    for unit in units:
        for word in unit['words']:
            w = word['w']
            if ' ' in w or not word.get('ipa'):
                continue
            chunks = build(w, word['ipa'])
            if not chunks:
                failed += 1
                if len(samples) < 30:
                    samples.append(('FAIL', w, word['ipa']))
                continue
            if chunks != word.get('chunks'):
                changed += 1
                if dry and len(samples) < 40:
                    samples.append((w, word['ipa'], ' '.join('%s=%s' % (c[0], c[1] or '-') for c in chunks)))
            if not dry:
                word['chunks'] = chunks
    for s in samples:
        print(s)
    print('changed', changed, 'failed', failed)
    if not dry:
        open(DATA, 'w', encoding='utf-8').write(
            'const PEP_ALL_UNITS = ' + json.dumps(units, ensure_ascii=False, indent=2) + ';\n')
        print('written')


if __name__ == '__main__':
    main()
