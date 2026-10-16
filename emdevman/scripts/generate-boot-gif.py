"""
Generates the page-load animation: public/images/boot.gif and its static
poster boot-poster.png.

Run from the project root:

  python scripts/generate-boot-gif.py

Needs Pillow. Uses ffmpeg (must be on PATH) for the GIF export. Fonts are read
out of node_modules/geist so the type in the animation is the same face the
site already loads (--font-geist-mono).

Every glyph is drawn as vector art (spinner arc, tick, block cursor) rather
than typed: Geist Mono has no braille spinner glyph and no U+2713, and a
missing glyph in a loading indicator is a failure case a reader notices.
"""

from __future__ import annotations

import math
import shutil
import subprocess
import tempfile
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "node_modules" / "geist" / "dist" / "fonts" / "geist-mono"
OUT_DIR = ROOT / "public" / "images"

# Canvas. Drawn at 2x and displayed at half size for crispness on retina.
MARGIN = 20
CARD_W, CARD_H = 760, 300
CARD_RADIUS = 18
W, H = CARD_W + MARGIN * 2, CARD_H + MARGIN * 2

BAR_H = 44
PAD_X = 40
TEXT_SIZE = 24
LINE_H = 44
BODY_TOP = MARGIN + BAR_H + 26

TEXT_PROMPT = "emdevman"
ROWS = ("sections", "projects", "ready")
FPS = 20
FRAME_MS = int(1000 / FPS)


def loader_font(size: int) -> ImageFont.FreeTypeFont:
    path = FONT_DIR / "GeistMono-Regular.ttf"
    if not path.exists():
        raise FileNotFoundError(f"Geist Mono not found at {path}")
    return ImageFont.truetype(str(path), size)


def title_font() -> ImageFont.FreeTypeFont:
    # Medium weight, smaller than the body face. Derives from the same file so
    # we don't depend on 'GeistMono-Medium.ttf' resolving, but use it if it's
    # already there since it carries the same weight the site uses.
    candidate = FONT_DIR / "GeistMono-Medium.ttf"
    source = candidate if candidate.exists() else FONT_DIR / "GeistMono-Regular.ttf"
    return ImageFont.truetype(str(source), 16)


def draw_spinner(draw: ImageDraw.ImageDraw, cx: float, cy: float, step: int) -> None:
    r = 9
    box = (cx - r, cy - r, cx + r, cy + r)
    start = -60 + step * (360 / 8)
    draw.arc(box, start=start, end=start + 270, fill=(119, 212, 255), width=3)
    draw.arc(box, start=start, end=start + 60, fill=(180, 232, 255), width=3)


def draw_check(draw: ImageDraw.ImageDraw, cx: float, cy: float) -> None:
    s = 6
    draw.line(
        [(cx - s, cy), (cx - 1.5, cy + s * 0.75), (cx + s, cy - s * 0.85)],
        fill=(52, 211, 153),
        width=3,
        joint="curve",
    )


def compose(
    typed: int,
    rows: list,
    progress: float,
    cursor: bool,
    spin_seed: int,
    clear_rows: int,
    clear_prompt: int,
) -> Image.Image:
    body_face = loader_font(TEXT_SIZE)
    bar_face = title_font()

    img = Image.new("RGBA", (W, H), (1, 0, 255, 0))
    draw = ImageDraw.Draw(img)

    # Card.
    card = (MARGIN, MARGIN, MARGIN + CARD_W, MARGIN + CARD_H)
    draw.rounded_rectangle(card, radius=CARD_RADIUS, fill=(11, 13, 18), outline=(36, 42, 55), width=1)

    # Title bar.
    draw.rounded_rectangle(
        (MARGIN, MARGIN, MARGIN + CARD_W, MARGIN + 4 * MARGIN),
        radius=CARD_RADIUS, fill=(17, 21, 29),
    )
    draw.rectangle(
        (MARGIN, MARGIN + 38, MARGIN + CARD_W, MARGIN + 40),
        fill=(17, 21, 29),
    )
    draw.rounded_rectangle(
        (MARGIN, MARGIN, MARGIN + CARD_W, MARGIN + BAR_H),
        radius=CARD_RADIUS, outline=(28, 34, 48), width=1,
    )
    draw.line((MARGIN, MARGIN + BAR_H, MARGIN + CARD_W, MARGIN + BAR_H), fill=(28, 34, 48), width=1)

    dot_y = MARGIN + BAR_H / 2
    for i, colour in enumerate(((239, 68, 68), (255, 210, 54), (52, 211, 153))):
        cx_ = MARGIN + 26 + i * 20
        draw.ellipse((cx_ - 5.5, dot_y - 5.5, cx_ + 5.5, dot_y + 5.5), fill=colour)

    label = "emdevman - zsh"
    label_width = draw.textlength(label, font=bar_face)
    draw.text(
        (MARGIN + CARD_W / 2 - label_width / 2, dot_y - 9),
        label, font=bar_face, fill=(125, 135, 153),
    )

    cell_width = draw.textlength("M", font=body_face)
    x0 = MARGIN + PAD_X
    y0 = MARGIN + BAR_H + 26

    prompt_colour = (52, 211, 153)
    body_colour = (232, 236, 243)
    dim_colour = (125, 135, 153)
    accent = (119, 212, 255)

    # Prompt line.
    draw.text((x0, y0), "$", font=body_face, fill=prompt_colour)
    shown_count = max(0, typed - clear_prompt)
    shown = TEXT_PROMPT[:shown_count]
    if shown:
        draw.text((x0 + 2 * cell_width, y0), shown, font=body_face, fill=body_colour)

    # Cursor block.
    if cursor:
        cx_cursor = x0 + 2 * cell_width + len(shown) * cell_width
        top = y0 + 2
        draw.rectangle(
            (cx_cursor, top, cx_cursor + cell_width, top + TEXT_SIZE + 6),
            fill=accent,
        )

    # Rows.
    check_x = MARGIN + CARD_W - PAD_X - 14
    row_count = len(ROWS)
    for i, state in enumerate(rows):
        if state is None:
            continue
        y = y0 + LINE_H * (i + 1)
        if clear_rows < i + 1:
            draw.text((x0 + 2 * cell_width, y), ROWS[i], font=body_face, fill=body_colour)
        if clear_rows < i + 1:
            if state == "spinner":
                draw_spinner(draw, check_x, y + TEXT_SIZE / 2 + 1, spin_seed + i)
            else:
                draw_check(draw, check_x, y + TEXT_SIZE / 2 + 1)

    # Progress bar.
    bar_y = y0 + LINE_H * (row_count + 1)
    bar_x0 = x0
    bar_x1 = MARGIN + CARD_W - PAD_X
    draw.rounded_rectangle((bar_x0, bar_y, bar_x1, bar_y + 8), radius=4, fill=(39, 44, 56))
    filled = bar_x0 + round((bar_x1 - bar_x0) * progress)
    if filled > bar_x0:
        draw.rounded_rectangle((bar_x0, bar_y, filled, bar_y + 8), radius=4, fill=accent)

    return img


def build_frames() -> list[Image.Image]:
    frames: list[Image.Image] = []
    n = len(ROWS)

    def add(typed, rows, progress, cursor, spin_seed=0, cr=0, cp=0):
        frames.append(compose(typed, rows, progress, cursor, spin_seed, cr, cp))

    # Empty card, blinking cursor.
    for i in range(5):
        add(0, [None] * n, 0.0, cursor=i < 3)

    # Command types itself.
    for i in range(1, len(TEXT_PROMPT) + 1):
        add(i, [None] * n, 0.0, cursor=True, spin_seed=i)

    # Rows check in: three frames of spinner, then a tick.
    for i in range(n):
        for s in range(3):
            rows = ["check" if j < i else ("spinner" if j == i else None) for j in range(n)]
            add(len(TEXT_PROMPT), rows, (i + 0.6) / n, cursor=False, spin_seed=s)
        rows = ["check" if j <= i else None for j in range(n)]
        add(len(TEXT_PROMPT), rows, (i + 1) / n, cursor=True)

    # Bar fills.
    for s in range(1, 10):
        add(len(TEXT_PROMPT), ["check"] * n, s / 9, cursor=True, spin_seed=s)

    # Hold, blinking cursor.
    for i in range(8):
        add(len(TEXT_PROMPT), ["check"] * n, 1.0, cursor=i < 4)

    # Reset: rows wipe, then command untypes.
    for i in range(1, n + 1):
        add(len(TEXT_PROMPT), ["check"] * n, 1.0, cursor=True, cr=i)
    for i in range(1, len(TEXT_PROMPT) + 1):
        add(len(TEXT_PROMPT), ["check"] * n, 1.0, cursor=True, cr=n, cp=i)

    return frames


def export_gif(frames: list[Image.Image], path: Path) -> None:
    if shutil.which("ffmpeg") is None:
        raise RuntimeError("ffmpeg not found on PATH")
    tmp = Path(tempfile.mkdtemp(prefix="boot-frames-"))
    try:
        for i, frame in enumerate(frames):
            frame.save(tmp / f"frame_{i:04d}.png")
        subprocess.run(
            [
                "ffmpeg", "-y", "-hide_banner", "-loglevel", "warning",
                "-framerate", str(FPS),
                "-i", str(tmp / "frame_%04d.png"),
                "-vf",
                "fps=%d,scale=%d:-1:flags=lanczos,split[a][b];"
                "[a]palettegen=stats_mode=full:max_colors=256:reserve_transparent=on[p];"
                "[b]format=rgba[b2];[b2][p]paletteuse=dither=sierra3:alpha_threshold=128"
                % (FPS, W),
                "-loop", "0",
                str(path),
            ],
            check=True,
        )
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


def render_poster(path: Path) -> None:
    n = len(ROWS)
    frame = compose(
        typed=len(TEXT_PROMPT),
        rows=["check"] * n,
        progress=1.0,
        cursor=False,
        spin_seed=7,
        clear_rows=0,
        clear_prompt=0,
    )
    frame.save(path)


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    frames = build_frames()

    gif_path = OUT_DIR / "boot.gif"
    export_gif(frames, gif_path)

    poster_path = OUT_DIR / "boot-poster.png"
    render_poster(poster_path)

    print(
        f"{gif_path.relative_to(ROOT)}  {gif_path.stat().st_size / 1024:.0f} KB  "
        f"{len(frames)} frames @ {FPS}fps = {len(frames) / FPS:.2f}s"
    )
    print(f"{poster_path.relative_to(ROOT)}  {poster_path.stat().st_size / 1024:.0f} KB")


if __name__ == "__main__":
    main()
