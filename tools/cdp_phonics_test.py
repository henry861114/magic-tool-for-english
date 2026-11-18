#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""验证点「音素」时实际请求的音频文件（仅本地开发验收）。"""
import json
import subprocess
import tempfile
import time
import urllib.request

from cdp_test import CHROME, URL, WS, evaluate

PORT = 9334
PROFILE = tempfile.mkdtemp(prefix="eg-phonics-")
WORDS = [
    "lovely", "teacher", "car", "bird", "air", "sure", "father",
    "fire", "tour", "poor", "share", "world", "nurse", "usually",
    "sun", "apple", "student", "science", "beautiful", "every",
    "very", "different", "library", "eraser",
    "tree", "dream", "street", "trousers",
]
EXPECTED = {
    "lovely": ["l_clear", "v_uh", "c_v", "c_l", "v_i_happy"],
    "teacher": ["t_initial", "v_i_long", "c_ch", "r_schwa"],
    "car": ["c_k", "r_ah"],
    "bird": ["c_b", "r_er", "c_d"],
    "air": ["r_air_us"],
    "sure": ["c_sh", "r_oor"],
    "father": ["c_f", "v_a_long", "c_dh", "r_schwa"],
    "fire": ["c_f", "d_ai", "r_schwa"],
    "tour": ["t_initial", "r_oor"],
    "poor": ["c_p", "v_u_long", "c_r"],
    "share": ["c_sh", "r_air_us"],
    "world": ["c_w", "r_er", "l_dark", "c_d"],
    "nurse": ["c_n", "r_er", "c_s"],
    "usually": ["c_y", "v_u_long", "c_zh", "v_u_reduced", "v_schwa", "c_l", "v_i_happy"],
    # /er/ and /ər/ chunks before another vowel must split back into vowel + r
    "very": ["c_v", "v_e", "c_r", "v_i_happy"],
    "different": ["c_d", "v_i_short", "c_f", "v_schwa", "c_r", "v_schwa", "c_n", "t_final"],
    "library": ["l_clear", "d_ai", "c_b", "c_r", "v_schwa", "c_r", "v_i_happy"],
    "eraser": ["v_i_short", "c_r", "d_ei", "c_s", "r_schwa"],
    # the 48-symbol course treats tr/dr/ts/dz as single phonemes
    "tree": ["c_tr", "v_i_long"],
    "dream": ["c_dr", "v_i_long", "m_final"],
    "street": ["c_s", "c_tr", "v_i_long", "t_final"],
    "trousers": ["c_tr", "d_au", "c_z", "r_schwa", "c_z"],
}


def main():
    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--disable-gpu", "--mute-audio",
         "--hide-scrollbars", "--force-prefers-reduced-motion",
         "--autoplay-policy=no-user-gesture-required",
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

        # 记录 Audio 请求，并让播放立即结束，避免等待真实时长。
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

        passed = 0
        failed = []
        for word in WORDS:
            expr = """
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
              window.__played = [];
              const btn = document.querySelector('#stage [data-speak-phonemes]');
              if (!btn) return {error: 'phoneme button missing', ui};
              btn.click();
              return {ui, ipa: document.querySelector('#stage .ipa-pill span').textContent};
            })()
            """ % json.dumps(word)
            info = ev(expr)
            if not info or info.get("error"):
                failed.append((word, info))
                print(f"FAIL {word:<10} {info}")
                continue
            time.sleep(0.8)
            played = ev("window.__played.filter(s => s.indexOf('phonics/') >= 0)")
            tip = ev("document.querySelector('#phonicsTip') && document.querySelector('#phonicsTip').textContent")
            files = [s.rsplit("/", 1)[-1].split("?")[0].replace(".wav", "") for s in played]
            exp = EXPECTED.get(word)
            ok = True
            if not files:
                ok = False
            if exp and files[:len(exp)] != exp:
                ok = False
            if exp and len(files) > len(exp) + 2:
                ok = False
            mark = "OK  " if ok else "FAIL"
            if ok:
                passed += 1
            else:
                failed.append((word, files, exp))
            print(f"{mark} {word:<10} {info['ipa']:<18} {files} tip={tip}")

        print(f"passed {passed}/{len(WORDS)}")
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
