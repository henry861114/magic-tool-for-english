#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify multi-letter chunks play as one blended clip and letters map per position."""
import json, subprocess, tempfile, time, urllib.request
from cdp_test import CHROME, URL, WS, evaluate
PORT = 9361
PROFILE = tempfile.mkdtemp(prefix="eg-chunk-")
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
        ev("window.__played=[];window.__origAudio=window.Audio;window.Audio=function(src){const a=new window.__origAudio(src);if(src)window.__played.push(String(src));return a;};window.HTMLMediaElement.prototype.play=function(){const el=this;setTimeout(function(){if(el.onended)el.onended();},2);return Promise.resolve();};1")
        ev("document.querySelector('.tab[data-screen=\"home\"]').click();1"); time.sleep(.3)
        ev("document.querySelector('#gradeChips [data-grade=\"all\"]').click();1"); time.sleep(.2)
        ev("document.querySelector('#termChips [data-term=\"全部\"]').click();1"); time.sleep(.2)
        ev("""(()=>{const name='science';const ui=UNITS.findIndex(u=>u.words.some(w=>w.w.toLowerCase()===name));const card=document.querySelector('#unitList [data-unit="'+ui+'"]');card.click();const chip=[...document.querySelectorAll('#wordStrip .word-chip')].find(c=>c.textContent.trim().toLowerCase()===name);chip.click();return 1})()"""); time.sleep(.4)
        ev("window.__played=[];document.querySelector('#stage .chunk[data-chunk=\"1\"]').click();1"); time.sleep(.3)
        chunk=ev("window.__played.slice()")
        assert chunk and all('/chunks/' in s for s in chunk), chunk
        ev("document.querySelector('#stepper [data-step=\"2\"]').click();1"); time.sleep(.4)
        def tap(idx):
            ev("(()=>{window.__played=[];const btn=document.querySelector('[data-assemble-piece=\"%d\"]');btn.click();return 1})()"%idx)
            time.sleep(.25)
            return [s.split('?')[0].split('/')[-1].replace('.wav','') for s in ev("window.__played.slice()")]
        got={}
        got[6]=tap(6)  # final silent e first, so it does not complete the word
        for i in [0,1,2,3,4,5]:
            got[i]=tap(i)
        print('chunk ence:',chunk)
        print('letters:',got)
        assert got[3]==['v_schwa'], got[3]
        assert got[4] in (['c_n'],['n_final']), got[4]
        assert got[5][0]=='c_s', got[5]
        assert got[6]==[], got[6]
        assert got[0]==['c_s'], got[0]
        assert got[1]==[], got[1]
        assert got[2]==['d_ai'], got[2]
        print('OK')
    finally:
        chrome.terminate()
        try: chrome.wait(timeout=3)
        except Exception: chrome.kill()
if __name__=='__main__': main()
