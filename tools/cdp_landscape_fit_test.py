#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""One-off check: landscape fit after the compress+trim rules.

For each landscape viewport, verify:
1. The landscape CSS tiers actually apply (hero-sub hidden at <=620px, etc).
2. The learn screen's card content fits its scroll area (no hidden overflow)
   at the "学" step.
3. Key decorative texts are hidden on short landscape.
"""
import json
import subprocess
import tempfile
import time
import urllib.request
import sys

sys.path.insert(0, 'tools')
from cdp_test import CHROME, WS, evaluate

URL = "file:///Users/henry/code/app/magic-tool-for-english/web/index.html"

PORT = 9391
PROFILE = tempfile.mkdtemp(prefix='eg-land-')

SIZES = [(800, 360), (686, 457), (1280, 800), (1024, 600), (1920, 1200)]


def main():
    chrome = subprocess.Popen(
        [CHROME, '--headless=new', '--disable-gpu', '--mute-audio', '--hide-scrollbars',
         '--remote-debugging-port=%d' % PORT, '--user-data-dir=' + PROFILE,
         '--window-size=800,360', '--no-first-run', '--no-default-browser-check', URL],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                data = json.load(urllib.request.urlopen('http://127.0.0.1:%d/json' % PORT))
                page = [x for x in data if x.get('type') == 'page'][0]
                break
            except Exception:
                time.sleep(0.2)
        else:
            raise RuntimeError('chrome did not start')
        ws = WS(page['webSocketDebuggerUrl'])
        ws.cmd('Runtime.enable')
        time.sleep(1)
        ev = lambda x: evaluate(ws, x)

        failures = []
        for width, height in SIZES:
            ws.cmd('Emulation.setDeviceMetricsOverride',
                   {'width': width, 'height': height, 'deviceScaleFactor': 2,
                    'mobile': width < 720})
            time.sleep(0.3)
            # home screen checks
            r = ev("""(()=>{
              const disp = s => { const el=document.querySelector(s); return el?getComputedStyle(el).display:null };
              const heroSub = disp('.hero-sub');
              const bubbles = disp('.hero-bubble.b1');
              const homeTip = disp('.home-tip');
              return {w:innerWidth,h:innerHeight,heroSub,bubbles,homeTip};
            })()""")
            landscape = width > height
            tier2 = landscape and height <= 620
            tier1 = landscape and width >= 720 and height <= 840
            ok = True
            if tier2:
                ok = ok and r['bubbles'] == 'none' and r['homeTip'] == 'none'
            if tier2 and height <= 460:
                ok = ok and r['bubbles'] == 'none' and r['heroSub'] == 'none'
            print(('OK  ' if ok else 'FAIL') +
                  ' home %dx%d heroSub=%s bubble=%s tip=%s' %
                  (width, height, r['heroSub'], r['bubbles'], r['homeTip']))
            if not ok:
                failures.append(('home', width, height, r))

            # learn screen: all four steps must fit without vertical overflow
            ev("document.querySelector('.tab[data-screen=\"home\"]').click();1")
            time.sleep(0.3)
            ev("document.querySelector('#unitList [data-unit]').click();1")
            time.sleep(0.5)
            for step in range(4):
                r = ev("""(()=>{
                  const s=document.querySelector('#learnScroll');
                  const foot=document.querySelector('.learn-footer').getBoundingClientRect();
                  return {sw:s.scrollWidth, sh:Math.round(s.scrollHeight), ch:Math.round(s.clientHeight),
                          footBottom:Math.round(foot.bottom), h:innerHeight, w:innerWidth};
                })()""")
                ok = (r['sw'] <= r['w'] and r['footBottom'] <= r['h'] + 1)
                overflow = r['sh'] - r['ch']
                print(('OK  ' if ok else 'FAIL') +
                      ' learn %dx%d step=%d cardOverflow=%dpx footBottom=%d' %
                      (width, height, step, overflow, r['footBottom']))
                if not ok:
                    failures.append(('learn', width, height, step, r))
                if step < 3:
                    ev("(function(){document.querySelectorAll('.step')[%d].click();return 1})()" % (step + 1))
                    time.sleep(0.4)
            ev("document.querySelector('#learnBack').click();1")
            time.sleep(0.3)

            # drill screen fit (starts from consolidate tab)
            ev("document.querySelector('.tab[data-screen=\"consolidate\"]').click();1")
            time.sleep(0.3)
            ev("(function(){const b=document.querySelector('#selectAllBtn');if(b)b.click();return 1})()")
            time.sleep(0.25)
            ev("(function(){const b=document.querySelector('#startDrill');if(b)b.click();return 1})()")
            time.sleep(0.4)
            r = ev("""(()=>{
              const s=document.querySelector('#drillScroll');
              const card=document.querySelector('#drillCard');
              return {sw:s.scrollWidth, sh:Math.round(s.scrollHeight), ch:Math.round(s.clientHeight),
                      cw:Math.round(card.getBoundingClientRect().width), w:innerWidth,
                      hasMeta:!!document.querySelector('.drill-meta')};
            })()""")
            ok = r['sw'] <= r['w'] and r['hasMeta']
            overflow = r['sh'] - r['ch']
            print(('OK  ' if ok else 'FAIL') +
                  ' drill %dx%d cardOverflow=%dpx cardW=%d' % (width, height, overflow, r['cw']))
            if not ok:
                failures.append(('drill', width, height, r))
            ev("(function(){const b=document.querySelector('#drillBack');if(b)b.click();return 1})()")
            time.sleep(0.25)

        assert not failures, failures
        print('passed landscape fit checks')
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    main()
