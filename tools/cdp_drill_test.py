#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Regression test for the independent knowledge-base drill.

Guards the WORD_INDEX lookup used by startDrill() and the inline speaker
buttons.  Before WORD_INDEX existed, both paths threw ReferenceError.
"""
import json
import subprocess
import tempfile
import time
import urllib.request

from cdp_test import CHROME, URL, WS, evaluate

PORT = 9347
PROFILE = tempfile.mkdtemp(prefix="eg-drill-")


def main():
    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--disable-gpu", "--mute-audio",
         "--hide-scrollbars", "--autoplay-policy=no-user-gesture-required",
         "--remote-debugging-port=%d" % PORT,
         "--user-data-dir=" + PROFILE, "--window-size=430,932",
         "--no-first-run", "--no-default-browser-check", URL],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(50):
            try:
                data = json.load(urllib.request.urlopen("http://127.0.0.1:%d/json" % PORT))
                page = [x for x in data if x.get("type") == "page"][0]
                break
            except Exception:
                time.sleep(0.2)
        else:
            raise RuntimeError("chrome did not start")
        ws = WS(page["webSocketDebuggerUrl"])
        ws.cmd("Runtime.enable")
        time.sleep(1.0)

        def ev(expr):
            return evaluate(ws, expr)

        ev("""
        window.__errors = [];
        window.addEventListener('error', function (e) {
          window.__errors.push(String(e.message || e.error));
        });
        window.__played = [];
        const Orig = window.Audio;
        window.Audio = function (src) {
          const a = new Orig(src);
          if (src) window.__played.push(String(src));
          return a;
        };
        window.HTMLMediaElement.prototype.play = function () {
          const el = this;
          setTimeout(function () { if (el.onended) el.onended(); }, 2);
          return Promise.resolve();
        };
        1
        """)

        # open the independent knowledge base
        ev("document.querySelector('.tab[data-screen=\"consolidate\"]').click(); 1")
        time.sleep(0.4)
        count = ev("document.querySelectorAll('#consolGrid .kb-word').length")
        print("consol words:", count)
        if not count:
            raise SystemExit("FAIL: knowledge base is empty")

        # inline speaker button must resolve WORD_INDEX and play a word
        ev("window.__played = []; document.querySelector('#consolGrid [data-kbplay]').click(); 1")
        time.sleep(0.4)
        played = ev("window.__played.slice()")
        print("kbplay:", played)
        if not any("/audio/" in s for s in played):
            raise SystemExit("FAIL: inline speaker did not play word audio")

        # select three words and start the drill
        ev("""
        (() => {
          const cards = document.querySelectorAll('#consolGrid .kb-word');
          for (let i = 0; i < Math.min(3, cards.length); i++) cards[i].click();
          return 1;
        })()
        """)
        time.sleep(0.2)
        ev("document.querySelector('#startDrill').click(); 1")
        time.sleep(0.4)
        active = ev("document.querySelector('#screen-drill').classList.contains('active')")
        sub = ev("document.querySelector('#drillSub') && document.querySelector('#drillSub').textContent")
        errors = ev("window.__errors.slice()")
        print("drill active:", active, "progress:", sub)
        print("console errors:", errors)
        if not active:
            raise SystemExit("FAIL: drill screen did not open")
        if errors:
            raise SystemExit("FAIL: runtime errors: %r" % errors)
        print("OK")
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == "__main__":
    main()
