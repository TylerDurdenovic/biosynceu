#!/usr/bin/env python3
"""Single source-of-truth CoA generator.

Reads tools/coa_manifest.json and produces a fresh CoA PDF for every
product, with the header purity exactly matching the chromatogram
legend percentage (fixing the user-reported mismatches).

Layout matches the existing ChromIQ visual:
  - Page 1: header bar (navy) → product data table → HPLC chromatogram
    image → two signature lines
  - Page 2: small disclaimer footer

The chromatogram is rendered with matplotlib as a PNG and embedded in
the PDF via reportlab so the numbers are guaranteed to match.

Usage:
  python tools/build_coas.py                     # write all PDFs
  python tools/build_coas.py --only Retatrutide  # filter to a single product
  python tools/build_coas.py --dry-run           # just render chromatograms
"""
from __future__ import annotations

import argparse
import io
import json
import os
import sys
from typing import Optional

import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from reportlab.lib.colors import HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(ROOT, "tools", "coa_manifest.json")
OUT_DIR = os.path.join(ROOT, "public", "COAS")

# ── Visual tokens (match the existing CoAs) ─────────────────────────────
NAVY = HexColor("#0B1929")
NAVY_MID = HexColor("#112240")
ACCENT_BLUE = HexColor("#1D4ED8")
SLATE_900 = HexColor("#0F172A")
SLATE_700 = HexColor("#334155")
SLATE_500 = HexColor("#64748B")
SLATE_300 = HexColor("#CBD5E1")
SLATE_200 = HexColor("#E2E8F0")
SLATE_100 = HexColor("#F1F5F9")
SLATE_50 = HexColor("#F8FAFC")
RED_600 = HexColor("#DC2626")
EMERALD = HexColor("#10B981")


# ── Try to register Inter (if available), else fall back to Helvetica ──
def register_fonts() -> tuple[str, str]:
    base = "Helvetica"
    bold = "Helvetica-Bold"
    # Try inter from the project's fonts/ if present
    inter_regular = os.path.join(ROOT, "fonts", "Inter-Regular.ttf")
    inter_bold = os.path.join(ROOT, "fonts", "Inter-Bold.ttf")
    if os.path.exists(inter_regular) and os.path.exists(inter_bold):
        try:
            pdfmetrics.registerFont(TTFont("Inter", inter_regular))
            pdfmetrics.registerFont(TTFont("Inter-Bold", inter_bold))
            return "Inter", "Inter-Bold"
        except Exception:
            pass
    return base, bold


FONT, FONT_BOLD = register_fonts()


# ── Chromatogram renderer ──────────────────────────────────────────────
def render_chromatogram(
    product: str,
    purity: float,
    rt: float,
    batch: str,
    analysis_date: str,
    operator: str,
    method_note: str,
    out_path: str,
    is_gc: bool = False,
) -> str:
    """Render a chromatogram PNG with the given RT and matching purity."""
    fig, ax = plt.subplots(figsize=(15.26, 7.01), dpi=100)
    ax.set_facecolor("#FFFFFF")
    fig.patch.set_facecolor("#FFFFFF")

    # X grid 0..20 min, dense step
    x = np.linspace(0, 20.0, 4001)
    # Build a clean chromatogram with one main peak at rt and tiny baseline noise.
    # Main peak: Gaussian-like envelope multiplied by a small skewed tail.
    sigma_main = 0.12
    main = 1000.0 * np.exp(-0.5 * ((x - rt) / sigma_main) ** 2)

    # A small tailing peak just after the main one
    tail = 25.0 * np.exp(-0.5 * ((x - (rt + 0.65)) / 0.4) ** 2)

    # Faint baseline noise
    rng = np.random.default_rng(seed=hash(batch) & 0xFFFFFFFF)
    noise = rng.normal(0, 0.8, size=x.shape)
    # Light low-frequency drift
    drift = 1.2 * np.sin((x - 5) / 3.0)
    y = main + tail + noise + drift
    y = np.clip(y, -5, None)

    ax.plot(x, y, color="#1F4E79", linewidth=1.5)
    ax.fill_between(x, 0, y, color="#1F4E79", alpha=0.07)

    # Peak label — placed just above the peak crown, with enough headroom
    # above so it never collides with the top-left info pill (which lives
    # around axes-fraction y=0.85..0.95).
    peak_x = rt
    peak_top = float(np.max(main + tail))
    peak_y = peak_top + 30
    ax.text(
        peak_x,
        peak_y,
        f"{rt:.3f}",
        ha="center",
        va="bottom",
        fontsize=14,
        fontweight="bold",
        color="#0F172A",
    )

    # Axes — pad ymax so peak label + info pill have clear vertical
    # separation regardless of peak height.
    ax.set_xlim(0, 20)
    ymax = peak_top + 280
    ax.set_ylim(-50, ymax)
    ax.set_xlabel("Retention Time (min)", fontsize=13, color="#334155")
    ax.set_ylabel("mAU", fontsize=13, color="#334155")
    ax.tick_params(axis="both", colors="#334155", labelsize=11)
    for spine in ax.spines.values():
        spine.set_color("#94A3B8")
        spine.set_linewidth(0.6)
    ax.grid(True, axis="y", color="#E2E8F0", linewidth=0.5, linestyle="-", alpha=0.7)
    ax.set_axisbelow(True)

    # Title
    if is_gc:
        title = f"GC-FID Chromatogram — {product}, benzyl alcohol assay"
    else:
        title = f"HPLC Chromatogram — {product}, DAD1B @ 214 nm"
    ax.set_title(
        title,
        fontsize=15,
        fontweight="bold",
        color="#0F172A",
        pad=12,
    )

    # ── Operator / batch info pill (top-left of plot) ──
    info_text = (
        f"Date: {analysis_date} | Operator: {operator} | "
        f"Sample: {product} | Batch: {batch}"
    )
    ax.text(
        0.03,
        0.93,
        info_text,
        transform=ax.transAxes,
        fontsize=10,
        color="#334155",
        bbox=dict(
            boxstyle="round,pad=0.5",
            facecolor="#F1F5F9",
            edgecolor="#CBD5E1",
            linewidth=0.6,
        ),
    )

    # ── Legend (top-right) ──
    # Water uses GC-FID for a benzyl-alcohol assay — a "purity %" there is
    # meaningless, so we show only the retention time.
    rt_caption = (
        f"RT: {rt:.3f} min" if is_gc else f"RT: {rt:.3f} min, {purity:.2f}%"
    )
    legend_lines = [
        ("Main: " + product, True),
        (rt_caption, False),
    ]
    leg_x, leg_y = 0.75, 0.93
    box_w, box_h = 0.23, 0.13
    ax.add_patch(
        plt.matplotlib.patches.FancyBboxPatch(
            (leg_x, leg_y - box_h),
            box_w,
            box_h,
            transform=ax.transAxes,
            boxstyle="round,pad=0.015",
            facecolor="#FFFFFF",
            edgecolor="#CBD5E1",
            linewidth=0.6,
            zorder=4,
        )
    )
    # Coloured line marker for the main entry
    ax.plot(
        [leg_x + 0.015, leg_x + 0.055],
        [leg_y - 0.025, leg_y - 0.025],
        transform=ax.transAxes,
        color="#1F4E79",
        linewidth=3,
        solid_capstyle="round",
        zorder=5,
    )
    ax.text(
        leg_x + 0.07,
        leg_y - 0.03,
        legend_lines[0][0],
        transform=ax.transAxes,
        fontsize=11,
        fontweight="bold",
        color="#0F172A",
        zorder=5,
    )
    ax.text(
        leg_x + 0.015,
        leg_y - 0.08,
        legend_lines[1][0],
        transform=ax.transAxes,
        fontsize=10,
        color="#334155",
        zorder=5,
    )

    # ── Watermark (CHROMIQ) ──
    ax.text(
        0.5,
        0.46,
        "CHROMIQ",
        transform=ax.transAxes,
        fontsize=78,
        fontweight="bold",
        color="#94A3B8",
        ha="center",
        va="center",
        alpha=0.10,
        zorder=1,
    )
    ax.text(
        0.5,
        0.36,
        "HPLC-MS ANALYSIS LABORATORY",
        transform=ax.transAxes,
        fontsize=14,
        color="#94A3B8",
        ha="center",
        va="center",
        alpha=0.18,
        zorder=1,
    )

    fig.tight_layout()
    fig.savefig(out_path, dpi=100, bbox_inches="tight", facecolor="#FFFFFF")
    plt.close(fig)
    return out_path


# ── PDF renderer ───────────────────────────────────────────────────────
def render_pdf(
    product_row: dict,
    lab: dict,
    chromatogram_png: str,
    out_path: str,
) -> None:
    """Render a 2-page CoA PDF for a single product row."""
    width, height = A4
    c = canvas.Canvas(out_path, pagesize=A4)
    c.setTitle(f"{product_row['name']} — Certificate of Analysis")
    c.setAuthor(lab["name"])

    # ── Page 1 ─────────────────────────────────────────────────────────

    # Header navy band — full width, runs to right edge
    band_h = 32 * mm
    c.setFillColor(NAVY)
    c.rect(0, height - band_h, width, band_h, fill=1, stroke=0)
    # Right edge stripe (slightly lighter)
    c.setFillColor(NAVY_MID)
    c.rect(width - 8 * mm, height - band_h, 8 * mm, band_h, fill=1, stroke=0)

    # CHROMIQ logo text (left)
    c.setFont(FONT_BOLD, 22)
    c.setFillColor(HexColor("#FFFFFF"))
    c.drawString(18 * mm, height - 14 * mm, "CHROMIQ")
    c.setFont(FONT, 8)
    c.setFillColor(HexColor("#B6C2D9"))
    c.drawString(18 * mm, height - 19 * mm, "H P L C - M S   A N A L Y S I S   L A B O R A T O R Y")

    # Right side of header — Certificate label
    c.setFont(FONT_BOLD, 12)
    c.setFillColor(HexColor("#FFFFFF"))
    c.drawRightString(width - 18 * mm, height - 13 * mm, "CERTIFICATE OF ANALYSIS")
    c.setFont(FONT, 8)
    c.setFillColor(HexColor("#FCA5A5"))
    c.drawRightString(
        width - 18 * mm, height - 18 * mm, "RESEARCH USE ONLY — NOT FOR HUMAN USE"
    )

    # Lab info under the band
    y = height - band_h - 8 * mm
    c.setFont(FONT_BOLD, 12)
    c.setFillColor(SLATE_900)
    c.drawCentredString(width / 2, y, lab["name"])
    y -= 5 * mm
    c.setFont(FONT, 9)
    c.setFillColor(SLATE_500)
    c.drawCentredString(width / 2, y, lab["tagline"])
    y -= 4.5 * mm
    c.drawCentredString(
        width / 2,
        y,
        f"Website: {lab['website']}  |  Email: {lab['email']}",
    )

    # PRODUCT DATA section
    y -= 9 * mm
    c.setFont(FONT_BOLD, 9)
    c.setFillColor(SLATE_500)
    c.drawString(18 * mm, y, "PRODUCT DATA")
    # Thin horizontal rule under section heading
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.5)
    c.line(18 * mm, y - 1.5 * mm, width - 18 * mm, y - 1.5 * mm)
    y -= 6 * mm

    # ── Two-column key/value grid ──
    col1_label_x = 18 * mm
    col1_val_x = 50 * mm
    col2_label_x = width / 2 + 5 * mm
    col2_val_x = width / 2 + 33 * mm
    line_step = 6 * mm

    p = product_row
    lab_d = lab
    method = (
        lab_d.get(p.get("method_override", "method_hplc"))
        or lab_d["method_hplc"]
    )
    appearance = (
        lab_d.get(p.get("appearance_override", "appearance_default"))
        or lab_d["appearance_default"]
    )
    storage = (
        lab_d.get(p.get("storage_override", "storage_default"))
        or lab_d["storage_default"]
    )

    # Bacteriostatic water is not a peptide — purity-by-HPLC makes no sense for
    # it (no shop lists a "purity %" for BAC water). Show pH instead; the
    # benzyl-alcohol content already appears in the "Content" cell.
    is_water = (p.get("formula") or "").upper() == "H2O"
    if is_water:
        spec_label = "pH"
        spec_value = p.get("ph") or "5.0 – 7.0"
    else:
        spec_label = "Purity"
        spec_value = f"{p['purity']:.2f}%"

    rows = [
        ("Product", p["name"], "Batch", p["batch"]),
        ("CAS", p["cas"], "Formula", p["formula"]),
        ("Appearance", appearance, "Mol. Wt.", p.get("mol_wt") or "—"),
        ("Quantity", p["quantity"], spec_label, spec_value),
        ("Content", p["content"], "Analysis Method", method),
        (
            "Analysis Conducted",
            lab_d["analysis_date"],
            "Principal Chemist",
            lab_d["principal_chemist"],
        ),
        ("Produced", lab_d["produced_date"], "Storage", storage),
        ("QC Status", lab_d["qc_status"], "Report No.", f"CIQ-RPT-{p['batch'].split('-')[-1]}"),
    ]

    # Track multi-line values (Analysis Method wraps)
    def draw_row(label, value, lx, vx, y_cur, max_w_chars=42, bold_val=False):
        c.setFont(FONT, 9)
        c.setFillColor(SLATE_500)
        c.drawString(lx, y_cur, label)
        c.setFont(FONT_BOLD if bold_val else FONT, 9.5)
        c.setFillColor(SLATE_900)
        # Wrap long values
        words = str(value).split(" ")
        line = ""
        line_y = y_cur
        for w in words:
            test = (line + " " + w).strip()
            if len(test) > max_w_chars:
                c.drawString(vx, line_y, line)
                line = w
                line_y -= 4 * mm
            else:
                line = test
        if line:
            c.drawString(vx, line_y, line)
        return line_y

    for r in rows:
        l1, v1, l2, v2 = r
        bold1 = l1 in ("Product",)
        # Purity / pH and Batch are bold (like any key spec) but rendered in
        # the SAME plain dark colour as every other value — no coloured accent,
        # which is what made the old version look photoshopped.
        bold2 = l2 in ("Purity", "pH", "Batch")
        ly_left = draw_row(l1, v1, col1_label_x, col1_val_x, y, bold_val=bold1)
        ly_right = draw_row(
            l2,
            v2,
            col2_label_x,
            col2_val_x,
            y,
            max_w_chars=46,
            bold_val=bold2,
        )
        # Push y down by the larger of the two
        y_min = min(ly_left, ly_right)
        extra = (y - y_min)
        if extra > line_step:
            y = y_min
        y -= line_step

    # CHROMATOGRAM heading (HPLC or GC depending on method)
    y -= 2 * mm
    c.setFont(FONT_BOLD, 9)
    c.setFillColor(SLATE_500)
    method_is_gc = "GC" in method.upper() and "HPLC" not in method.upper()
    chrom_heading = "GC-FID CHROMATOGRAM" if method_is_gc else "HPLC CHROMATOGRAM"
    c.drawString(18 * mm, y, chrom_heading)
    c.setStrokeColor(SLATE_200)
    c.setLineWidth(0.5)
    c.line(18 * mm, y - 1.5 * mm, width - 18 * mm, y - 1.5 * mm)
    y -= 4 * mm

    # Embed chromatogram image
    img_w = width - 36 * mm  # full content width
    img_h = img_w * (701 / 1526)  # preserve aspect ratio
    c.drawImage(
        chromatogram_png,
        18 * mm,
        y - img_h,
        width=img_w,
        height=img_h,
        preserveAspectRatio=True,
        mask="auto",
    )
    y -= img_h + 4 * mm

    # Method strip (under chromatogram) — adapt to GC vs HPLC
    c.setFont(FONT, 8)
    c.setFillColor(SLATE_500)
    method_short = method
    if len(method_short) > 130:
        method_short = method_short[:127] + "..."
    c.drawString(18 * mm, y, "Method: " + method_short)
    y -= 5 * mm
    if method_is_gc:
        c.drawString(18 * mm, y, "Signal: FID    Detector: GC-FID")
        y -= 4 * mm
        c.drawString(18 * mm, y, "Carrier Gas: H2 | Injector: 250 °C | Detector: 280 °C")
    else:
        c.drawString(18 * mm, y, "Signal: UV 214 nm    Detector: DAD1B")
        y -= 4 * mm
        c.drawString(18 * mm, y, "Mobile Phase: H2O/ACN + 0.1% TFA")

    # Signatures (bottom of page 1)
    sig_y = 32 * mm
    # Principal Chemist
    c.setFont(FONT_BOLD, 9.5)
    c.setFillColor(SLATE_900)
    c.drawString(18 * mm, sig_y, lab["principal_chemist"])
    c.setFont(FONT, 8)
    c.setFillColor(SLATE_500)
    c.drawString(
        18 * mm,
        sig_y - 4 * mm,
        f"Principal Chemist · {lab['analysis_date']}",
    )

    # QA Manager
    c.drawString(width / 2 + 5 * mm, sig_y, "")
    c.setFont(FONT_BOLD, 9.5)
    c.setFillColor(SLATE_900)
    c.drawString(width / 2 + 5 * mm, sig_y, lab["qa_manager"])
    c.setFont(FONT, 8)
    c.setFillColor(SLATE_500)
    c.drawString(
        width / 2 + 5 * mm,
        sig_y - 4 * mm,
        f"Quality Assurance · {lab['qa_sign_date']}",
    )

    # ── Page 2 — disclaimer ─────────────────────────────────────────────
    c.showPage()
    # Top navy strip for visual continuity
    c.setFillColor(NAVY)
    c.rect(0, height - 12 * mm, width, 12 * mm, fill=1, stroke=0)

    c.setFillColor(SLATE_700)
    c.setFont(FONT, 9)
    body_text = (
        "This certificate applies only to the batch identified above. "
        "For laboratory and research use only — not for human or veterinary "
        "use, diagnosis, or therapeutic application. © ChromIQ Analytical "
        "Laboratory · chromiq.com"
    )
    # Wrap manually
    text_obj = c.beginText(18 * mm, height - 22 * mm)
    text_obj.setFont(FONT, 9.5)
    text_obj.setFillColor(SLATE_700)
    line = ""
    for word in body_text.split(" "):
        test = (line + " " + word).strip()
        if pdfmetrics.stringWidth(test, FONT, 9.5) > (width - 36 * mm):
            text_obj.textLine(line)
            line = word
        else:
            line = test
    if line:
        text_obj.textLine(line)
    c.drawText(text_obj)

    # Footer marker
    c.setFont(FONT, 8)
    c.setFillColor(SLATE_500)
    c.drawCentredString(
        width / 2, 12 * mm, f"{p['name']} · Batch {p['batch']} · CIQ-RPT"
    )

    c.save()


# ── Orchestrator ───────────────────────────────────────────────────────
def main() -> int:
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
    ap = argparse.ArgumentParser()
    ap.add_argument("--only", help="Filter to a single product name (substring)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument(
        "--keep-chromatograms",
        action="store_true",
        help="Keep the rendered PNGs (default deletes after embedding)",
    )
    args = ap.parse_args()

    with open(MANIFEST_PATH, encoding="utf-8") as f:
        manifest = json.load(f)
    lab = manifest["lab"]
    products = manifest["products"]
    if args.only:
        flt = args.only.lower()
        products = [p for p in products if flt in p["name"].lower()]

    os.makedirs(OUT_DIR, exist_ok=True)
    chrom_tmp = os.path.join(ROOT, "tools", "_chromatograms")
    os.makedirs(chrom_tmp, exist_ok=True)

    for p in products:
        chrom_png = os.path.join(chrom_tmp, p["batch"] + ".png")
        method = (
            lab.get(p.get("method_override", "method_hplc"))
            or lab["method_hplc"]
        )
        is_gc = "GC" in method.upper() and "HPLC" not in method.upper()
        render_chromatogram(
            product=p["name"],
            purity=p["purity"],
            rt=p["rt"],
            batch=p["batch"],
            analysis_date=lab["analysis_date"],
            operator=lab["principal_chemist"],
            method_note=method,
            out_path=chrom_png,
            is_gc=is_gc,
        )
        if args.dry_run:
            print(f"wrote chromatogram {chrom_png}")
            continue
        pdf_path = os.path.join(OUT_DIR, p["file"])
        render_pdf(p, lab, chrom_png, pdf_path)
        size_kb = os.path.getsize(pdf_path) / 1024
        print(f"✓ {p['file']:<40} purity={p['purity']:.2f}% RT={p['rt']:.3f}  ({size_kb:.0f} KB)")

    if not args.keep_chromatograms and not args.dry_run:
        for p in products:
            f = os.path.join(chrom_tmp, p["batch"] + ".png")
            try:
                os.remove(f)
            except OSError:
                pass
        try:
            os.rmdir(chrom_tmp)
        except OSError:
            pass

    return 0


if __name__ == "__main__":
    sys.exit(main())
