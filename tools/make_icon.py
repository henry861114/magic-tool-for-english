#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""生成「学英语神器」启动图标（圆角方形 + 圆形）。"""
import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RES = os.path.join(ROOT, "res")

SIZES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}

TOP = (250, 178, 96)
BOTTOM = (228, 111, 15)

FONT_CANDIDATES = [
    ("/System/Library/Fonts/PingFang.ttc", 3),
    ("/System/Library/Fonts/Helvetica.ttc", 1),
    ("/Library/Fonts/Arial Bold.ttf", 0),
]


def load_font(size):
    for path, idx in FONT_CANDIDATES:
        if os.path.exists(path):
            try:
                return ImageFont.truetype(path, size, index=idx)
            except Exception:
                try:
                    return ImageFont.truetype(path, size)
                except Exception:
                    continue
    return ImageFont.load_default()


def gradient(size):
    img = Image.new("RGB", (size, size), TOP)
    px = img.load()
    for y in range(size):
        t = y / max(1, size - 1)
        r = int(TOP[0] + (BOTTOM[0] - TOP[0]) * t)
        g = int(TOP[1] + (BOTTOM[1] - TOP[1]) * t)
        b = int(TOP[2] + (BOTTOM[2] - TOP[2]) * t)
        for x in range(size):
            px[x, y] = (r, g, b)
    return img


def make_icon(size, rounded=True):
    s = size * 4  # 超采样，边缘更平滑
    base = gradient(s)
    draw = ImageDraw.Draw(base)

    # 柔光装饰
    overlay = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    od = ImageDraw.Draw(overlay)
    od.ellipse((s * 0.52, -s * 0.30, s * 1.28, s * 0.46), fill=(255, 255, 255, 28))
    od.ellipse((-s * 0.35, s * 0.55, s * 0.38, s * 1.28), fill=(255, 255, 255, 20))
    base = Image.alpha_composite(base.convert("RGBA"), overlay).convert("RGBA")

    # 主字母 Aa
    draw = ImageDraw.Draw(base)
    font = load_font(int(s * 0.52))
    text = "Aa"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (s - tw) / 2 - bbox[0]
    ty = (s - th) / 2 - bbox[1] - s * 0.045
    # 轻微阴影
    draw.text((tx + s * 0.012, ty + s * 0.018), text, font=font, fill=(170, 70, 0, 80))
    draw.text((tx, ty), text, font=font, fill=(255, 255, 255, 255))

    # 小星星（手绘五角星，避免字体缺字）
    import math
    cx, cy, r = s * 0.765, s * 0.205, s * 0.085
    pts = []
    for k in range(10):
        ang = -math.pi / 2 + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.44
        pts.append((cx + math.cos(ang) * rr, cy + math.sin(ang) * rr))
    draw.polygon(pts, fill=(255, 248, 215, 255))

    # 底部小横线（书页/节奏感）
    draw.rounded_rectangle((s * 0.28, s * 0.84, s * 0.72, s * 0.865),
                           radius=s * 0.014, fill=(255, 255, 255, 110))

    base = base.resize((size, size), Image.LANCZOS)

    mask = Image.new("L", (size, size), 0)
    md = ImageDraw.Draw(mask)
    if rounded:
        md.rounded_rectangle((0, 0, size - 1, size - 1), radius=int(size * 0.22), fill=255)
    else:
        md.ellipse((0, 0, size - 1, size - 1), fill=255)

    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(base, (0, 0), mask)
    return out


def main():
    for folder, size in SIZES.items():
        d = os.path.join(RES, folder)
        os.makedirs(d, exist_ok=True)
        make_icon(size, True).save(os.path.join(d, "ic_launcher.png"))
        make_icon(size, False).save(os.path.join(d, "ic_launcher_round.png"))
        print("icon", folder, size)
    os.makedirs(os.path.join(RES, "mipmap-xxxhdpi"), exist_ok=True)
    make_icon(512, True).save(os.path.join(RES, "mipmap-xxxhdpi", "ic_launcher_512.png"))
    print("done")


if __name__ == "__main__":
    main()
