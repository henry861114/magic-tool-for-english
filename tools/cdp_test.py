#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""极简 Chrome DevTools Protocol 测试脚本（仅用于本地开发验收）。"""
import base64
import json
import os
import socket
import struct
import subprocess
import tempfile
import time
import urllib.request

CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
PORT = 9333
URL = "file:///Users/henry/code/simulation_modeling/app/web/index.html"
PROFILE = tempfile.mkdtemp(prefix="eg-chrome-")


class WS:
    def __init__(self, url):
        rest = url.split("://", 1)[1]
        host_port, path = rest.split("/", 1)
        host, port = host_port.split(":")
        self.sock = socket.create_connection((host, int(port)), timeout=10)
        key = base64.b64encode(os.urandom(16)).decode()
        req = (
            "GET /" + path + " HTTP/1.1\r\n"
            "Host: %s:%s\r\n"
            "Upgrade: websocket\r\n"
            "Connection: Upgrade\r\n"
            "Sec-WebSocket-Key: %s\r\n"
            "Sec-WebSocket-Version: 13\r\n\r\n" % (host, port, key)
        )
        self.sock.sendall(req.encode())
        buf = b""
        while b"\r\n\r\n" not in buf:
            buf += self.sock.recv(4096)
        self.next_id = 1

    def send(self, obj):
        payload = json.dumps(obj).encode()
        header = bytearray([0x81])
        n = len(payload)
        if n < 126:
            header.append(0x80 | n)
        elif n < 65536:
            header.append(0x80 | 126)
            header += struct.pack(">H", n)
        else:
            header.append(0x80 | 127)
            header += struct.pack(">Q", n)
        mask = os.urandom(4)
        header += mask
        masked = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
        self.sock.sendall(bytes(header) + masked)

    def recv(self):
        def readn(n):
            out = b""
            while len(out) < n:
                chunk = self.sock.recv(n - len(out))
                if not chunk:
                    raise RuntimeError("socket closed")
                out += chunk
            return out

        while True:
            b1, b2 = readn(2)
            opcode = b1 & 0x0F
            length = b2 & 0x7F
            if length == 126:
                length = struct.unpack(">H", readn(2))[0]
            elif length == 127:
                length = struct.unpack(">Q", readn(8))[0]
            masked = b2 & 0x80
            mask = readn(4) if masked else None
            payload = readn(length)
            if mask:
                payload = bytes(b ^ mask[i % 4] for i, b in enumerate(payload))
            if opcode == 1:
                return json.loads(payload.decode())
            if opcode == 8:
                raise RuntimeError("ws closed")
            # ping/pong 忽略

    def cmd(self, method, params=None):
        mid = self.next_id
        self.next_id += 1
        self.send({"id": mid, "method": method, "params": params or {}})
        while True:
            msg = self.recv()
            if msg.get("id") == mid:
                return msg


def evaluate(ws, expr):
    msg = ws.cmd("Runtime.evaluate", {"expression": expr, "returnByValue": True, "awaitPromise": True})
    res = msg.get("result", {})
    if "exceptionDetails" in res:
        raise RuntimeError(json.dumps(res["exceptionDetails"], ensure_ascii=False))
    return res.get("result", {}).get("value")


def main():
    chrome = subprocess.Popen(
        [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars",
         "--force-prefers-reduced-motion", "--remote-debugging-port=%d" % PORT,
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
        time.sleep(1.2)

        def ev(expr, label=""):
            val = evaluate(ws, expr)
            print(("· " + label + " => " + json.dumps(val, ensure_ascii=False)) if label else val)
            return val

        print("== 基础 ==")
        ev("location.href", "url")
        ev("UNITS.length", "units")
        ev("UNITS.reduce((n,u)=>n+u.words.length,0)", "words")
        ev("document.querySelectorAll('.unit-card').length", "unit cards")
        ev("document.querySelectorAll('#gradeChips .grade-chip').length", "grade chips")
        ev("UNITS.flatMap(u=>u.words).filter(w=>w.parts.join('').toLowerCase()!==w.w.toLowerCase()).map(w=>w.w)", "part mismatches")
        ev("UNITS.flatMap(u=>u.words).filter(w=>w.chunks.map(c=>c[0]).join('').toLowerCase()!==w.w.toLowerCase()).map(w=>w.w)", "chunk mismatches")
        ev("UNITS.flatMap(u=>u.words).filter(w=>!w.ipa||!w.cn).map(w=>w.w)", "missing fields")

        print("== 进入 Unit 1 ==")
        ev("document.querySelector('.unit-card').click(); 1", "open learn")
        time.sleep(0.4)
        ev("document.querySelector('#screen-learn').classList.contains('active')", "learn active")
        ev("document.querySelector('.word-chip.active').textContent", "active word")
        ev("document.querySelector('#learnUnitTheme').textContent", "unit theme")
        ev("document.querySelectorAll('#stage .tile').length", "tiles")

        print("== 练一练 ==")
        ev("document.querySelector('[data-step=\"1\"]').click(); 1", "go quiz")
        time.sleep(0.3)
        ev("document.querySelector('#quizPlay')!==null || document.querySelectorAll('#stage .option').length>0", "quiz rendered")
        ev("""(() => {
          const chip = document.querySelector('.word-chip.active').textContent.trim();
          const w = UNITS.flatMap(u=>u.words).find(x=>x.w===chip);
          const opts = [...document.querySelectorAll('#stage .option')];
          const eyebrow = (document.querySelector('.quiz-eyebrow')||{}).textContent || '';
          let target = null;
          if (eyebrow.includes('听力')) target = w.w;
          else if (eyebrow.includes('拼读')) {
            const tiles = [...document.querySelectorAll('.quiz-word .tile, .quiz-word .quiz-blank')];
            let ci = 0;
            for (const el of tiles) {
              if (el.classList.contains('quiz-blank')) { target = w.chunks[ci][0]; break; }
              ci++;
            }
          } else target = w.cn;
          const opt = opts.find(o=>o.textContent.trim()===target || o.textContent.includes(target));
          if (opt) opt.click();
          return {target, options: opts.map(o=>o.textContent.trim())};
        })()""", "pick correct option")
        time.sleep(0.3)
        ev("document.querySelector('#stage .feedback.good')!==null", "quiz good feedback")
        ev("document.querySelector('#quizNext')!==null", "quiz next button")
        ev("document.querySelector('#quizNext').click(); 1", "quiz continue")
        time.sleep(0.2)

        print("== 拆拼 ==")
        ev("document.querySelectorAll('#stage [data-assemble-piece]').length", "assemble pieces")
        ev("""(() => {
          const ids = [...document.querySelectorAll('#stage [data-assemble-piece]')]
            .map(b=>+b.getAttribute('data-assemble-piece')).sort((a,b)=>a-b);
          for (const id of ids) {
            const b = document.querySelector('[data-assemble-piece="'+id+'"]');
            if (b) b.click();
          }
          return ids.length;
        })()""", "assemble in order")
        time.sleep(0.4)
        ev("document.querySelector('#assembleNext')!==null", "assemble success")
        ev("document.querySelector('#assembleNext').click(); 1", "go write")
        time.sleep(0.3)


        print("== 写一写 ==")
        ev("!!document.querySelector('#writeCanvas')", "canvas")
        ev("document.querySelector('#toggleKeyboard').click(); 1", "keyboard")
        ev("""(() => {
          const chip = document.querySelector('.word-chip.active').textContent.trim();
          const input = document.querySelector('#writeInput');
          input.value = chip;
          input.dispatchEvent(new Event('input', {bubbles:true}));
          document.querySelector('#submitWrite').click();
          return chip;
        })()""", "type word")
        time.sleep(0.3)
        ev("!!document.querySelector('#successNext')", "write success")
        ev("JSON.parse(localStorage.getItem('eng_genius_v1')).stars", "stars")
        ev("JSON.parse(localStorage.getItem('eng_genius_v1')).today.count", "today count")

        print("== 知识库 ==")
        ev("document.querySelector('.tab[data-screen=\"consolidate\"]').click(); 1", "tab consolidate")
        time.sleep(0.4)
        ev("document.querySelectorAll('#consolGrid .kb-word').length", "consol words")
        ev("document.querySelectorAll('#consolGrid .kb-word')[0].click(); document.querySelectorAll('#consolGrid .kb-word')[1].click(); document.querySelectorAll('#consolGrid .kb-word')[2].click(); 3", "select 3")
        ev("document.querySelector('#selCount').textContent", "sel count")
        ev("document.querySelector('#startDrill').click(); 1", "start drill")
        time.sleep(0.4)
        ev("document.querySelector('#screen-drill').classList.contains('active')", "drill active")
        ev("document.querySelector('#drillSub').textContent", "drill progress")
        ev("document.querySelector('#drillReveal').click(); 1", "reveal")
        time.sleep(0.2)
        ev("document.querySelector('#drillKnownBtn').click(); 1", "known")
        time.sleep(0.3)
        ev("document.querySelector('#drillSub').textContent", "next")
        ev("document.querySelector('#drillReveal').click(); document.querySelector('#drillAgainBtn').click(); 1", "again")
        time.sleep(0.3)
        ev("document.querySelector('#drillSub').textContent", "after again")
        for i in range(5):
            ev("(() => { const r=document.querySelector('#drillReveal'); if(r) r.click(); const k=document.querySelector('#drillKnownBtn'); if(k) k.click(); return 1; })()", "drill advance %d" % (i+1))
            time.sleep(0.25)
        ev("!!document.querySelector('#drillRestart')", "drill summary")
        ev("document.querySelector('.drill-summary h2') && document.querySelector('.drill-summary h2').textContent", "summary title")
        ev("document.querySelector('#drillRestart').click(); 1", "drill restart")
        time.sleep(0.3)
        ev("document.querySelector('#drillSub').textContent", "restart progress")

        print("== 空状态 & 设置 ==")
        ev("document.querySelector('#drillBack').click(); 1", "back consol")
        time.sleep(0.2)
        ev("document.querySelector('.tab[data-screen=\"me\"]').click(); 1", "me")
        time.sleep(0.2)
        ev("document.querySelector('#engineInfo').textContent", "engine")
        ev("document.querySelector('#meLearned').textContent", "learned")

        print("== 按年级筛选（全部年级逐项检查） ==")
        for gid in ['g3','g4','g5','g6','g7','g8','g9']:
            ev("document.querySelector('.tab[data-screen=\"home\"]').click(); 1", "home")
            time.sleep(0.2)
            ev("document.querySelector('#gradeChips [data-grade=\"%s\"]').click(); 1" % gid, gid)
            time.sleep(0.2)
            ev("document.querySelector('#unitSummary').textContent", gid+" summary")
            ev("[...document.querySelectorAll('#unitList .unit-card')].map(c=>c.querySelector('.unit-name').textContent+' '+c.querySelector('.unit-theme').textContent+' '+c.querySelector('.unit-grade').textContent)", gid+' units')
        print("== 原按年级筛选 ==")
        ev("document.querySelector('.tab[data-screen=\"home\"]').click(); 1", "home")
        time.sleep(0.3)
        ev("document.querySelector('#gradeChips [data-grade=\"g9\"]').click(); 1", "grade g9")
        time.sleep(0.2)
        ev("document.querySelectorAll('#unitList .unit-card').length", "g9 units")
        ev("document.querySelector('#unitSummary').textContent", "g9 summary")
        ev("document.querySelector('#unitList .unit-card').click(); 1", "open g9 unit")
        time.sleep(0.3)
        ev("document.querySelector('#learnUnitTheme').textContent", "g9 learn header")
        ev("document.querySelector('#learnBack').click(); 1", "back home")
        time.sleep(0.2)
        ev("document.querySelector('#gradeChips [data-grade=\"all\"]').click(); 1", "grade all")
        time.sleep(0.2)

        print("== 复习已掌握 ==")
        ev("document.querySelector('.tab[data-screen=\"review\"]').click(); 1", "review tab")
        time.sleep(0.3)
        ev("document.querySelector('#reviewTabs [data-tab=\"done\"]').click(); 1", "done tab")
        time.sleep(0.2)
        ev("document.querySelectorAll('#reviewList .review-item').length", "done items")
        print("OK")
    finally:
        chrome.terminate()
        try:
            chrome.wait(timeout=3)
        except Exception:
            chrome.kill()


if __name__ == "__main__":
    main()
