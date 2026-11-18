#!/usr/bin/env python3
"""Export a per-word IPA/audio audit report (CSV)."""
import csv
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA = os.path.join(ROOT, 'web', 'assets', 'pep_all.js')
UK_FILE = os.path.join(os.environ.get('TMPDIR', '/tmp'), 'en_UK_raw.txt')
OUT = os.path.join(ROOT, 'dist', 'ipa_audio_audit.csv')


def slug(t):
    return re.sub(r'[^a-z0-9]+', '_', t.lower()).strip('_')


def main():
    units = json.loads(open(DATA, encoding='utf-8').read().split('=', 1)[1].strip().rstrip(';'))
    uk = {}
    if os.path.exists(UK_FILE):
        for line in open(UK_FILE, encoding='utf-8', errors='ignore'):
            if '\t' not in line:
                continue
            w, rest = line.rstrip('\n').split('\t', 1)
            vals = re.findall(r'/[^/]+/', rest)
            if vals and w.lower() not in uk:
                uk[w.lower()] = vals[0]
    rows = []
    for unit in units:
        for word in unit['words']:
            w = word['w']
            key = word.get('audio') or slug(w)
            audio = os.path.join(ROOT, 'web', 'assets', 'audio', 'us', 'words', key + '.m4a')
            chunks = ' '.join('%s=%s' % (c[0], c[1] or '-') for c in word.get('chunks', []))
            rows.append({
                'grade': unit['grade'], 'term': unit['term'], 'unit': unit['id'],
                'theme': unit.get('theme', ''), 'word': w, 'ipa': word.get('ipa', ''),
                'uk_ipa': uk.get(w.lower(), ''),
                'chunks': chunks, 'audio_file': key + '.m4a',
                'audio_exists': 'yes' if os.path.exists(audio) else 'NO',
                'special_audio': word.get('audio', ''),
            })
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    with open(OUT, 'w', encoding='utf-8-sig', newline='') as f:
        wr = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        wr.writeheader()
        wr.writerows(rows)
    print('wrote', OUT, len(rows), 'rows',
          'missing audio', sum(1 for r in rows if r['audio_exists'] != 'yes'),
          'missing ipa', sum(1 for r in rows if not r['ipa']))


if __name__ == '__main__':
    main()
