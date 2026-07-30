from svgelements import SVG
import sys

def analyze(path):
    svg = SVG.parse(path)
    minx = miny = float('inf')
    maxx = maxy = float('-inf')
    found = False
    for el in svg.elements():
        if hasattr(el, 'bbox'):
            try:
                bbox = el.bbox()
            except Exception:
                continue
            if bbox is None:
                continue
            x0, y0, x1, y1 = bbox
            minx, miny = min(minx, x0), min(miny, y0)
            maxx, maxy = max(maxx, x1), max(maxy, y1)
            found = True
    if not found:
        print(f"{path}: no drawable geometry found")
        return
    vb_w, vb_h = svg.width, svg.height
    left_pct   = (minx / vb_w) * 100
    right_pct  = ((vb_w - maxx) / vb_w) * 100
    top_pct    = (miny / vb_h) * 100
    bottom_pct = ((vb_h - maxy) / vb_h) * 100
    print(f"\n{path}")
    print(f"  canvas: {vb_w:.2f} x {vb_h:.2f}")
    print(f"  artwork bbox: x[{minx:.2f}, {maxx:.2f}]  y[{miny:.2f}, {maxy:.2f}]")
    print(f"  margins -> left: {left_pct:.2f}%  right: {right_pct:.2f}%  top: {top_pct:.2f}%  bottom: {bottom_pct:.2f}%")
    print(f"  artwork size as % of canvas -> width: {100-left_pct-right_pct:.2f}%  height: {100-top_pct-bottom_pct:.2f}%")

for f in sys.argv[1:]:
    analyze(f)
