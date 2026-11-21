#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Full-screen visual sweep for landscape/portrait layout audit."""
import base64
import json
import subprocess
import tempfile
import time
import urllib.request
import sys
import os

sys.path.insert(0, 'tools')
from cdp_test import CHROME, WS, evaluate

URL = "file:///Users/henry/code/app/magic-tool-for-english/web/index.html"
PORT = 9403
PROFILE = tempfile.mkdtemp(prefix='eg-sweep-')
OUT = '/tmp/eg-sweep'
os.makedirs(OUT, exist_ok=True)


def main():
    chrome = subprocess.Popen(
        [CHROME, '--headless=new', '--disable-gpu', '--mute-audio', '--hide-scrollbars',
         '--remote-debugging-port=%d' % PORT, '--user-data-dir=' + PROFILE,
         '--window-size=686,457', '--no-first-run', '--no-default-browser-check', URL],
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
            d = ws.cmd('Page.captureScreenshot', {'format': 'png'})
            with open('%s/%s.png' % (OUT, name), 'wb') as f:
                f.write(base64.b64decode(d['result']['data']))

        def set_view(w, h, mobile=True):
            ws.cmd('Emulation.setDeviceMetricsOverride',
                   {'width': w, 'height': h, 'deviceScaleFactor': 2, 'mobile': mobile})
            time.sleep(0.4)

        for w, h, tag in [(686, 457, 'land686'), (1280, 800, 'land1280'), (686, 1143, 'port686')]:
            set_view(w, h, w < 720)
            # home
            ev("localStorage.clear();location.reload();1")
            time.sleep(1.2)
            shot('%s-01-home' % tag)
            # learn steps
            ev("document.querySelector('#unitList [data-unit]').click();1")
            time.sleep(0.6)
            shot('%s-02-learn0' % tag)
            ev("(function(){document.querySelectorAll('.step')[1].click();return 1})()")
            time.sleep(0.6)
            shot('%s-03-quiz' % tag)
            ev("(function(){document.querySelectorAll('.step')[2].click();return 1})()")
            time.sleep(0.6)
            shot('%s-04-assemble' % tag)
            ev("(function(){document.querySelectorAll('.step')[3].click();return 1})()")
            time.sleep(0.6)
            shot('%s-05-write' % tag)
            ev("document.querySelector('#learnBack').click();1")
            time.sleep(0.4)
            # consolidate
            ev("document.querySelector('.tab[data-screen=\"consolidate\"]').click();1")
            time.sleep(0.5)
            shot('%s-06-consolidate' % tag)
            ev("(function(){document.querySelector('#selectAllBtn').click();return 1})()")
            time.sleep(0.3)
            ev("(function(){document.querySelector('#startDrill').click();return 1})()")
            time.sleep(0.6)
            shot('%s-07-drill' % tag)
            ev("(function(){const b=document.querySelector('#drillReveal');if(b)b.click();return 1})()")
            time.sleep(0.6)
            shot('%s-08-drill-answer' % tag)
            ev("(function(){const b=document.querySelector('#drillBack');if(b)b.click();return 1})()")
            time.sleep(0.4)
            # review / me
            ev("(function(){const b=document.querySelector('#quickWrong');b.click();return 1})()")
            time.sleep(0.5)
            shot('%s-09-review' % tag)
            ev("document.querySelector('#reviewBack').click();1")
            time.sleep(0.4)
            ev("document.querySelector('.tab[data-screen=\"me\"]').click();1")
            time.sleep(0.5)
            shot('%s-10-me' % tag)
        print('saved to', OUT)
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    main()
