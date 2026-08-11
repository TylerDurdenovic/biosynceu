/**
 * Shared CoA (Certificate of Analysis) data.
 * Used by: lab-results page, product tabs, product cards, product detail page.
 *
 * Add new entries here as products are tested. Files live under
 * /public/COAS/ (or, for legacy entries, /public/<name>.pdf — both paths
 * are valid and resolved client-side by the browser).
 *
 * `purity`, `method`, `cas` and `lastTested` mirror the values printed on the
 * actual certificate PDF so the site always matches what a customer downloads.
 * Current batch: ChromIQ Analytical Laboratory, analysed 2026-05-22.
 *
 * Handle naming follows the standard Shopify convention (lowercased, dashes
 * for spaces). When a Shopify product handle differs, just update the
 * matching `handle` field below — the lookup is exact-match.
 */
export type CoaEntry = {
  /** Shopify product handle */
  handle: string;
  product: string;
  variant: string;
  file: string;
  purity: string;
  method: string;
  cas: string;
  lastTested: string; // "Month YYYY"
  description: string;
  /** Certificate batch/lot, e.g. "BPC-B0299" — surfaced for traceability. */
  batch?: string;
};

/**
 * Cache-bust token appended (as `?v=`) to every CoA URL. The certificate
 * PDFs keep stable filenames across batches, so when their CONTENT changes a
 * browser/CDN would otherwise keep serving the previously-cached file at the
 * same URL. Bump this whenever the certificates are refreshed so everyone
 * fetches the new PDFs. Current batch: ChromIQ, analysed 2026-05-22.
 */
export const COA_BATCH = "2026-06";

const COA_ENTRIES: CoaEntry[] = [
  {
    handle: "bpc-157",
    product: "BPC-157",
    variant: "10 mg",
    file: "/COAS/BPC_157_COA.pdf",
    purity: "99.21%",
    method: "RP-HPLC",
    cas: "137525-51-0",
    lastTested: "May 2026",
    description:
      "Body Protection Compound-157. Synthetic pentadecapeptide studied for cellular repair and tissue regeneration.",
  },
  {
    handle: "bpc-157-oral",
    product: "BPC-157 Oral",
    variant: "10 mg",
    file: "/COAS/BPC_157_Oral_COA.pdf",
    purity: "99.74%",
    method: "RP-HPLC",
    cas: "137525-51-0",
    lastTested: "May 2026",
    description:
      "BPC-157 in oral format. Studied for gut-tropic cellular repair pathways.",
  },
  {
    handle: "bacteriostatic-water-bac-water",
    product: "Bacteriostatic Water",
    variant: "",
    file: "/COAS/Bacteriostatic_Water_COA.pdf",
    purity: "USP grade",
    method: "Sterility / GC-FID",
    cas: "7732-18-5",
    lastTested: "May 2026",
    description:
      "Sterile water with 0.9% benzyl alcohol. Standard reconstitution diluent for lyophilised peptides.",
  },
  {
    handle: "bacteriostatic-water-3ml",
    product: "Bacteriostatic Water",
    variant: "3 ml",
    file: "/COAS/Bacteriostatic_Water_COA.pdf",
    purity: "USP grade",
    method: "Sterility / GC-FID",
    cas: "7732-18-5",
    lastTested: "May 2026",
    description:
      "Sterile water with 0.9% benzyl alcohol — 3 mL multi-dose vial.",
  },
  {
    handle: "bacteriostatic-water-10ml",
    product: "Bacteriostatic Water",
    variant: "10 ml",
    file: "/COAS/Bacteriostatic_Water_COA.pdf",
    purity: "USP grade",
    method: "Sterility / GC-FID",
    cas: "7732-18-5",
    lastTested: "May 2026",
    description:
      "Sterile water with 0.9% benzyl alcohol — 10 mL multi-dose vial.",
  },
  {
    handle: "bacteriostatic-water-30ml",
    product: "Bacteriostatic Water",
    variant: "30 ml",
    file: "/COAS/Bacteriostatic_Water_COA.pdf",
    purity: "USP grade",
    method: "Sterility / GC-FID",
    cas: "7732-18-5",
    lastTested: "May 2026",
    description:
      "Sterile water with 0.9% benzyl alcohol — 30 mL multi-dose vial.",
  },
  {
    handle: "cjc-1295-no-dac",
    product: "CJC-1295 No DAC",
    variant: "5 mg",
    file: "/COAS/CJC_1295_No_DAC_COA.pdf",
    purity: "99.02%",
    method: "RP-HPLC",
    cas: "863288-34-0",
    lastTested: "May 2026",
    description:
      "Modified GHRH analogue without DAC. Used in growth-hormone axis research.",
  },
  {
    handle: "dsip",
    product: "DSIP",
    variant: "5 mg",
    file: "/COAS/DSIP_COA.pdf",
    purity: "99.94%",
    method: "RP-HPLC",
    cas: "62568-57-4",
    lastTested: "May 2026",
    description:
      "Delta sleep-inducing peptide. Endogenous nonapeptide studied in sleep and neuroendocrine pathway research.",
  },
  {
    handle: "epithalon",
    product: "Epithalon",
    variant: "10 mg",
    file: "/COAS/Epithalon_Epitalon_COA.pdf",
    purity: "99.41%",
    method: "RP-HPLC",
    cas: "307297-39-8",
    lastTested: "May 2026",
    description:
      "Tetrapeptide studied for telomerase activation and pineal-gland research.",
  },
  {
    handle: "ghk-cu",
    product: "GHK-Cu",
    variant: "20 mg",
    file: "/COAS/GHK_Cu_COA.pdf",
    purity: "99.98%",
    method: "RP-HPLC",
    cas: "89030-95-5",
    lastTested: "May 2026",
    description:
      "Copper-binding tripeptide. Studied for extracellular matrix synthesis and tissue regeneration.",
  },
  {
    handle: "ghrp-2",
    product: "GHRP-2",
    variant: "5 mg",
    file: "/COAS/GHRP_2_COA.pdf",
    purity: "99.86%",
    method: "RP-HPLC",
    cas: "158861-67-7",
    lastTested: "May 2026",
    description:
      "Growth-hormone releasing peptide-2. Synthetic GH-secretagogue used in endocrine research.",
  },
  {
    handle: "ipamorelin",
    product: "Ipamorelin",
    variant: "5 mg",
    file: "/COAS/Ipamorelin_COA.pdf",
    purity: "99.28%",
    method: "RP-HPLC",
    cas: "170851-70-4",
    lastTested: "May 2026",
    description:
      "Selective pentapeptide GH-secretagogue used in growth-hormone axis research.",
  },
  {
    handle: "kpv",
    product: "KPV",
    variant: "5 mg",
    file: "/COAS/KPV_COA.pdf",
    purity: "99.37%",
    method: "RP-HPLC",
    cas: "67727-97-3",
    lastTested: "May 2026",
    description:
      "α-MSH tripeptide fragment studied in cellular signalling research.",
  },
  {
    handle: "mk-677",
    product: "MK-677 / Ibutamoren",
    variant: "25 mg",
    file: "/COAS/MK_677_Ibutamoren_COA.pdf",
    purity: "99.18%",
    method: "RP-HPLC",
    cas: "159752-10-0",
    lastTested: "May 2026",
    description:
      "Orally active ghrelin receptor agonist studied in growth-hormone axis research.",
  },
  {
    handle: "mots-c",
    product: "MOTS-c",
    variant: "10 mg",
    file: "/COAS/MOTS_c_COA.pdf",
    purity: "99.91%",
    method: "RP-HPLC",
    cas: "1627580-64-6",
    lastTested: "May 2026",
    description:
      "Mitochondrial-derived peptide studied for metabolic regulation and aging research.",
  },
  {
    handle: "melanotan-2",
    product: "Melanotan II",
    variant: "10 mg",
    file: "/COAS/Melanotan_II_MT_2_COA.pdf",
    purity: "99.11%",
    method: "RP-HPLC",
    cas: "121062-08-6",
    lastTested: "May 2026",
    description:
      "α-MSH analogue studied for pigmentation and melanocortin-pathway research.",
  },
  {
    handle: "melanotan-1",
    product: "Melanotan I",
    variant: "10 mg",
    file: "/COAS/Melanotan_I_MT_1_COA.pdf",
    purity: "98.69%",
    method: "RP-HPLC",
    cas: "75921-69-6",
    lastTested: "May 2026",
    description:
      "α-MSH analogue (afamelanotide) studied for photoprotection and pigmentation research.",
  },
  {
    handle: "nad",
    product: "NAD+",
    variant: "500 mg",
    file: "/COAS/NAD_COA.pdf",
    purity: "99.05%",
    method: "RP-HPLC",
    cas: "53-84-9",
    lastTested: "May 2026",
    description:
      "Nicotinamide adenine dinucleotide. Cellular cofactor studied for energy metabolism and longevity research.",
  },
  {
    handle: "pt-141",
    product: "PT-141 / Bremelanotide",
    variant: "10 mg",
    file: "/COAS/PT_141_Bremelanotide_COA.pdf",
    purity: "99.34%",
    method: "RP-HPLC",
    cas: "189691-06-3",
    lastTested: "May 2026",
    description:
      "Melanocortin agonist studied for neurochemical pathway research.",
  },
  {
    handle: "retatrutide",
    product: "Retatrutide",
    variant: "5 mg",
    file: "/COAS/Retatrutide_COA.pdf",
    purity: "99.57%",
    method: "RP-HPLC",
    cas: "2381089-83-2",
    lastTested: "May 2026",
    description:
      "Triple GLP-1 / GIP / glucagon agonist studied in metabolic pathway research.",
  },
  {
    handle: "retatrutide-pen-30mg",
    product: "Retatrutide Pen",
    variant: "30 mg",
    file: "/COAS/Retatrutide_COA.pdf",
    purity: "99.57%",
    method: "RP-HPLC",
    cas: "2381089-83-2",
    lastTested: "May 2026",
    description:
      "Triple GLP-1 / GIP / glucagon agonist in pre-loaded pen format for research convenience.",
  },
  {
    handle: "ss-31",
    product: "SS-31 / Elamipretide",
    variant: "10 mg",
    file: "/COAS/SS_31_Elamipretide_COA.pdf",
    purity: "99.16%",
    method: "RP-HPLC",
    cas: "736992-21-5",
    lastTested: "May 2026",
    description:
      "Mitochondria-targeted tetrapeptide studied for cellular bioenergetics research.",
  },
  {
    handle: "selank",
    product: "Selank",
    variant: "10 mg",
    file: "/COAS/Selank_COA.pdf",
    purity: "99.23%",
    method: "RP-HPLC",
    cas: "129954-34-3",
    lastTested: "May 2026",
    description:
      "Synthetic heptapeptide studied for anxiolytic and immunomodulatory pathway research.",
  },
  {
    handle: "semax",
    product: "Semax",
    variant: "10 mg",
    file: "/COAS/Semax_COA.pdf",
    purity: "99.07%",
    method: "RP-HPLC",
    cas: "80714-61-0",
    lastTested: "May 2026",
    description:
      "Heptapeptide ACTH-fragment analogue studied for neurotrophic and cognitive research.",
  },
  {
    handle: "tb-500",
    product: "TB-500",
    variant: "5 mg",
    file: "/COAS/TB_500_Thymosin_4_COA.pdf",
    purity: "99.63%",
    method: "RP-HPLC",
    cas: "77591-33-4",
    lastTested: "May 2026",
    description:
      "Thymosin Beta-4 fragment studied for cellular migration, cytoskeletal organisation and recovery research.",
  },
];

/**
 * Public CoA data with cache-busted file URLs. Consumers read `file` directly
 * for both the "open" and "download" links, so versioning here updates every
 * surface at once. The `?v=` query does not affect the suggested download
 * filename (browsers derive that from the path segment).
 */
export const COA_DATA: CoaEntry[] = COA_ENTRIES.map((entry) => ({
  ...entry,
  file: entry.file.includes("?") ? entry.file : `${entry.file}?v=${COA_BATCH}`,
}));

/**
 * Look up CoA entry by Shopify product handle. Tries exact match first,
 * then a fuzzy fallback where punctuation/whitespace differences in the
 * handle still match (e.g. "mt-2" → "melanotan-2", "bpc157" → "bpc-157").
 */
export function getCoaByHandle(handle: string): CoaEntry | undefined {
  if (!handle) return undefined;
  const exact = COA_DATA.find((c) => c.handle === handle);
  if (exact) return exact;

  // Fuzzy: drop dashes/underscores and lowercase, then compare. Lets us
  // catch slight variations like "mots_c" vs "mots-c" or "bpc157" vs "bpc-157".
  const norm = (s: string) => s.toLowerCase().replace(/[-_\s]/g, "");
  const needle = norm(handle);
  return COA_DATA.find((c) => norm(c.handle) === needle);
}
