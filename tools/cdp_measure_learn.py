#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Measure section heights of the learn screen at phone landscape size."""
import json
import subprocess
import tempfile
import time
import urllib.request
import sys

sys.path.insert(0, 'tools')
from cdp_test import CHROME, WS, evaluate

URL = "file:///Users/henry/code/app/magic-tool-for-english/web/index.html"
PORT = 9393
PROFILE = tempfile.mkdtemp(prefix='eg-measure-')


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
        time.sleep(1)
        ev = lambda x: evaluate(ws, x)

        ws.cmd('Emulation.setDeviceMetricsOverride',
               {'width': 800, 'height': 360, 'deviceScaleFactor': 2, 'mobile': True})
        time.sleep(0.3)
        ev("document.querySelector('.tab[data-screen=\"home\"]').click();1")
        time.sleep(0.3)
        ev("document.querySelector('#unitList [data-unit]').click();1")
        time.sleep(0.5)
        for step in range(4):
            r = ev("""(()=>{
              const g = s => { const el=document.querySelector(s); if(!el) return null;
                const b=el.getBoundingClientRect(); return {h:Math.round(b.height)} };
              const col1 = document.querySelector('.word-head');
              const col2 = document.querySelector('#stage > .illustration');
              const s=document.querySelector('#learnScroll');
              return {
                hero:g('.learn-hero'), strip:g('.word-strip-wrap'),
                stepper:g('.stepper'), card:g('.learn-card'),
                wordHead:col1?Math.round(col1.getBoundingClientRect().height):null,
                illu:col2?Math.round(col2.getBoundingClientRect().height):null,
                chunk:g('.chunk-map'),
                scrollH:Math.round(s.scrollHeight), clientH:Math.round(s.clientHeight),
                stageH:Math.round(document.querySelector('#stage').getBoundingClientRect().height)
              };
            })()""")
            print('step', step, json.dumps(r))
            if step < 3:
                ev("(function(){document.querySelectorAll('.step')[%d].click();return 1})()" % (step + 1))
                time.sleep(0.4)
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == '__main__':
    main()
