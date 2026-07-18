#!/usr/bin/env python3
"""Fetch 4399 mini-game hot top 100 into data/4399-hot-100.json."""

from __future__ import annotations

import json
import re
import urllib.request
from collections import OrderedDict
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT_JSON = ROOT / "data" / "4399-hot-100.json"
OUT_MD = ROOT / "docs" / "4399-hot-100.md"

UA = (
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
)


def fetch(url: str) -> bytes:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": UA, "Referer": "https://www.4399.com/"},
    )
    with urllib.request.urlopen(req, timeout=30) as resp:
        return resp.read()


def decode_gb(raw: bytes) -> str:
    for enc in ("gb2312", "gbk", "utf-8"):
        try:
            return raw.decode(enc)
        except UnicodeDecodeError:
            continue
    return raw.decode("utf-8", errors="ignore")


def flash_id(url_or_path: str | None) -> str | None:
    if not url_or_path:
        return None
    m = re.search(r"/flash/([^./?#]+)\.htm", url_or_path)
    return m.group(1) if m else None


def norm_url(href: str | None) -> str | None:
    if not href:
        return None
    if href.startswith("//"):
        return "https:" + href
    if href.startswith("/"):
        return "https://www.4399.com" + href
    if href.startswith("http://"):
        return "https://" + href[len("http://") :]
    return href


def build() -> dict:
    games: OrderedDict[str, dict] = OrderedDict()

    def add(name: str, url: str, category: str | None, source: str, cover: str | None = None) -> bool:
        url = norm_url(url)
        key = flash_id(url) or url
        if key in games:
            g = games[key]
            if category and (not g.get("category") or g.get("category") == "热游总榜"):
                if category != "热游总榜":
                    g["category"] = category
            if cover and not g.get("cover"):
                g["cover"] = norm_url(cover)
            return False
        games[key] = {
            "rank": len(games) + 1,
            "name": name,
            "url": url,
            "flashId": flash_id(url),
            "category": category,
            "source": source,
            "cover": norm_url(cover),
        }
        return True

    home = decode_gb(fetch("https://www.4399.com/"))
    i = home.find("热游总榜")
    j = home.find("页游总榜", i)
    chunk = home[i:j] if i >= 0 else ""
    for m in re.finditer(
        r'<em class="bg\d+">(\d+)</em>\s*<a class="btn-name" href="([^"]+)">([^<]+)</a>'
        r'[\s\S]{0,500}?lz_src="([^"]+)"',
        chunk,
    ):
        add(
            unescape(m.group(3)).strip(),
            m.group(2),
            category="热游总榜",
            source="home-hot",
            cover=m.group(4),
        )

    top = decode_gb(fetch("https://www.4399.com/top/"))
    for m in re.finditer(
        r'<span class="tit-1">([^<]+)</span><div class="t2 cf phswitch">'
        r'<a class="on"\s+href="/top/top-m-(\d+)\.htm">月</a>[\s\S]*?'
        r'<ul class="top(?: t-2)? topline">([\s\S]*?)</ul>',
        top,
    ):
        cat_name, cid, ul = unescape(m.group(1)).strip(), m.group(2), m.group(3)
        if cid in {"55", "56"}:
            continue
        for g in re.finditer(
            r'<a href="(/flash/[^"]+\.htm)" class="img"><img[^>]*(?:lz_src|src)="([^"]+)"[^>]*></a>\s*'
            r'<a href="/flash/[^"]+\.htm" class="tex">([^<]+)</a>',
            ul,
        ):
            add(
                unescape(g.group(3)).strip(),
                g.group(1),
                category=cat_name,
                source=f"top-monthly-{cid}",
                cover=g.group(2),
            )

    # Fill from major category totals if monthly list is short.
    if len(games) < 100:
        for cid in [2, 4, 5, 12, 6, 8, 16, 3, 11, 49, 9, 1, 7, 13]:
            if len(games) >= 100:
                break
            page = decode_gb(fetch(f"https://www.4399.com/top/top-{cid}.htm"))
            marker = page.find("小游戏排行榜")
            body = page[marker:] if marker >= 0 else page
            tm = re.search(r"<title>([^,<]+)", page)
            cat = unescape(tm.group(1)).replace("总排行", "").strip() if tm else str(cid)
            for g in re.finditer(
                r'<li>\s*<a href="(/flash/[^"]+\.htm)"[^>]*>\s*<img[^>]*?(?:lz_src|src)="([^"]*)"'
                r'[^>]*alt="([^"]*)"[^>]*/?>\s*([^<]*)</a>\s*</li>',
                body,
            ):
                title = unescape(g.group(4)).strip() or unescape(g.group(3)).strip()
                add(title, g.group(1), category=cat, source=f"top-total-{cid}", cover=g.group(2))
                if len(games) >= 100:
                    break

    final = list(games.values())[:100]
    for idx, g in enumerate(final, 1):
        g["rank"] = idx

    return {
        "source": "4399小游戏",
        "title": "热门100",
        "description": (
            "从 4399 首页「热游总榜」与 https://www.4399.com/top/ 分类月榜汇总的热门小游戏 Top 100（去重保序）。"
        ),
        "fetchedAt": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "references": ["https://www.4399.com/", "https://www.4399.com/top/"],
        "count": len(final),
        "games": final,
    }


def write_md(payload: dict) -> None:
    lines = [
        "# 4399 小游戏 · 热门 100",
        "",
        f"> 抓取时间（UTC）：`{payload['fetchedAt']}`  ",
        "> 数据来源：4399 首页「热游总榜」+ [分类排行榜](https://www.4399.com/top/) 月榜（去重保序）。",
        "",
        "| 排名 | 游戏 | 分类 | 链接 |",
        "| ---: | --- | --- | --- |",
    ]
    for g in payload["games"]:
        name = g["name"].replace("|", "\\|")
        cat = (g.get("category") or "-").replace("|", "\\|")
        label = g.get("flashId") or "打开"
        lines.append(f"| {g['rank']} | {name} | {cat} | [{label}]({g['url']}) |")
    lines.append("")
    lines.append("机器可读数据：[`data/4399-hot-100.json`](../data/4399-hot-100.json)")
    lines.append("")
    OUT_MD.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> None:
    payload = build()
    if payload["count"] < 100:
        raise SystemExit(f"expected 100 games, got {payload['count']}")
    OUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUT_MD.parent.mkdir(parents=True, exist_ok=True)
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    write_md(payload)
    print(f"wrote {payload['count']} games -> {OUT_JSON.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
