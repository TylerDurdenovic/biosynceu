#!/usr/bin/env python3
"""Extract structured fields from each CoA PDF text layer.

Produces a JSON manifest with every per-product value so the generator
script can produce internally-consistent replacements.
"""
import json
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


FIELDS = [
    ("product", r"Product\s+(.+?)\s+Batch"),
    ("batch", r"Batch\s+([A-Z0-9-]+)"),
    ("cas", r"CAS\s+([\d-]+)"),
    ("formula", r"Formula\s+([A-Z][A-Za-z0-9()]+)"),
    ("appearance", r"Appearance\s+(.+?)\s+Mol"),
    ("mol_wt", r"Mol\.?\s*Wt\.?\s+([\d.]+\s*g/mol)"),
    ("quantity", r"Quantity\s+(.+?)\s+Purity"),
    ("purity_header", r"Purity\s+(\d{1,3}\.\d{1,3}\s*%)"),
    ("content", r"Content\s+(.+?)\s+Analysis Method"),
    ("analysis_date", r"Conducted\s+(\d{4}-\d{2}-\d{2})"),
    ("principal_chemist", r"Principal Chemist\s*(.+?)(?:\s+Produced|$)"),
    ("produced", r"Produced\s+(\d{4}-\d{2}-\d{2})"),
    ("storage", r"Storage\s+(.+?)(?:\s+QC|$)"),
    ("qc_status", r"QC Status\s+(.+?)\s+Report No"),
    ("report_no", r"Report No\.?\s+([A-Z0-9-]+)"),
]


def normalize(s: str) -> str:
    return re.sub(r"\s+", " ", s).strip()


def extract(path: str) -> dict:
    r = PdfReader(path)
    txt_parts = []
    for p in r.pages:
        txt_parts.append(p.extract_text() or "")
    full = normalize("\n".join(txt_parts))

    rec = {"file": os.path.basename(path)}
    for key, pat in FIELDS:
        m = re.search(pat, full)
        rec[key] = normalize(m.group(1)) if m else None

    # Pull the analysis method (multi-line, between "Analysis Method" and "Analysis Conducted")
    method_m = re.search(
        r"Analysis Method\s+(.+?)(?:Analysis\s+Conducted|Principal Chemist)",
        full,
    )
    rec["method"] = normalize(method_m.group(1)) if method_m else None

    return rec


def main():
    out = []
    for f in sorted(os.listdir(COAS_DIR)):
        if not f.lower().endswith(".pdf"):
            continue
        path = os.path.join(COAS_DIR, f)
        try:
            out.append(extract(path))
        except Exception as e:
            print(f"ERR {f}: {e}", file=sys.stderr)
            out.append({"file": f, "error": str(e)})

    sys.stdout.reconfigure(encoding="utf-8")
    print(json.dumps(out, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    main()
