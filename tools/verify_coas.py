#!/usr/bin/env python3
"""Self-consistency check on regenerated CoAs.

For each PDF:
  1. Extract text layer
  2. Find header purity (Purity XX.XX%)
  3. Extract the embedded chromatogram image
  4. OCR the legend region using simple text search — actually we control
     the generator, so we can re-derive the legend % from the manifest
     and just cross-check against the header.

Actually the simpler check: parse the PDF text layer for the Purity %.
The chromatogram image is rendered FROM the same manifest entry, so as
long as the header text says XX.XX% AND the manifest says XX.XX% we are
consistent.
"""
import json
import os
import re
import sys
from pypdf import PdfReader

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
COAS_DIR = os.path.join(ROOT, "public", "COAS")
MANIFEST = os.path.join(ROOT, "tools", "coa_manifest.json")


def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    with open(MANIFEST, encoding="utf-8") as f:
        manifest = json.load(f)
    by_file = {p["file"]: p for p in manifest["products"]}

    fail = 0
    print("=" * 96)
    print(f"{'File':<42} {'Header%':>9} {'Mfst%':>9} {'>=99':>6}  {'Match':>6}")
    print("=" * 96)
    for f in sorted(os.listdir(COAS_DIR)):
        if not f.lower().endswith(".pdf"):
            continue
        path = os.path.join(COAS_DIR, f)
        r = PdfReader(path)
        txt = " ".join((p.extract_text() or "") for p in r.pages)
        entry = by_file.get(f, {})
        # Water products carry pH, not a purity % — they're valid if the
        # CoA shows a pH spec instead.
        is_water = (entry.get("formula") or "").upper() == "H2O"
        if is_water:
            has_ph = re.search(r"\bpH\b", txt) is not None
            flag99 = "n/a"
            flagm = "OK" if has_ph else "FAIL"
            if not has_ph:
                fail += 1
            print(f"{f:<42} {'pH':>9} {'pH':>9} {flag99:>6}  {flagm:>6}")
            continue
        m = re.search(r"Purity\s+(\d{1,3}\.\d{1,3})\s*%", txt)
        header = float(m.group(1)) if m else None
        mfst = entry.get("purity")
        is99 = header is not None and header >= 99.0
        matches = (
            header is not None
            and mfst is not None
            and abs(header - mfst) < 0.005
        )
        flag99 = "OK" if is99 else "FAIL"
        flagm = "OK" if matches else "FAIL"
        if not (is99 and matches):
            fail += 1
        hdr_s = f"{header:.2f}" if header is not None else "-"
        mfs_s = f"{mfst:.2f}" if mfst is not None else "-"
        print(f"{f:<42} {hdr_s:>9} {mfs_s:>9} {flag99:>6}  {flagm:>6}")
    print("=" * 96)
    print(f"Result: {len(by_file)} products  fail={fail}")
    return 1 if fail else 0


if __name__ == "__main__":
    sys.exit(main())
