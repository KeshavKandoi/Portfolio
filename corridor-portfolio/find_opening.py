import cairosvg
from PIL import Image
import numpy as np
import io
import sys

def find_opening(svg_path, res=2000):
    png_bytes = cairosvg.svg2png(url=svg_path, output_width=res)
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    arr = np.array(img)

    # Treat near-white / transparent pixels as "empty"
    alpha = arr[:, :, 3]
    rgb = arr[:, :, :3]
    is_ink = (alpha > 10) & (rgb.sum(axis=2) < 600)  # dark-ish pixel with visible alpha

    h, w = is_ink.shape
    cy, cx = h // 2, w // 2

    if is_ink[cy, cx]:
        print(f"{svg_path}: center pixel is ink, not empty — can't seed flood fill here.")
        return

    # Flood fill from center to find the connected empty region (the opening)
    from collections import deque
    visited = np.zeros_like(is_ink, dtype=bool)
    q = deque([(cy, cx)])
    visited[cy, cx] = True
    minx, maxx, miny, maxy = cx, cx, cy, cy

    while q:
        y, x = q.popleft()
        miny, maxy = min(miny, y), max(maxy, y)
        minx, maxx = min(minx, x), max(maxx, x)
        for dy, dx in ((1,0),(-1,0),(0,1),(0,-1)):
            ny, nx = y+dy, x+dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx] and not is_ink[ny, nx]:
                visited[ny, nx] = True
                q.append((ny, nx))

    left_pct = (minx / w) * 100
    right_pct = ((w - maxx) / w) * 100
    top_pct = (miny / h) * 100
    bottom_pct = ((h - maxy) / h) * 100

    print(f"\n{svg_path} (rendered {w}x{h})")
    print(f"  opening bbox px: x[{minx},{maxx}]  y[{miny},{maxy}]")
    print(f"  opening insets -> left: {left_pct:.2f}%  right: {right_pct:.2f}%  top: {top_pct:.2f}%  bottom: {bottom_pct:.2f}%")
    print(f"  opening size -> width: {100-left_pct-right_pct:.2f}%  height: {100-top_pct-bottom_pct:.2f}%")

find_opening("public/assets/door/frame.svg")
