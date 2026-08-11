import fs from "fs";
import path from "path";
import { COA_BATCH, COA_DATA, type CoaEntry } from "lib/coa-data";

/**
 * SERVER-ONLY (uses `fs`). Import only from server components.
 *
 * Builds the lab-results CoA list from the ACTUAL PDF files in /public/COAS.
 * The page renders exactly one card per PDF present — drop a file in (or
 * remove one) and the lab page matches it 1:1, with no code edit.
 *
 * Rich metadata (purity, CAS, method, last-tested, description) is pulled from
 * COA_DATA when a matching entry exists. A file with no entry yet still shows
 * up — with a clean name derived from its filename and the certificate
 * download — but NO invented purity/CAS values.
 *
 * Runs at build time (the lab-results page is statically rendered), when the
 * full repo including /public is present.
 */

const COAS_DIR = path.join(process.cwd(), "public", "COAS");

/** "/COAS/BPC_157_COA.pdf?v=2026-05" -> "BPC_157_COA.pdf" */
function baseName(file: string): string {
  return file.split("/").pop()!.split("?")[0]!;
}

/**
 * Normalise a basename to its canonical form, tolerating the double-extension
 * and " (2)" mangling that messaging apps add on download:
 *   "BPC_157_COA.pdf.pdf"        -> "BPC_157_COA.pdf"
 *   "Retatrutide_COA.pdf (2).pdf" -> "Retatrutide_COA.pdf"
 *   "Semax_COA.pdf"               -> "Semax_COA.pdf"
 * So metadata lookups and display names stay correct even if a mangled file
 * is dropped in.
 */
function canonicalBase(file: string): string {
  let b = baseName(file).replace(/\.pdf$/i, ""); // drop the real .pdf
  b = b.replace(/\s*\(\d+\)\s*$/, ""); // drop a trailing " (2)"
  if (!/\.pdf$/i.test(b)) b += ".pdf"; // re-add .pdf (was clean) — else it stays
  return b;
}

/** "BPC_157_COA.pdf" -> "BPC 157" */
function nameFromFile(file: string): string {
  return canonicalBase(file)
    .replace(/\.pdf$/i, "")
    .replace(/_?COA$/i, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Certificate batch/lot per canonical filename, read off each ChromIQ PDF.
 * Surfaced on the cards for traceability. Update when a new batch is added.
 */
const BATCH_BY_FILE: Record<string, string> = {
  "BPC_157_COA.pdf": "BPC-B0299",
  "BPC_157_Oral_COA.pdf": "BPCO-B0231",
  "Bacteriostatic_Water_COA.pdf": "BAC-B0261",
  "CJC_1295_No_DAC_COA.pdf": "CJC-B0177",
  "DSIP_COA.pdf": "DSIP-B0157",
  "Epithalon_Epitalon_COA.pdf": "EPI-B0209",
  "GHK_Cu_COA.pdf": "GHKCU-B0166",
  "GHRP_2_COA.pdf": "GHRP2-B0151",
  "Ipamorelin_COA.pdf": "IPA-B0241",
  "KPV_COA.pdf": "KPV-B0182",
  "MK_677_Ibutamoren_COA.pdf": "MK677-B0142",
  "MOTS_c_COA.pdf": "MOTSC-B0118",
  "Melanotan_II_MT_2_COA.pdf": "MT2-B0188",
  "Melanotan_I_MT_1_COA.pdf": "MT1-B0134",
  "NAD_COA.pdf": "NAD-B0220",
  "PT_141_Bremelanotide_COA.pdf": "PT141-B0205",
  "Retatrutide_COA.pdf": "RETA-B0103",
  "SS_31_Elamipretide_COA.pdf": "SS31-B0129",
  "Selank_COA.pdf": "SEL-B0172",
  "Semax_COA.pdf": "SMX-B0163",
  "TB_500_Thymosin_4_COA.pdf": "TB500-B0195",
};

export function getCoaList(): CoaEntry[] {
  let files: string[];
  try {
    files = fs
      .readdirSync(COAS_DIR)
      .filter((f) => f.toLowerCase().endsWith(".pdf"));
  } catch {
    return [];
  }

  // Metadata lookup keyed by canonical (de-mangled) filename.
  const metaByCanon = new Map<string, CoaEntry>();
  for (const e of COA_DATA) {
    const c = canonicalBase(e.file);
    if (!metaByCanon.has(c)) metaByCanon.set(c, e);
  }

  const seen = new Set<string>();
  const list: CoaEntry[] = [];
  for (const file of files.sort((a, b) => a.localeCompare(b))) {
    const canon = canonicalBase(file);
    if (seen.has(canon)) continue; // collapse a mangled + clean copy of one CoA
    seen.add(canon);

    const batch = BATCH_BY_FILE[canon];

    const meta = metaByCanon.get(canon);
    if (meta) {
      list.push(batch ? { ...meta, batch } : meta);
      continue;
    }

    // File with no metadata yet — honest minimal card, no invented values.
    const product = nameFromFile(file) || canon;
    const handle =
      product.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") ||
      canon;
    list.push({
      handle,
      product,
      variant: "",
      file: `/COAS/${encodeURIComponent(baseName(file))}?v=${COA_BATCH}`,
      purity: "",
      method: "",
      cas: "",
      lastTested: "",
      description: "",
      batch: batch ?? "",
    });
  }
  return list;
}
