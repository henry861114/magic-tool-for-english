#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""批量抓取人教版 PEP 各册词表、配图，生成 pep_all.js 与离线音频。
仅用于内容制作；运行环境需要 cmudict/pyphen 与 macOS say。"""
import os, re, html, json, sys, time, subprocess, urllib.request
from io import BytesIO
from concurrent.futures import ThreadPoolExecutor

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TMP = '/private/var/folders/6_/6ny6nzk55wg9gt606hf6vsrc0000gn/T/opencode'
sys.path.insert(0, os.path.join(TMP, 'pylibs'))
sys.path.insert(0, os.path.join(ROOT, 'tools'))
import cmudict, pyphen
from make_audio import make_clip, VOICES, AUDIO

VOLUMES = [
    ('3', '上册', 'sanshang', 'pep3s_2024', '三年级上册'),
    ('3', '下册', 'sanxia', 'pep3x_2025', '三年级下册'),
    ('4', '上册', 'sishang', 'pep4s_2025', '四年级上册'),
    ('4', '下册', 'sixia', 'pep4x_2026', '四年级下册'),
    ('5', '上册', 'wushang', 'pep5s_2026', '五年级上册'),
    ('5', '下册', 'wuxia', 'peps5x', '五年级下册'),
    ('6', '上册', 'liushang', 'pep6s_2026', '六年级上册'),
    ('6', '下册', 'liuxia', 'peps6x', '六年级下册'),
    ('7', '上册', 'qishang', 'xc7s_2024', '七年级上册'),
    ('7', '下册', 'qixia', 'xc7x_2025', '七年级下册'),
    ('8', '上册', 'bashang', 'xc8s_2025', '八年级上册'),
    ('8', '下册', 'baxia', 'xc8x_2026', '八年级下册'),
    ('9', '全册', 'jiuquan', 'xc9s_2026', '九年级全册'),
]
PALETTE = {
    '3': ('#F2913D', '#FFF1E2'), '4': ('#5B9CF0', '#EAF2FF'), '5': ('#E86A92', '#FFEDF3'),
    '6': ('#4CAF7D', '#EAF8F0'), '7': ('#7C8FE0', '#EEF1FF'), '8': ('#3E8FA8', '#E8F7FA'),
    '9': ('#8A6FD1', '#F2EEFF'),
}
UNIT_EMOJI = '📘'

def fetch(url, timeout=30):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    return urllib.request.urlopen(req, timeout=timeout).read()

def slug(text):
    return re.sub(r'[^a-z0-9]+', '_', text.lower()).strip('_')

def parse_units(page_html):
    """每个 danci-wrap 是一个单元"""
    blocks = re.split(r'<div class="danci-wrap', page_html)[1:]
    out = []
    for b in blocks:
        items = re.findall(r'<li class="dc-item".*?</li>', b, re.S)
        words = []
        for it in items:
            m = re.search(r'<p class="en"[^>]*>(.*?)</p>', it, re.S)
            if not m: continue
            w = html.unescape(re.sub(r'<[^>]+>', '', m.group(1))).strip()
            c = re.search(r'<p class="cn"[^>]*>(.*?)</p>', it, re.S)
            cn = html.unescape(re.sub(r'<[^>]+>', '', c.group(1))).strip() if c else ''
            im = re.search(r'<img[^>]+src="([^"]+)"', it, re.S)
            img = html.unescape(im.group(1)) if im else ''
            if w:
                words.append((w, cn, img))
        if words:
            out.append(words)
    return out

def parse_catalog(edition):
    url = 'http://www.dzkbw.com/books/rjb/yingyu/%s/' % edition
    try:
        s = fetch(url).decode('gbk', 'ignore')
    except Exception as e:
        return []
    titles = []
    for m in re.finditer(r'<a[^>]+href=["\']([^"\']+\.htm)["\'][^>]*>(.*?)</a>', s, re.S):
        text = html.unescape(re.sub(r'<[^>]+>', '', m.group(2))).strip()
        mm = re.match(r'Unit\s*(\d+)\s*(.*)', text, re.I)
        if mm:
            titles.append((int(mm.group(1)), mm.group(2).strip()))
    # unique by number, keep order
    seen = {}
    for n, t in titles:
        if n not in seen:
            seen[n] = t
    return [seen[k] for k in sorted(seen)]

# CMU IPA
AMAP = {'AA':'ɑː','AE':'æ','AH':'ʌ','AO':'ɔː','AW':'aʊ','AY':'aɪ','EH':'e','ER':'ɜːr','EY':'eɪ','IH':'ɪ','IY':'iː','OW':'oʊ','OY':'ɔɪ','UH':'ʊ','UW':'uː',
 'B':'b','CH':'tʃ','D':'d','DH':'ð','F':'f','G':'ɡ','HH':'h','JH':'dʒ','K':'k','L':'l','M':'m','N':'n','NG':'ŋ','P':'p','R':'r','S':'s','SH':'ʃ','T':'t','TH':'θ','V':'v','W':'w','Y':'j','Z':'z','ZH':'ʒ'}
VOWELS = {'AA','AE','AH','AO','AW','AY','EH','ER','EY','IH','IY','OW','OY','UH','UW'}
CMU = cmudict.dict()
def base(p): return re.sub(r'\d', '', p)
def phones_of(w):
    key = w.lower().replace("'", '').replace('-', ' ')
    out = []
    for part in key.split():
        e = CMU.get(part)
        if not e: return None
        out.extend(e[0])
    return out
def ipa_of(phones):
    if not phones: return ''
    return '/' + ''.join(AMAP.get(base(p), '') for p in phones) + '/'

VOWEL_RE = re.compile(r'(?:eigh|igh|air|ear|eer|our|ure|oa|oo|ee|ea|ai|ay|ow|ou|ue|ui|ey|oi|oy|aw|au|ew|ie|[aeiouy])', re.I)
def split_grapheme(syl):
    m = VOWEL_RE.search(syl)
    if not m: return syl, '', ''
    a = m.start(); b = a
    while b < len(syl) and syl[b].lower() in 'aeiouy': b += 1
    return syl[:a], syl[a:b], syl[b:]

def split_phones(phones, n):
    if not phones: return [[] for _ in range(n)]
    vp = [i for i, p in enumerate(phones) if base(p) in VOWELS]
    if len(vp) == n:
        out = []; start = 0
        for k, vi in enumerate(vp):
            end = len(phones) if k == len(vp) - 1 else (vi + 1 + vp[k + 1]) // 2
            out.append(phones[start:end]); start = end
        return out
    out = []; per = len(phones) / max(1, n)
    for i in range(n):
        out.append(phones[int(round(i * per)):int(round((i + 1) * per))])
    return out

def make_chunks(word, phones, sylls):
    groups = split_phones(phones, len(sylls))
    chunks = []
    for syl, grp in zip(sylls, groups):
        on, nu, co = split_grapheme(syl)
        vp = [i for i, p in enumerate(grp) if base(p) in VOWELS]
        if vp:
            v0, v1 = vp[0], vp[-1]
            op, np, cp = grp[:v0], grp[v0:v1+1], grp[v1+1:]
        else:
            op, np, cp = grp, [], []
        for text, ph in ((on, op), (nu, np), (co, cp)):
            if not text: continue
            chunks.append([text, ipa_of(ph), 1 if any(c.lower() in 'aeiouy' for c in text) else 0])
    if not chunks:
        chunks = [[word, ipa_of(phones), 1]]
    if ''.join(c[0] for c in chunks).lower() != word.lower():
        chunks = [[word, ipa_of(phones), 1]]
    return chunks

def get_image(word, url):
    path = os.path.join(ROOT, 'web', 'assets', 'img', 'pep', slug(word) + '.jpg')
    if os.path.exists(path): return 'assets/img/pep/' + slug(word) + '.jpg'
    if not url: return ''
    try:
        data = fetch(url, 25)
        im = Image.open(BytesIO(data)).convert('RGB')
        im.thumbnail((320, 320), Image.LANCZOS)
        os.makedirs(os.path.dirname(path), exist_ok=True)
        im.save(path, 'JPEG', quality=82, optimize=True)
        return 'assets/img/pep/' + slug(word) + '.jpg'
    except Exception:
        return ''

def main():
    all_units = []
    all_words = {}  # slug -> word
    for grade, term, path, edition, label in VOLUMES:
        print('==', label, path)
        try:
            page = fetch('https://yyld.51jiaoxi.com/%s/rjbp_danci.html' % path if grade in '3456' else 'https://yyld.51jiaoxi.com/%s/rjxmbb_danci.html' % path).decode('utf-8', 'ignore')
        except Exception as e:
            print('  fetch fail', e); continue
        blocks = parse_units(page)
        titles = parse_catalog(edition)
        print('  units', len(blocks), 'catalog', len(titles), titles[:4])
        color, tint = PALETTE[grade]
        for i, words in enumerate(blocks, 1):
            uw = []
            for w, cn, imgurl in words:
                if ' ' in w:  # 短语暂不进入六步拼写，避免空格破坏拼写校验
                    continue
                phones = phones_of(w)
                ipa = ipa_of(phones)
                hy = pyphen.Pyphen(lang='en_US').inserted(w.lower())
                sylls = [x for x in hy.split('-') if x] or [w.lower()]
                if '-' in w or "'" in w:
                    sylls = [w.lower()]
                # 保持原词大小写拆分
                sylls2 = []
                pos = 0
                low = w.lower()
                for sy in sylls:
                    sylls2.append(w[pos:pos+len(sy)]); pos += len(sy)
                if ''.join(sylls2).lower() != w.lower():
                    sylls2 = [w]
                chunks = make_chunks(w, phones, sylls2) if phones else [[w, ipa, 1]]
                parts = sylls2 if len(sylls2) > 1 else [w]
                if ''.join(parts).lower() != w.lower(): parts = [w]
                uw.append({'w': w, 'ipa': ipa, 'cn': cn, 'emoji': UNIT_EMOJI,
                           'chunks': chunks, 'parts': parts,
                           'sentence': '', 'sentenceCn': '',
                           'img': get_image(w, imgurl)})
                all_words[slug(w)] = w
            if not uw: continue
            title = 'Unit %d' % i
            theme = ''
            if i <= len(titles):
                theme = titles[i-1]
            all_units.append({
                'id': 'p%s%s%d' % (grade, 's' if term == '上册' else ('x' if term == '下册' else 'q'), i),
                'grade': 'g' + grade,
                'term': term,
                'title': title,
                'theme': theme,
                'emoji': UNIT_EMOJI,
                'color': color,
                'tint': tint,
                'words': uw
            })
            print('  unit', i, len(uw), theme)
    js = 'const PEP_ALL_UNITS = ' + json.dumps(all_units, ensure_ascii=False, indent=2) + ';\n'
    open(os.path.join(ROOT, 'web', 'assets', 'pep_all.js'), 'w', encoding='utf-8').write(js)
    print('units', len(all_units), 'words', sum(len(u['words']) for u in all_units))
    json.dump(sorted(all_words), open(os.path.join(ROOT, 'tools', 'pep_words.json'), 'w'), ensure_ascii=False)

    # generate audio for all words, both accents (existing files skipped)
    tasks = []
    for slugw, w in all_words.items():
        for acc, voice in VOICES.items():
            tasks.append((w, voice, os.path.join(AUDIO, acc, 'words', slugw + '.m4a')))
    print('audio tasks', len(tasks))
    def run(t):
        try: make_clip(t[0], t[1], t[2])
        except Exception as e: print('audio fail', t[0], e)
    with ThreadPoolExecutor(max_workers=6) as pool:
        pool.map(run, tasks)
    print('done')

if __name__ == '__main__':
    main()
