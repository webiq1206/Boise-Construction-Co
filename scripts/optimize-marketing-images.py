#!/usr/bin/env python3
"""Compress marketing PNGs to WebP for faster page loads."""
from __future__ import annotations

import sys
from pathlib import Path

try:
    from PIL import Image
except ImportError as exc:
    print("Pillow is required: pip install Pillow", file=sys.stderr)
    raise SystemExit(1) from exc

ROOT = Path(__file__).resolve().parent.parent
IMAGES_ROOT = ROOT / "public" / "images"
MAX_WIDTH = 1920
QUALITY = 80

TARGET_DIRS = [
    IMAGES_ROOT,
    IMAGES_ROOT / "gallery",
    IMAGES_ROOT / "services",
]


def collect_pngs(directory: Path) -> list[Path]:
    if not directory.exists():
        return []
    return sorted(directory.rglob("*.png"))


def optimize_file(input_path: Path) -> None:
    output_path = input_path.with_suffix(".webp")
    before = input_path.stat().st_size

    with Image.open(input_path) as img:
        img = img.convert("RGB") if img.mode in ("RGBA", "P", "LA") else img
        width, height = img.size
        if width > MAX_WIDTH:
            ratio = MAX_WIDTH / width
            img = img.resize((MAX_WIDTH, int(height * ratio)), Image.Resampling.LANCZOS)
        img.save(output_path, "WEBP", quality=QUALITY, method=6)

    after = output_path.stat().st_size
    rel = output_path.relative_to(ROOT)
    print(f"{rel}: {before // 1024}KB -> {after // 1024}KB")


def main() -> None:
    pngs: list[Path] = []
    for directory in TARGET_DIRS:
        pngs.extend(collect_pngs(directory))

    unique = sorted(set(pngs))
    if not unique:
        print("No PNG files found to optimize.")
        return

    print(f"Optimizing {len(unique)} PNG(s) to WebP (max {MAX_WIDTH}px, q{QUALITY})...")
    for path in unique:
        optimize_file(path)
    print("Done.")


if __name__ == "__main__":
    main()
