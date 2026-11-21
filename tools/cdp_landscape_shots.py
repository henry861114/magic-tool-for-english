#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Screenshot smoke test for landscape layout."""
import base64
import json
import subprocess
import tempfile
import time
import urllib.request
import sys

sys.path.insert(0, 'tools')
from cdp_test import CHROME, WS, evaluate

URL = "file:///Users/henry/code/app/magic-tool-for-english/web/index.html"
PORT = 9395
PROFILE = tempfile.mkdtemp(prefix='eg-shot-')
OUT = '/tmp/eg-land-shots'

import os
os.makedirs(OUT, exist_ok=True)


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
        ws = WS(page['webSocketDebuggerUrl'])
        ws.cmd('Runtime.enable')
        ws.cmd('Page.enable')
        time.sleep(1)
        ev = lambda x: evaluate(ws, x)

        def shot(name):
            data = ws.cmd('Page.captureScreenshot', {'format': 'png'})
            with open('%s/%s.png' % (OUT, name), 'wb') as f:
                f.write(base64.b64decode(data['result']['data']))

        def set_view(w, h):
            ws.cmd('Emulation.setDeviceMetricsOverride',
                   {'width': w, 'height': h, 'deviceScaleFactor': 2, 'mobile': w < 720})
            time.sleep(0.35)

        for (w, h, tag) in [(800, 360, 'phone'), (1280, 800, 'tablet')]:
            set_view(w, h)
            ev("document.querySelector('.tab[data-screen=\"home\"]').click();1")
            time.sleep(0.35)
            shot('%s-home' % tag)
            ev("document.querySelector('#unitList [data-unit]').click();1")
            time.sleep(0.5)
            shot('%s-learn0' % tag)
            ev("(function(){document.querySelectorAll('.step')[2].click();return 1})()")
            time.sleep(0.4)
            shot('%s-learn2' % tag)
            ev("document.querySelector('#learnBack').click();1")
            time.sleep(0.3)
            ev("document.querySelector('.tab[data-screen=\"me\"]').click();1")
            time.sleep(0.35)
            shot('%s-me' % tag)
        print('saved to', OUT)
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    main()
