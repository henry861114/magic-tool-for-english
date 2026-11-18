#!/usr/bin/env python3
"""Rebuild IPA in web/assets/pep_all.js from CMUdict.

CMUdict (tools/cmudict.dict) is the Carnegie Mellon Pronouncing Dictionary,
a public-domain/BSD-style ARPAbet lexicon. Unlike open-dict-data/en_US.txt it
keeps vowel stress and distinguishes AH0 (schwa) from AH1/AH2 (strut /ʌ/),
and ER0 (ər) from ER1/ER2 (ɜːr), which fixes the main classes of wrong IPA in
the textbook word list.

Output convention (US, learner-friendly):
  - monosyllables have no stress mark
  - ʌ for stressed strut, ə for unstressed
  - ər for unstressed r-coloured vowel, ɜːr for stressed
  - ɑː / ɔː / iː / uː length marks, e for DRESS, oʊ for GOAT
  - no ɹ / ɫ / ɡ / ɝ / ɚ / ɛ leftovers

Run:  python3 tools/fix_ipa_cmudict.py [--dry-run]
"""
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CMU = os.path.join(ROOT, 'tools', 'cmudict.dict')
DATA = os.path.join(ROOT, 'web', 'assets', 'pep_all.js')

VOWELS = {'AA', 'AE', 'AH', 'AO', 'AW', 'AY', 'EH', 'ER', 'EY',
          'IH', 'IY', 'OW', 'OY', 'UH', 'UW'}

CONS = {
    'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'g',
    'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm', 'N': 'n',
    'NG': 'ŋ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ', 'T': 't',
    'TH': 'θ', 'V': 'v', 'W': 'w', 'Y': 'j', 'Z': 'z', 'ZH': 'ʒ',
}

VOWEL_MAP = {
    'AA': 'ɑː', 'AE': 'æ', 'AO': 'ɔː', 'AW': 'aʊ', 'AY': 'aɪ',
    'EH': 'e', 'EY': 'eɪ', 'IH': 'ɪ', 'IY': 'iː', 'OW': 'oʊ',
    'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'uː',
}

# Valid English syllable onsets, used to place the stress mark on the onset
# of the stressed syllable rather than in the middle of a cluster.
ONSETS = set()
for c in ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 'θ', 'ð', 's', 'z',
          'ʃ', 'ʒ', 'h', 'm', 'n', 'l', 'r', 'w', 'j', 'tʃ', 'dʒ']:
    ONSETS.add(c)
for c in ['p', 'b', 't', 'd', 'k', 'g', 'f', 'v', 'm', 'n', 'l', 's', 'h']:
    ONSETS.add(c + 'j')
for c in ['p', 'b', 't', 'd', 'k', 'g', 'f', 'θ', 'ʃ']:
    ONSETS.add(c + 'r')
for c in ['p', 'b', 'k', 'g', 'f', 's']:
    ONSETS.add(c + 'l')
ONSETS.update(['tw', 'dw', 'kw', 'gw', 'sw', 'sm', 'sn', 'sp', 'st', 'sk',
               'spr', 'str', 'skr', 'spl', 'skl', 'skw', 'spj', 'stj', 'skj'])

# Words whose CMUdict first entry is a different part of speech / reading than
# the one used in the textbook. Values are final IPA, already in our style.
OVERRIDES = {
    # function words / reduced forms
    'a': '/ə/', 'an': '/ən/', 'the': '/ðə/', 'to': '/tə/', 'of': '/əv/',
    'and': '/ænd/', 'or': '/ɔːr/', 'for': '/fər/', 'from': '/frəm/',
    'with': '/wɪð/', 'by': '/baɪ/', 'as': '/æz/', 'at': '/æt/',
    'on': '/ɑːn/', 'is': '/ɪz/', 'are': '/ɑːr/', 'was': '/wʌz/',
    'were': '/wɜːr/', 'am': '/æm/', 'be': '/biː/', 'been': '/bɪn/',
    'do': '/duː/', 'does': '/dʌz/', 'did': '/dɪd/', 'have': '/hæv/',
    'has': '/hæz/', 'had': '/hæd/', 'can': '/kæn/', 'could': '/kʊd/',
    'will': '/wɪl/', 'would': '/wʊd/', 'should': '/ʃʊd/', 'may': '/meɪ/',
    'might': '/maɪt/', 'must': '/mʌst/', 'not': '/nɑːt/', 'no': '/noʊ/',
    'yes': '/jes/', 'i': '/aɪ/', 'you': '/juː/', 'he': '/hiː/',
    'she': '/ʃiː/', 'it': '/ɪt/', 'we': '/wiː/', 'they': '/ðeɪ/',
    'my': '/maɪ/', 'your': '/jʊr/', 'his': '/hɪz/', 'her': '/hɜːr/',
    'its': '/ɪts/', 'our': '/aʊər/', 'their': '/ðer/', 'this': '/ðɪs/',
    'that': '/ðæt/', 'these': '/ðiːz/', 'those': '/ðoʊz/',
    # heteronyms: textbook reading first
    'read': '/riːd/', 'live': '/lɪv/', 'close': '/kloʊz/', 'use': '/juːz/',
    'house': '/haʊs/', 'wind': '/wɪnd/', 'present': '/ˈprezənt/',
    'record': '/ˈrekərd/', 'object': '/ˈɑːbdʒekt/',
    'project': '/ˈprɑːdʒekt/', 'excuse': '/ɪkˈskjuːz/',
    'graduate': '/ˈgrædʒueɪt/', 'separate': '/ˈsepəreɪt/',
    'produce': '/prəˈduːs/', 'increase': '/ɪnˈkriːs/',
    'decrease': '/dɪˈkriːs/', 'desert': '/ˈdezərt/',
    'content': '/ˈkɑːntent/', 'permit': '/pərˈmɪt/',
    'refuse': '/rɪˈfjuːz/', 'tear': '/tɪr/', 'bow': '/baʊ/',
    'lead': '/liːd/', 'wound': '/wuːnd/', 'row': '/roʊ/',
    'sow': '/soʊ/', 'bass': '/beɪs/',
    # textbook forms that CMUdict reduces or spells differently
    'library': '/ˈlaɪbrəri/', 'february': '/ˈfebruəri/',
    'vegetable': '/ˈvedʒtəbəl/', 'restaurant': '/ˈrestərɑːnt/',
    # names / terms absent from CMUdict
    'colourful': '/ˈkʌlərfəl/', 'pe': '/ˌpiːˈiː/', 'maths': '/mæθs/',
    'schoolbag': '/ˈskuːlbæg/', 'taikonaut': '/ˈtaɪkoʊnɔːt/',
    'turpan': '/ˈtʊrpɑːn/', 'ice-skate': '/ˈaɪsskeɪt/',
    'prc': '/ˌpiːɑːrˈsiː/', 'vr': '/ˌviːˈɑːr/',
    'whiteboard': '/ˈwaɪtbɔːrd/', 'well-used': '/ˌwelˈjuːzd/',
    'sit-up': '/ˈsɪtʌp/', 'paper-cut': '/ˈpeɪpərkʌt/',
    'km': '/ˈkɪləmiːtər/', 'kg': '/ˈkɪləgræm/', 'ginkgo': '/ˈgɪŋkoʊ/',
    'stir-fry': '/ˈstɜːrfraɪ/', 'mini-goal': '/ˈmɪnigoʊl/',
    'healthily': '/ˈhelθəli/', 'stomachache': '/ˈstʌməkeɪk/',
    'toothache': '/ˈtuːθeɪk/', 'heatwave': '/ˈhiːtweɪv/',
    'phuket': '/puːˈket/', 'sign-off': '/ˈsaɪnɔːf/',
    'ji-hoon': '/ˌdʒiːˈhuːn/', 'kaito': '/ˈkaɪtoʊ/',
    'türkiye': '/ˈtɜːrkiə/', 'dickon': '/ˈdɪkən/',
    'life-saving': '/ˈlaɪfseɪvɪŋ/', 'mooncake': '/ˈmuːnkeɪk/',
    'couplet': '/ˈkʌplət/', 'uncrowded': '/ˌʌnˈkraʊdɪd/',
    'j.k.rowling': '/ˌdʒeɪˈkeɪ ˈroʊlɪŋ/', 'wildaid': '/ˈwaɪld eɪd/',
    # school-list readings / stress fixes
    'subject': '/ˈsʌbdʒɪkt/', 'hard-working': '/ˌhɑːrdˈwɜːrkɪŋ/',
    'magazine': '/ˌmægəˈziːn/', 'august': '/ˈɔːgəst/',
    'july': '/dʒuˈlaɪ/', 'usually': '/ˈjuːʒuəli/',
    'january': '/ˈdʒænjuəri/', 'hawaii': '/həˈwaɪi/',
    'australia': '/ɔːˈstreɪliə/', 'inside': '/ɪnˈsaɪd/',
    'sometimes': '/ˈsʌmtaɪmz/', 'even': '/ˈiːvən/',
    'dr': '/ˈdɑːktər/',
    'habit': '/ˈhæbɪt/', 'excited': '/ɪkˈsaɪtɪd/', 'unit': '/ˈjuːnɪt/',
    'thirty': '/ˈθɜːrdi/',
    # stress / reduction fixes found in the full audit
    'engineer': '/ˌendʒɪˈnɪr/', 'kilometre': '/ˈkɪləmiːtər/',
    'pronunciation': '/prəˌnʌnsiˈeɪʃən/',
    'advertisement': '/ˌædvərˈtaɪzmənt/',
    'costume': '/ˈkɑːstuːm/',
    'basket': '/ˈbæskɪt/', 'basketball': '/ˈbæskɪtbɔːl/',
    'president': '/ˈprezɪdənt/', 'officer': '/ˈɔːfɪsər/',
    'usual': '/ˈjuːʒuəl/',
    'thirteen': '/ˌθɜːrˈtiːn/', 'fourteen': '/ˌfɔːrˈtiːn/',
    'seventeen': '/ˌsevənˈtiːn/', 'nineteen': '/ˌnaɪnˈtiːn/',
    'admire': '/ədˈmaɪr/', 'adventure': '/ədˈventʃər/',
    'advantage': '/ədˈvæntɪdʒ/', 'advise': '/ədˈvaɪz/',
    'advice': '/ədˈvaɪs/',
    # weekdays: keep the full -day ending used by PEP, not the reduced -di
    'monday': '/ˈmʌndeɪ/', 'tuesday': '/ˈtuːzdeɪ/',
    'wednesday': '/ˈwenzdeɪ/', 'thursday': '/ˈθɜːrzdeɪ/',
    'friday': '/ˈfraɪdeɪ/', 'saturday': '/ˈsætərdeɪ/',
    'sunday': '/ˈsʌndeɪ/',
}

# British spelling -> American spelling fallback for CMUdict lookups.
SPELLING = [
    ('colour', 'color'), ('favourite', 'favorite'), ('neighbour', 'neighbor'),
    ('behaviour', 'behavior'), ('centre', 'center'), ('metre', 'meter'),
    ('theatre', 'theater'), ('litre', 'liter'), ('travelling', 'traveling'),
    ('travelled', 'traveled'), ('cancelled', 'canceled'), ('jewellery', 'jewelry'),
    ('realise', 'realize'), ('organise', 'organize'), ('practise', 'practice'),
    ('defence', 'defense'), ('licence', 'license'), ('programme', 'program'),
    ('aeroplane', 'airplane'), ('mum', 'mom'), ('grey', 'gray'),
    ('analyse', 'analyze'), ('apologise', 'apologize'),
]


def load_cmu():
    table = {}
    with open(CMU, encoding='utf-8', errors='ignore') as fh:
        for line in fh:
            line = line.strip()
            if not line or line.startswith(';;;'):
                continue
            parts = line.split()
            if len(parts) < 2:
                continue
            word = re.sub(r'\(\d+\)$', '', parts[0].lower())
            if word not in table:
                table[word] = parts[1:]
    return table


def is_vowel(phone):
    return phone[:2] in VOWELS


def coda_len(phones, vi, next_vi):
    run = phones[vi + 1:next_vi]
    if not run:
        return 0
    onset = 0
    for size in range(len(run), 0, -1):
        cand = ''.join(CONS.get(x, x.lower()) for x in run[-size:])
        if cand in ONSETS:
            onset = size
            break
    return len(run) - onset


def onset_start(phones, vi):
    """Index where the onset of the syllable containing phones[vi] starts."""
    cons = []
    k = vi - 1
    while k >= 0 and not is_vowel(phones[k]):
        cons.append(phones[k])
        k -= 1
    cons.reverse()
    if k < 0:
        return 0
    if not cons:
        return vi
    for n in range(len(cons), 0, -1):
        cand = ''.join(CONS.get(x, x.lower()) for x in cons[-n:])
        if cand in ONSETS:
            return vi - n
    return vi - 1


def convert(phones, word=''):
    # ER0 before another vowel is really schwa + onset /r/ (giraffe, etc.)
    fixed = []
    for i, phone in enumerate(phones):
        if phone == 'ER0' and i + 1 < len(phones) and is_vowel(phones[i + 1]):
            fixed.extend(['AH0', 'R'])
        else:
            fixed.append(phone)
    phones = fixed
    vowels = [i for i, p in enumerate(phones) if is_vowel(p)]
    if not vowels:
        return None
    mono = len(vowels) == 1
    last_vowel = vowels[-1]
    marks = {}
    primary_used = False
    for vi in vowels:
        stress = phones[vi][-1]
        if stress not in '12':
            continue
        if mono:
            continue
        if stress == '1' and not primary_used:
            primary_used = True
            marks[onset_start(phones, vi)] = 'ˈ'
            continue
        if vi == last_vowel:
            continue  # learner dictionaries drop final secondary stress
        nxt = next(x for x in vowels if x > vi)
        if coda_len(phones, vi, nxt) == 0:
            continue  # weak open syllable: a secondary mark here looks wrong
        marks[onset_start(phones, vi)] = 'ˌ'
    out = []
    for i, phone in enumerate(phones):
        if i in marks:
            out.append(marks[i])
        if is_vowel(phone):
            base, stress = phone[:-1], phone[-1]
            if base == 'AH':
                if stress in '12':
                    out.append('ʌ')
                else:
                    nxt = phones[i + 1] if i + 1 < len(phones) else ''
                    nxt2 = phones[i + 2] if i + 2 < len(phones) else ''
                    prev = phones[i - 1] if i > 0 else ''
                    wl = word.lower()
                    if nxt == 'D' and prev in ('T', 'D') and i + 1 == len(phones) - 1 and wl.endswith('ed'):
                        out.append('ɪ')          # -ed after t/d
                    elif nxt == 'Z' and prev in ('S', 'Z', 'SH', 'CH', 'JH'):
                        out.append('ɪ')          # -es after sibilant
                    elif nxt == 'S' and nxt2 == 'T' and (wl.endswith('ist') or wl.endswith('ister')):
                        out.append('ɪ')          # -ist / -ister
                    elif nxt == 'N' and nxt2 == 'JH':
                        out.append('ɪ')          # orange / challenge
                    elif nxt in ('JH',) or (nxt == 'D' and nxt2 == 'JH'):
                        if wl.endswith(('age', 'ege', 'idge', 'edge', 'odge', 'udge')):
                            out.append('ɪ')      # message / village / college
                        else:
                            out.append('ə')      # suggest / biology / intelligence
                    elif nxt == 'S' and i + 1 == len(phones) - 1 and wl.endswith(('ace', 'ice', 'ise')):
                        out.append('ɪ')          # palace / office / promise
                    else:
                        out.append('ə')
            elif base == 'ER':
                out.append('ɜːr' if stress in '12' else 'ər')
            elif stress == '0' and base == 'IY':
                out.append('i')
            elif stress == '0' and base == 'UW':
                out.append('u')
            else:
                out.append(VOWEL_MAP[base])
        else:
            out.append(CONS[phone])
    return '/' + ''.join(out) + '/'


ACRONYMS = {
    'AI': '/ˌeɪˈaɪ/', 'OK': '/ˌoʊˈkeɪ/', 'PE': '/ˌpiːˈiː/',
    'PLA': '/ˌpiː el ˈeɪ/', 'PRC': '/ˌpiː ɑːr ˈsiː/',
    'TV': '/ˌtiːˈviː/', 'UK': '/ˌjuːˈkeɪ/', 'UN': '/ˌjuːˈen/',
    'US': '/ˌjuːˈes/', 'USA': '/ˌjuː es ˈeɪ/', 'VR': '/ˌviːˈɑːr/',
    'WHO': '/ˌdʌbəljuː eɪtʃ ˈoʊ/',
}


def main():
    dry = '--dry-run' in sys.argv
    cmu = load_cmu()
    text = open(DATA, encoding='utf-8').read()
    units = json.loads(text[text.index('['):text.rindex(']') + 1])
    changed = missing = same = 0
    pending = []
    for unit in units:
        for word in unit['words']:
            raw = word['w']
            key = raw.lower()
            if raw.isupper() and raw in ACRONYMS:
                new = ACRONYMS[raw]
            else:
                new = OVERRIDES.get(key)
            if new is None:
                phones = cmu.get(key)
                if phones is None:
                    for brit, amer in SPELLING:
                        if brit in key:
                            phones = cmu.get(key.replace(brit, amer))
                            if phones:
                                break
                new = convert(phones, key) if phones else None
            if new is None:
                missing += 1
                pending.append(word['w'])
                continue
            if word.get('ipa') == new:
                same += 1
            else:
                changed += 1
                if dry and changed <= 80:
                    print(f"{word['w']:<24} {word.get('ipa',''):<24} -> {new}")
            word['ipa'] = new
    if missing:
        print('MISSING', missing, pending)
    print(f'changed={changed} same={same} missing={missing} total={changed + same + missing}')
    if not dry:
        open(DATA, 'w', encoding='utf-8').write(
            'const PEP_ALL_UNITS = ' +
            json.dumps(units, ensure_ascii=False, indent=2) + ';\n')
        print('written', DATA)


if __name__ == '__main__':
    main()
