#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify 写一写 uses manual answer confirmation (no OCR/ASR)."""
import json, subprocess, tempfile, time, urllib.request
from cdp_test import CHROME, URL, WS, evaluate
PORT = 9357
PROFILE = tempfile.mkdtemp(prefix="eg-write-")
def main():
    chrome=subprocess.Popen([CHROME,"--headless=new","--disable-gpu","--mute-audio","--hide-scrollbars","--autoplay-policy=no-user-gesture-required","--remote-debugging-port=%d"%PORT,"--user-data-dir="+PROFILE,"--window-size=430,932","--no-first-run","--no-default-browser-check",URL],stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                data=json.load(urllib.request.urlopen("http://127.0.0.1:%d/json"%PORT)); page=[x for x in data if x.get("type")=="page"][0]; break
            except Exception: time.sleep(.2)
        else: raise RuntimeError("chrome did not start")
        ws=WS(page["webSocketDebuggerUrl"]); ws.cmd("Runtime.enable"); time.sleep(1)
        def ev(x): return evaluate(ws,x)
        ev("window.__errors=[];window.addEventListener('error',e=>window.__errors.push(String(e.message||e.error)));1")
        ev("document.querySelector('.tab[data-screen=\"home\"]').click();1"); time.sleep(.3)
        ev("document.querySelector('#unitList .unit-card').click();1"); time.sleep(.3)
        ev("document.querySelector('#wordStrip .word-chip').click();1"); time.sleep(.3)
        ev("document.querySelector('#stepper [data-step=\"3\"]').click();1"); time.sleep(.5)
        print('back icon:', ev("document.querySelector('#learnBack').innerHTML.length>0"))
        print('handwriting button:', ev("!!document.querySelector('#handwritingIme')"))
        ev("""(()=>{const c=document.querySelector('#writeCanvas');const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle='#3C79C6';ctx.font='700 '+Math.round(c.height*.5)+'px Arial';ctx.fillText('cat',c.width*.2,c.height*.6);return 1})()""")
        ev("document.querySelector('#submitWrite').click();1"); time.sleep(.5)
        text=ev("document.querySelector('#writeResult').innerText")
        print('confirm text:', text.replace('\n',' | '))
        ok = ('对照标准答案' in text and '我写对了' in text and '再写一次' in text)
        ev("document.querySelector('#selfCorrect').click();1"); time.sleep(.3)
        text2=ev("document.querySelector('#writeResult').innerText")
        print('after confirm:', text2.replace('\n',' | '))
        ok = ok and ('写对啦' in text2)
        print('errors:', ev("window.__errors"))
        if not ok: raise SystemExit(1)
        print('OK')
    finally:
        chrome.terminate()
        try: chrome.wait(timeout=3)
        except Exception: chrome.kill()
if __name__=='__main__': main()
