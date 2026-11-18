#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regression test for horizontal overflow / tablet + landscape layout.

Checks the consolidate grid at phone, tablet and large-screen CSS widths
(including 1920x1200 and 2560x1600), and makes sure the learn screen fits
in landscape without clipping the bottom controls.
"""
import json
import subprocess
import tempfile
import time
import urllib.request
import sys

sys.path.insert(0, 'tools')
from cdp_test import CHROME, URL, WS, evaluate

PORT = 9385
PROFILE = tempfile.mkdtemp(prefix='eg-layout-')

# (CSS width, CSS height) — the WebView viewport, not physical pixels.
SIZES = [
    (320, 800), (360, 800), (393, 852), (412, 915), (480, 800),
    (768, 1024), (1024, 768),
    (1280, 800), (1600, 900), (1920, 1200), (2560, 1600),
    (1200, 1920),
]


def max_app(width):
    if width >= 1900:
        return 1840
    if width >= 1600:
        return 1560
    if width >= 1280:
        return 1240
    if width >= 1024:
        return 1120
    if width >= 720:
        return 860
    return 460


def min_columns(width):
    if width >= 1900:
        return 7
    if width >= 1600:
        return 6
    if width >= 1280:
        return 5
    if width >= 1024:
        return 4
    if width >= 720:
        return 3
    return 2


def main():
    chrome = subprocess.Popen(
        [CHROME, '--headless=new', '--disable-gpu', '--mute-audio', '--hide-scrollbars',
         '--remote-debugging-port=%d' % PORT, '--user-data-dir=' + PROFILE,
         '--window-size=400,900', '--no-first-run', '--no-default-browser-check', URL],
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

        def set_view(width, height):
            ws.cmd('Emulation.setDeviceMetricsOverride',
                   {'width': width, 'height': height, 'deviceScaleFactor': 2,
                    'mobile': width < 720})
            time.sleep(0.25)

        def open_consolidate():
            ev("document.querySelector('.tab[data-screen=\"consolidate\"]').click();1")
            time.sleep(0.35)
            ev("(()=>{const c=[...document.querySelectorAll('#consolGrades [data-grade]')].find(x=>x.textContent.includes('五年级'));if(c)c.click();return 1})()")
            time.sleep(0.25)

        failures = []
        open_consolidate()
        for width, height in SIZES:
            set_view(width, height)
            open_consolidate()
            r = ev("""(()=>{
              const g=document.querySelector('#consolGrid');
              const card=document.querySelector('#consolGrid .kb-word');
              const app=document.querySelector('.app');
              const cb=card?card.getBoundingClientRect():null;
              return {
                w:innerWidth, h:innerHeight,
                docSW:document.documentElement.scrollWidth,
                gridSW:g.scrollWidth, gridCW:g.clientWidth,
                appWidth:Math.round(app.getBoundingClientRect().width),
                cardRight:cb?Math.round(cb.right):null,
                cardWidth:cb?Math.round(cb.width):null,
                cols:getComputedStyle(g).gridTemplateColumns
              };
            })()""")
            col_count = len(r['cols'].split())
            ok = (r['docSW'] <= r['w'] and r['gridSW'] <= r['gridCW']
                  and r['cardWidth'] < r['w'] * 0.6 and r['cardRight'] <= r['w'])
            ok = ok and col_count >= min_columns(width)
            if width >= 720:
                ok = ok and r['appWidth'] >= min(width, max_app(width)) - 40
            print(('OK  ' if ok else 'FAIL')
                  + ' %dx%d cols=%s card=%spx app=%spx docSW=%d'
                  % (width, height, r['cols'], r['cardWidth'], r['appWidth'], r['docSW']))
            if not ok:
                failures.append(('grid', width, height, r))

        # Every main tab must fit without horizontal scrolling at the widest size.
        set_view(1920, 1200)
        for tab in ('home', 'review', 'consolidate', 'me'):
            ev("document.querySelector('.tab[data-screen=\"%s\"]').click();1" % tab)
            time.sleep(0.3)
            r = ev("({w:innerWidth,sw:document.documentElement.scrollWidth})")
            ok = r['sw'] <= r['w']
            print(('OK  ' if ok else 'FAIL') + ' tab=%s sw=%d w=%d' % (tab, r['sw'], r['w']))
            if not ok:
                failures.append(('tab', tab, r))

        # Learn screen in landscape: footer and controls must stay on screen.
        for width, height in ((800, 360), (1280, 800), (1920, 1200)):
            set_view(width, height)
            ev("document.querySelector('.tab[data-screen=\"home\"]').click();1")
            time.sleep(0.3)
            ev("document.querySelector('#unitList [data-unit]').click();1")
            time.sleep(0.45)
            r = ev("""(()=>{
              const foot=document.querySelector('.learn-footer').getBoundingClientRect();
              const card=document.querySelector('.learn-card').getBoundingClientRect();
              return {w:innerWidth,h:innerHeight,sw:document.documentElement.scrollWidth,
                      footBottom:Math.round(foot.bottom),cardW:Math.round(card.width)};
            })()""")
            ok = (r['sw'] <= r['w'] and r['footBottom'] <= r['h'] + 1
                  and r['cardW'] <= r['w'])
            print(('OK  ' if ok else 'FAIL')
                  + ' learn %dx%d card=%spx footBottom=%d h=%d'
                  % (width, height, r['cardW'], r['footBottom'], r['h']))
            if not ok:
                failures.append(('learn', width, height, r))

        assert not failures, failures
        print('passed layout checks')
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    main()
