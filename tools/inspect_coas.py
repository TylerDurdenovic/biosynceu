#!/usr/bin/env python3
"""Inspect all CoA PDFs and report any purity / RT-annotation mismatches.

Strategy:
  - Walk public/COAS/*.pdf
  - Decompress every page's content stream
  - Scan for parenthesized strings that mention 'Purity', '%', 'RT', 'min'
  - Pull out the header Purity value and the graph RT/% annotation values
  - Report mismatches AND any values < 99.00
"""
import os
import re
import sys
from pypdf import PdfReader

COAS_DIR = os.path.join(
    os.path.dirname(os.path.abspath(__file__)),
    "..",
    "public",
    "COAS",
)


def extract_strings(text: str) -> list[str]:
    """Hand-rolled PDF (...) string scanner — handles nested parens + \\ escapes."""
    out = []
    i, n = 0, len(text)
    BS = chr(92)  # '\'
    while i < n:
        if text[i] == "(":
            depth = 1
            i += 1
            buf = []
            while i < n and depth:
                ch = text[i]
                if ch == BS:
                    if i + 1 < n:
                        buf.append(text[i : i + 2])
                        i += 2
                        continue
                elif ch == "(":
                    depth += 1
                    buf.append(ch)
                elif ch == ")":
                    depth -= 1
                    if depth == 0:
                        i += 1
                        break
                    buf.append(ch)
                else:
                    buf.append(ch)
                i += 1
            out.append("".join(buf))
        else:
            i += 1
    return out


def scan_pdf(path: str) -> dict:
    r = PdfReader(path)
    all_strs = []
    for pg in r.pages:
        contents = pg.get_object().get("/Contents")
        if contents is None:
            continue
        if not isinstance(contents, list):
            contents = [contents]
        for c in contents:
            try:
                data = c.get_object().get_data()
            except Exception:
                continue
            text = data.decode("latin-1", errors="replace")
            all_strs.extend(extract_strings(text))

    # Find header purity value (immediately after the word "Purity")
    header_purity = None
    rt_values = []
    pct_values_in_annot = []
    # Concatenate all strings into a haystack so re-flowed purity (e.g. "99." + "57%")
    # can still be detected.
    joined = " ".join(all_strs)

    # Header purity is usually the FIRST <99-100>.<dd>% in the doc — find first
    # standalone percent.
    pct_re = re.compile(r"(\d{2,3}\.\d{1,3})\s*%")
    m_first = pct_re.search(joined)
    if m_first:
        header_purity = float(m_first.group(1))

    # RT annotations on the chromatogram — format like "RT:6.157 min 98.74%"
    rt_re = re.compile(r"RT[:\s]*([\d.]+)\s*min[^0-9]*(\d{2,3}\.\d{1,3})\s*%")
    for m in rt_re.finditer(joined):
        rt_values.append((float(m.group(1)), float(m.group(2))))

    # Catch any naked numeric % values that aren't the header purity (might be
    # mole-% / TFA% / etc — flagged for human inspection)
    all_pcts = [float(m.group(1)) for m in pct_re.finditer(joined)]

    return {
        "file": os.path.basename(path),
        "header_purity": header_purity,
        "rt_annotations": rt_values,
        "all_percents": all_pcts,
        "joined": joined,
    }


def main():
    paths = sorted(
        os.path.join(COAS_DIR, f)
        for f in os.listdir(COAS_DIR)
        if f.lower().endswith(".pdf")
    )
    rows = []
    for p in paths:
        try:
            r = scan_pdf(p)
            rows.append(r)
        except Exception as e:
            print(f"ERROR scanning {p}: {e}", file=sys.stderr)

    # Report
    print("=" * 110)
    print(f"{'File':<45} {'Header%':>9} {'RT annotations':<35} {'Issue'}")
    print("=" * 110)
    for r in rows:
        hp = r["header_purity"]
        rts = r["rt_annotations"]
        rt_str = "; ".join(f"RT={rt:.3f} {pc:.2f}%" for rt, pc in rts) or "(none in text layer)"
        problems = []
        if hp is None:
            problems.append("no header purity found")
        elif hp < 99.0:
            problems.append(f"<99% header ({hp:.2f}%)")
        for rt, pc in rts:
            if pc < 99.0:
                problems.append(f"RT {rt}: graph={pc:.2f}% <99")
            if hp is not None and abs(hp - pc) > 0.005:
                problems.append(f"MISMATCH: header={hp:.2f}% graph={pc:.2f}%")
        flag = " | ".join(problems) or "ok"
        print(f"{r['file']:<45} {hp if hp is not None else '?':>9} {rt_str:<35} {flag}")
    print("=" * 110)


if __name__ == "__main__":
    main()
