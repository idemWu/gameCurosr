#!/usr/bin/env python3
"""Generate cohesive pixel-art sprite sheets for gameCurosr Art V2."""
from __future__ import annotations

from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "shared" / "art" / "sprites"
OUT.mkdir(parents=True, exist_ok=True)

# Limited palettes (indie pixel-art style)
P = {
    "ink": (22, 28, 40, 255),
    "skin": (255, 220, 185, 255),
    "skin2": (230, 180, 140, 255),
    "cloth_w": (245, 245, 240, 255),
    "cloth_b": (90, 170, 230, 255),
    "cloth_r": (220, 90, 90, 255),
    "cloth_g": (90, 180, 120, 255),
    "cloth_p": (200, 140, 210, 255),
    "cloth_y": (240, 200, 90, 255),
    "cloth_o": (230, 150, 80, 255),
    "hair_d": (60, 40, 30, 255),
    "hair_b": (40, 50, 80, 255),
    "hair_r": (160, 70, 50, 255),
    "wood": (140, 90, 50, 255),
    "wood2": (100, 65, 35, 255),
    "leaf": (70, 150, 80, 255),
    "leaf2": (50, 110, 60, 255),
    "sea": (60, 140, 190, 255),
    "sea2": (40, 100, 150, 255),
    "sand": (230, 210, 150, 255),
    "stone": (120, 130, 140, 255),
    "gold": (250, 210, 80, 255),
    "light": (255, 245, 180, 255),
    "shadow": (0, 0, 0, 60),
}


def new(w, h):
    return Image.new("RGBA", (w, h), (0, 0, 0, 0))


def px(img, x, y, c):
    if 0 <= x < img.width and 0 <= y < img.height:
        img.putpixel((x, y), c)


def fill_rect(img, x, y, w, h, c):
    for yy in range(y, y + h):
        for xx in range(x, x + w):
            px(img, xx, yy, c)


def outline(img, color=None):
    color = color or P["ink"]
    src = img.copy()
    out = new(img.width, img.height)
    for y in range(img.height):
        for x in range(img.width):
            a = src.getpixel((x, y))[3]
            if a == 0:
                for dx, dy in ((-1, 0), (1, 0), (0, -1), (0, 1)):
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < img.width and 0 <= ny < img.height:
                        if src.getpixel((nx, ny))[3] > 0:
                            px(out, x, y, color)
                            break
            else:
                px(out, x, y, src.getpixel((x, y)))
    return out


def person(cloth, hair, accent=None, hat=False):
    """16x24 character facing camera-ish."""
    img = new(16, 24)
    # shadow
    fill_rect(img, 4, 21, 8, 2, P["shadow"])
    # legs
    fill_rect(img, 5, 16, 3, 6, cloth)
    fill_rect(img, 9, 16, 3, 6, cloth)
    fill_rect(img, 5, 20, 3, 2, P["ink"])
    fill_rect(img, 9, 20, 3, 2, P["ink"])
    # body
    fill_rect(img, 4, 9, 8, 8, cloth)
    if accent:
        fill_rect(img, 4, 12, 8, 2, accent)
    # arms
    fill_rect(img, 2, 10, 2, 6, P["skin"])
    fill_rect(img, 12, 10, 2, 6, P["skin"])
    # head
    fill_rect(img, 5, 3, 6, 6, P["skin"])
    fill_rect(img, 5, 2, 6, 2, hair)
    fill_rect(img, 4, 3, 1, 3, hair)
    fill_rect(img, 11, 3, 1, 3, hair)
    # eyes
    px(img, 6, 5, P["ink"])
    px(img, 9, 5, P["ink"])
    if hat:
        fill_rect(img, 4, 1, 8, 2, P["cloth_y"])
        fill_rect(img, 3, 2, 10, 1, P["cloth_y"])
    return outline(img)


def tree():
    img = new(24, 32)
    fill_rect(img, 10, 20, 4, 10, P["wood"])
    fill_rect(img, 4, 8, 16, 14, P["leaf2"])
    fill_rect(img, 6, 4, 12, 10, P["leaf"])
    fill_rect(img, 8, 2, 8, 4, P["leaf"])
    return outline(img)


def house():
    img = new(32, 28)
    fill_rect(img, 4, 12, 24, 14, P["sand"])
    fill_rect(img, 2, 8, 28, 6, P["cloth_r"])
    # roof peak
    for i in range(14):
        fill_rect(img, 16 - i, 8 - i // 2, i * 2, 1, P["cloth_r"])
    fill_rect(img, 13, 18, 6, 8, P["wood2"])
    fill_rect(img, 7, 15, 4, 4, P["sea"])
    fill_rect(img, 21, 15, 4, 4, P["sea"])
    return outline(img)


def lighthouse():
    img = new(20, 40)
    fill_rect(img, 7, 10, 6, 28, P["cloth_w"])
    fill_rect(img, 7, 16, 6, 4, P["cloth_r"])
    fill_rect(img, 7, 26, 6, 4, P["cloth_r"])
    fill_rect(img, 5, 6, 10, 5, P["stone"])
    fill_rect(img, 8, 2, 4, 5, P["gold"])
    fill_rect(img, 6, 36, 8, 3, P["stone"])
    return outline(img)


def pier():
    img = new(48, 16)
    fill_rect(img, 0, 4, 48, 5, P["wood"])
    fill_rect(img, 0, 3, 48, 1, P["wood2"])
    for x in (4, 16, 28, 40):
        fill_rect(img, x, 9, 3, 7, P["wood2"])
    return outline(img)


def chest(open_=False):
    img = new(16, 14)
    fill_rect(img, 2, 5, 12, 7, P["wood"])
    fill_rect(img, 2, 3, 12, 4, P["wood2"] if not open_ else P["gold"])
    fill_rect(img, 7, 7, 2, 2, P["gold"])
    return outline(img)


def fish(color):
    img = new(16, 10)
    fill_rect(img, 2, 3, 10, 5, color)
    fill_rect(img, 11, 2, 3, 7, color)
    px(img, 4, 4, P["ink"])
    return outline(img)


def gem(color):
    img = new(12, 12)
    fill_rect(img, 4, 1, 4, 10, color)
    fill_rect(img, 2, 3, 8, 6, color)
    fill_rect(img, 1, 4, 10, 4, color)
    fill_rect(img, 4, 2, 2, 2, P["cloth_w"])
    return outline(img)


def cup():
    img = new(12, 14)
    fill_rect(img, 3, 4, 6, 8, P["cloth_w"])
    fill_rect(img, 4, 2, 4, 3, P["cloth_o"])
    fill_rect(img, 9, 6, 2, 4, P["cloth_w"])
    return outline(img)


def sword():
    img = new(8, 20)
    fill_rect(img, 3, 0, 2, 14, P["stone"])
    fill_rect(img, 1, 13, 6, 2, P["gold"])
    fill_rect(img, 3, 15, 2, 5, P["wood"])
    return outline(img)


def feather():
    img = new(12, 16)
    fill_rect(img, 5, 1, 2, 13, P["cloth_w"])
    fill_rect(img, 3, 3, 6, 8, P["cloth_y"])
    return outline(img)


def save(img, name, scale=4):
    big = img.resize((img.width * scale, img.height * scale), Image.NEAREST)
    path = OUT / f"{name}.png"
    big.save(path)
    print("wrote", path.relative_to(ROOT), big.size)


def sheet(cells, cols, cell_w, cell_h, name, scale=4):
    rows = (len(cells) + cols - 1) // cols
    sheet_img = new(cols * cell_w, rows * cell_h)
    for i, cell in enumerate(cells):
        x = (i % cols) * cell_w
        y = (i // cols) * cell_h
        sheet_img.paste(cell, (x, y), cell)
    save(sheet_img, name, scale)


def main():
    # Characters
    chars = [
        person(P["cloth_w"], P["hair_d"], P["cloth_b"]),  # player
        person(P["cloth_y"], P["hair_d"], None, True),  # li
        person(P["cloth_b"], P["hair_r"], P["sea"]),  # zhen
        person(P["cloth_p"], P["hair_b"], P["cloth_y"]),  # lu
        person(P["stone"], P["hair_d"], P["wood"]),  # bo
        person(P["cloth_g"], P["hair_r"], P["leaf"]),  # mei
        person(P["cloth_o"], P["hair_b"], P["cloth_w"]),  # yun
        person(P["cloth_p"], P["hair_d"], P["cloth_b"]),  # hai
        person(P["cloth_r"], P["hair_b"], P["gold"]),  # qing
    ]
    sheet(chars, 9, 16, 24, "harbor_chars")

    save(tree(), "tree")
    save(house(), "house")
    save(lighthouse(), "lighthouse")
    save(pier(), "pier")
    save(chest(False), "chest")
    save(chest(True), "chest_open")
    save(cup(), "cup")
    save(sword(), "sword")
    save(feather(), "feather")

    fishes = [
        fish(P["sea"]),
        fish(P["cloth_y"]),
        fish(P["cloth_p"]),
        fish(P["cloth_g"]),
        fish(P["gold"]),
    ]
    sheet(fishes, 5, 16, 10, "fish")

    gems = [
        gem(P["cloth_r"]),
        gem(P["cloth_g"]),
        gem(P["cloth_b"]),
        gem(P["cloth_y"]),
        gem(P["cloth_p"]),
    ]
    sheet(gems, 5, 12, 12, "gems")

    # UI panel 9-slice source
    panel = new(32, 32)
    fill_rect(panel, 0, 0, 32, 32, (30, 40, 60, 230))
    fill_rect(panel, 2, 2, 28, 28, (45, 60, 90, 240))
    fill_rect(panel, 0, 0, 32, 2, P["gold"])
    save(panel, "ui_panel", scale=2)

    print("done")


if __name__ == "__main__":
    main()
