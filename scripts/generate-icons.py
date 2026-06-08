#!/usr/bin/env python3
from pathlib import Path

from PIL import Image, ImageDraw


ROOT = Path(__file__).resolve().parents[1]
ICON_DIR = ROOT / "icons"
SIZES = (16, 32, 48, 128)

BLUE = "#4a4aff"
PINK = "#ff3366"
WHITE = "#ffffff"


def draw_circle(draw, x, y, radius, fill):
    draw.ellipse((x - radius, y - radius, x + radius, y + radius), fill=fill)


def draw_rounded_line(draw, start, end, width, fill):
    draw.line((start, end), fill=fill, width=width)
    radius = width / 2
    draw_circle(draw, start[0], start[1], radius, fill)
    draw_circle(draw, end[0], end[1], radius, fill)


def make_icon(size):
    scale = 8
    canvas_size = size * scale
    image = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(image)

    radius = round(canvas_size * 0.18)
    draw.rounded_rectangle(
        (0, 0, canvas_size - 1, canvas_size - 1),
        radius=radius,
        fill=BLUE,
    )

    stroke = max(3 * scale, round(canvas_size * 0.15))
    left_x = round(canvas_size * 0.32)
    top_y = round(canvas_size * 0.22)
    mid_y = round(canvas_size * 0.5)
    bottom_y = round(canvas_size * 0.78)
    right_top = (round(canvas_size * 0.72), round(canvas_size * 0.24))
    right_bottom = (round(canvas_size * 0.76), round(canvas_size * 0.76))
    mid = (round(canvas_size * 0.39), mid_y)

    draw_rounded_line(draw, (left_x, top_y), (left_x, bottom_y), stroke, WHITE)
    draw_rounded_line(draw, mid, right_top, stroke, WHITE)
    draw_rounded_line(draw, mid, right_bottom, stroke, WHITE)

    accent_radius = max(1 * scale, round(canvas_size * 0.07))
    draw_circle(
        draw,
        round(canvas_size * 0.77),
        round(canvas_size * 0.22),
        accent_radius,
        PINK,
    )

    return image.resize((size, size), Image.Resampling.LANCZOS)


def main():
    ICON_DIR.mkdir(exist_ok=True)

    for size in SIZES:
        path = ICON_DIR / f"icon{size}.png"
        make_icon(size).save(path)
        print(path.relative_to(ROOT))


if __name__ == "__main__":
    main()
