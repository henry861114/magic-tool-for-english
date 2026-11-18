#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify runtime resolution detection.

The page reads physical pixels + density from AndroidBridge.getScreenInfo()
and derives the layout bucket.  In a browser preview there is no bridge, so
this test injects a fake bridge and calls EGDetectScreen() to cover the
1920- and 2160-class tablets plus portrait/landscape.
"""
import json
import subprocess
import tempfile
import time
import urllib.request
import sys

sys.path.insert(0, 'tools')
from cdp_test import CHROME, URL, WS, evaluate

PORT = 9395
PROFILE = tempfile.mkdtemp(prefix='eg-screen-')


def fake_bridge(js):
    return "window.AndroidBridge={getScreenInfo:function(){return JSON.stringify(%s);}};" % json.dumps(js)


def main():
    chrome = subprocess.Popen(
        [CHROME, '--headless=new', '--disable-gpu', '--mute-audio', '--hide-scrollbars',
         '--remote-debugging-port=%d' % PORT, '--user-data-dir=' + PROFILE,
         '--window-size=900,700', '--no-first-run', '--no-default-browser-check', URL],
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

        def view(width, height):
            ws.cmd('Emulation.setDeviceMetricsOverride',
                   {'width': width, 'height': height, 'deviceScaleFactor': 2, 'mobile': False})
            time.sleep(0.25)

        def detect(width_px, height_px, density, css_w, css_h):
            view(css_w, css_h)
            ev(fake_bridge({
                'widthPx': width_px, 'heightPx': height_px,
                'longEdgePx': max(width_px, height_px), 'shortEdgePx': min(width_px, height_px),
                'density': density, 'densityDpi': int(density * 160),
                'widthDp': round(width_px / density), 'heightDp': round(height_px / density),
                'smallestWidthDp': round(min(width_px, height_px) / density),
                'orientation': 'landscape' if width_px > height_px else 'portrait',
                'sdk': 34,
            }) + "window.EGDetectScreen()")
            time.sleep(0.2)
            return ev("window.EG_SCREEN")

        failures = []

        # 1920×1200 tablet at 1.5x → 1280×800 logical (5 columns).
        r = detect(1920, 1200, 1.5, 1280, 800)
        print('1920x1200@1.5:', r)
        ok = (r['physical'] == '1920×1200' and abs(r['density'] - 1.5) < 0.01
              and r['res'] == '1920' and r['layout'] == 'md'
              and r['cssWidth'] == 1280 and r['orientation'] == 'landscape' and r['native'])
        if not ok:
            failures.append(('1920/1.5', r))

        # 2160×1440 tablet at 1.5x → 1440×960 logical.
        r = detect(2160, 1440, 1.5, 1440, 960)
        print('2160x1440@1.5:', r)
        ok = (r['physical'] == '2160×1440' and r['res'] == '2160'
              and r['layout'] == 'md' and r['orientation'] == 'landscape')
        if not ok:
            failures.append(('2160/1.5', r))

        # 1920×1200 at 1.0x → 1920 logical (7 columns).
        r = detect(1920, 1200, 1.0, 1920, 1200)
        print('1920x1200@1.0:', r)
        ok = (r['physical'] == '1920×1200' and r['res'] == '1920'
              and r['layout'] == 'xl' and r['cssWidth'] == 1920)
        if not ok:
            failures.append(('1920/1.0', r))
        ev("document.querySelector('.tab[data-screen=\"consolidate\"]').click();1")
        time.sleep(0.35)
        cols = ev("getComputedStyle(document.querySelector('#consolGrid')).gridTemplateColumns.split(' ').length")
        print('  columns:', cols)
        if cols != 7:
            failures.append(('cols', cols))

        # Portrait 1200×1920 at 1.0x.
        r = detect(1200, 1920, 1.0, 1200, 1920)
        print('1200x1920@1.0:', r)
        ok = (r['physical'] == '1920×1200' and r['orientation'] == 'portrait'
              and r['layout'] == 'tab')
        if not ok:
            failures.append(('portrait', r))

        # The 我的 page shows the detected values.
        ev("document.querySelector('.tab[data-screen=\"me\"]').click();1")
        time.sleep(0.35)
        info = ev("document.querySelector('#screenInfo').textContent")
        print('me screen info:', info)
        for needle in ('1920×1200', '1.00x', '1200×1920dp', '竖屏'):
            if needle not in info:
                failures.append(('info', needle, info))

        # data-* attributes are present for CSS.
        attrs = ev("({res:document.documentElement.dataset.res,layout:document.documentElement.dataset.layout,orientation:document.documentElement.dataset.orientation})")
        print('attrs:', attrs)
        if attrs != {'res': '1920', 'layout': 'tab', 'orientation': 'portrait'}:
            failures.append(('attrs', attrs))

        assert not failures, failures
        print('passed screen detection')
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    main()
