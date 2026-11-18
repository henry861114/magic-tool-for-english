#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Verify context-aware pronunciation in the four-step flow.

Covers:
  * 拆拼 letter taps use the letter's sound in the current word
  * word-final /l/, /t/ use the same-speaker allophone
  * tapping a chunk uses that word's IPA (ea in teacher = /iː/)
  * a final silent e does not play the preceding consonant
"""
import json
import subprocess
import tempfile
import time
import urllib.request

from cdp_test import CHROME, URL, WS, evaluate

PORT = 9341
PROFILE = tempfile.mkdtemp(prefix="eg-scene-")

# word, tapped letter, expected phonics file
LETTER_CASES = [
    ("name", "a", "d_ei"),
    ("name", "e", None),
    ("cat", "a", "v_ae"),
    ("cat", "t", "t_final"),
    ("ball", "l", "l_dark"),
    ("like", "l", "l_clear"),
]

# word, chunk index, expected first phonics file
CHUNK_CASES = [
    ("teacher", 1, "v_i_long"),
    ("teacher", 3, "r_schwa"),
    ("car", 1, "r_ah"),
    ("world", 2, "l_dark"),
]


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
        window.__played = [];
        window.__origAudio = window.Audio;
        window.Audio = function (src) {
          const a = new window.__origAudio(src);
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

        def open_word(name):
            return ev("""
            (() => {
              const name = %s;
              const ui = UNITS.findIndex(u => u.words.some(w => w.w.toLowerCase() === name));
              if (ui < 0) return {error: 'word not found'};
              document.querySelector('.tab[data-screen="home"]').click();
              const ga = document.querySelector('#gradeChips [data-grade="all"]');
              if (ga) ga.click();
              const ta = document.querySelector('#termChips [data-term="全部"]');
              if (ta) ta.click();
              const card = document.querySelector('#unitList [data-unit="' + ui + '"]');
              if (!card) return {error: 'unit card hidden', ui};
              card.click();
              const chip = [...document.querySelectorAll('#wordStrip .word-chip')]
                .find(c => c.textContent.trim().toLowerCase() === name);
              if (!chip) return {error: 'word chip missing', ui};
              chip.click();
              return {ok: 1};
            })()
            """ % json.dumps(name))

        def set_step(n):
            return ev("""
            (() => {
              const s = document.querySelector('#stepper [data-step="%d"]');
              if (!s) return false;
              s.click();
              return true;
            })()
            """ % n)

        def click_letter(ch):
            return ev("""
            (() => {
              window.__played = [];
              const el = [...document.querySelectorAll('.letter-piece')]
                .find(e => e.textContent.trim() === %s);
              if (!el) return {error: 'letter tile missing'};
              el.click();
              return {ok: 1};
            })()
            """ % json.dumps(ch))

        def click_chunk(i):
            return ev("""
            (() => {
              window.__played = [];
              const el = document.querySelector('.chunk[data-chunk="%d"]');
              if (!el) return {error: 'chunk missing'};
              el.click();
              return {ok: 1};
            })()
            """ % i)

        def played():
            time.sleep(0.5)
            return ev("window.__played.filter(s => s.indexOf('phonics/') >= 0)"
                      ".map(s => s.split('/').pop().split('?')[0].replace('.wav', ''))")

        failed = []
        for word, ch, expected in LETTER_CASES:
            r = open_word(word)
            set_step(2)
            r2 = click_letter(ch)
            files = played()
            ok = r.get("ok") and r2.get("ok") and (files[:1] == [expected] if expected else files == [])
            print(("OK  " if ok else "FAIL") + " letter %s/%s -> %s" % (word, ch, files))
            if not ok:
                failed.append((word, ch, expected, files, r, r2))

        for word, idx, expected in CHUNK_CASES:
            r = open_word(word)
            set_step(0)
            r2 = click_chunk(idx)
            files = played()
            ok = r.get("ok") and r2.get("ok") and files[:1] == [expected]
            print(("OK  " if ok else "FAIL") + " chunk  %s[%d] -> %s" % (word, idx, files))
            if not ok:
                failed.append((word, idx, expected, files, r, r2))

        print("passed %d/%d" % (len(LETTER_CASES) + len(CHUNK_CASES) - len(failed),
                                len(LETTER_CASES) + len(CHUNK_CASES)))
        if failed:
            print("FAILED:", failed)
            raise SystemExit(1)
        print("OK")
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == "__main__":
    main()
