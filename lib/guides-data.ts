export type GuideSection = {
  heading: string;
  body: string;
};

export type Guide = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  readTime: string;
  publishedAt: string;
  sections: GuideSection[];
  relatedHandle?: string; // Shopify product handle
  // Optional German translations. When present and the visitor's language is
  // German, the page renders these instead of the English fields. Guides
  // without a German variant simply fall back to English.
  titleDe?: string;
  descriptionDe?: string;
  tagDe?: string;
  readTimeDe?: string;
  sectionsDe?: GuideSection[];
};

export const GUIDES: Guide[] = [
  {
    slug: "what-is-bpc-157",
    title: "What is BPC-157? Research overview",
    description: "A comprehensive overview of Body Protection Compound-157, its mechanism of action, and its role in cellular and tissue repair research.",
    tag: "Peptide research",
    readTime: "6 min read",
    publishedAt: "2026-04-01",
    relatedHandle: "bpc-157",
    sections: [
      {
        heading: "What is BPC-157?",
        body: `BPC-157 (Body Protection Compound-157) is a synthetic pentadecapeptide consisting of 15 amino acids. It is a partial sequence of a larger protein found in gastric juice. Its CAS number is 137525-51-0.

BPC-157 is classified as a research-use-only (RUO) compound and is not approved for human therapeutic use. All research using this compound must comply with applicable regulations.`,
      },
      {
        heading: "Mechanism of action",
        body: `In vitro and animal model research suggests BPC-157 may interact with several biological pathways:

• **Growth hormone receptor pathways** — BPC-157 has been studied for its potential modulation of the GH-receptor signalling cascade, which is implicated in cellular growth and repair.

• **Nitric oxide (NO) system** — Several studies have demonstrated an effect on NO production, which plays a role in vascular function and tissue perfusion.

• **Tendon and ligament fibroblasts** — Research in rat models has shown accelerated collagen reorganisation following tendon injury.

• **Gastrointestinal mucosa** — Originally derived from gastric juice, studies have investigated its effects on the intestinal epithelium in cell and animal models.`,
      },
      {
        heading: "Research model summary",
        body: `The majority of published research uses rodent models (rat or mouse). Key areas of investigation include:

1. Tendon-to-bone healing (Achilles tendon transection models)
2. Muscle repair after crush injury
3. Intestinal anastomosis healing
4. Corneal repair
5. Bone regeneration in fracture models

As of 2026, no double-blind placebo-controlled human clinical trials have been completed or published.`,
      },
      {
        heading: "Storage and handling",
        body: `BPC-157 is supplied as a lyophilized (freeze-dried) powder. For laboratory use:

• Store at −20 °C (long-term) or 4 °C (short-term, ≤ 4 weeks)
• Reconstitute with bacteriostatic water (0.9% benzyl alcohol) or sterile saline
• Avoid repeated freeze-thaw cycles
• Protect from light and moisture`,
      },
      {
        heading: "Purity and quality",
        body: `BioSyncLabs BPC-157 is independently verified to ≥ 99% purity by reverse-phase HPLC. A Certificate of Analysis (CoA) is available online for every batch. The CoA includes the HPLC chromatogram, mass spectrometry confirmation, and lot number.`,
      },
    ],
  },
  {
    slug: "retatrutide-research-guide",
    title: "Retatrutide dosing research guide",
    description: "An overview of Retatrutide — the triple agonist GLP-1/GIP/glucagon peptide — covering receptor pharmacology and research protocols used in metabolic studies.",
    tag: "Metabolic research",
    readTime: "8 min read",
    publishedAt: "2026-03-15",
    relatedHandle: "retatrutide",
    sections: [
      {
        heading: "What is Retatrutide?",
        body: `Retatrutide (LY3437943) is a long-acting acylated peptide that simultaneously agonises three receptors: glucagon-like peptide-1 (GLP-1), glucose-dependent insulinotropic polypeptide (GIP), and the glucagon receptor (GCGR). CAS: 2381879-91-8.

Developed as a next-generation metabolic peptide following the success of semaglutide (GLP-1 mono) and tirzepatide (GLP-1/GIP dual), the addition of glucagon agonism is hypothesised to increase energy expenditure beyond what dual agonism achieves alone.

Retatrutide is research-use only. It has not received regulatory approval for clinical or therapeutic use.`,
      },
      {
        heading: "Triple receptor pharmacology",
        body: `**GLP-1 receptor (GLP-1R):** Located in the pancreas, brain (hypothalamus), gut, heart and kidney. GLP-1R activation reduces appetite centrally, slows gastric emptying and stimulates glucose-dependent insulin secretion.

**GIP receptor (GIPR):** Expressed in adipose tissue, bone, brain and pancreatic beta cells. GIP has complex and context-dependent effects on fat metabolism and may enhance GLP-1R signalling.

**Glucagon receptor (GCGR):** Expressed predominantly in the liver and brown adipose tissue. Glucagon increases hepatic glucose output and stimulates lipolysis and thermogenesis. In the context of concurrent GLP-1R agonism (which counteracts hyperglycaemia), net glucagon agonism can increase energy expenditure without clinically significant hyperglycaemia in research models.`,
      },
      {
        heading: "Research dosing protocols",
        body: `The Phase 2 clinical study (NCT04881760) by Eli Lilly tested escalating doses from 1 mg to 12 mg administered weekly subcutaneously in participants with obesity. After 24 weeks, the highest dose cohort achieved a mean weight reduction of approximately 17.5% from baseline.

For in vitro receptor binding assays, Retatrutide is typically prepared in DMSO at 10 mM stock concentration and diluted in assay buffer to the desired concentration.

For rodent pharmacokinetic studies, subcutaneous administration of 1–10 nmol/kg has been reported in published mouse models. These are research doses for animal models and are not applicable to human subjects.`,
      },
      {
        heading: "Reconstitution",
        body: `Retatrutide is supplied as lyophilized powder. For research use:

• Reconstitute in bacteriostatic water (preferred for multi-dose vials) or sterile PBS
• Typical research stock concentration: 1 mg/mL
• Store reconstituted solution at 4 °C for up to 28 days; avoid freeze-thaw after reconstitution
• Protect from UV light`,
      },
      {
        heading: "Purity and verification",
        body: `BioSyncLabs Retatrutide is independently verified to ≥ 99% purity by HPLC with NMR structural confirmation. The CoA is available for direct download on the Lab Results page and from each product listing.`,
      },
    ],
  },
  {
    slug: "ghk-cu-copper-peptide-guide",
    title: "GHK-Cu: Copper peptide research overview",
    description: "GHK-Cu (glycyl-L-histidyl-L-lysine copper(II)) is a naturally occurring plasma tripeptide investigated for tissue repair and extracellular matrix research.",
    tag: "Cellular repair",
    readTime: "5 min read",
    publishedAt: "2026-02-20",
    relatedHandle: "ghk-cu",
    sections: [
      {
        heading: "Overview",
        body: `GHK-Cu (CAS: 49557-75-7) is the copper complex of the tripeptide glycyl-L-histidyl-L-lysine (GHK). It is endogenously present in human plasma, saliva and urine and declines significantly with age — from approximately 200 ng/mL at age 20 to < 80 ng/mL at age 60.

Its research interest stems from a broad range of observed bioactivities in vitro and in animal models, including modulation of collagen synthesis and related cellular signalling pathways.`,
      },
      {
        heading: "Key research areas",
        body: `**Tissue repair:** GHK-Cu has been studied extensively in excisional repair models. It appears to attract immune cells to the site, stimulate fibroblast proliferation, and accelerate collagen and glycosaminoglycan synthesis.

**Skin biology:** In human fibroblast cell culture, GHK-Cu upregulates collagen, elastin and decorin synthesis. It also promotes metalloproteinase activity (MMP-2, MMP-9) which remodels aged cross-linked collagen.

**Cytokine signalling:** In LPS-stimulated macrophage models, GHK-Cu has been observed to modulate cytokine expression, including TNF-α.

**Gene expression:** Studies have examined GHK-Cu's interaction with the Nrf2 signalling pathway in cell models.`,
      },
      {
        heading: "Stability and storage",
        body: `GHK-Cu is stable as a lyophilized powder. Store at −20 °C protected from light. After reconstitution in sterile water or PBS, use within 14 days when stored at 4 °C.

Note: GHK-Cu is blue in solution (characteristic of copper(II) complexes). A faded or colourless solution may indicate copper dissociation — do not use if the expected colour is absent.`,
      },
    ],
  },
  {
    slug: "tb-500-thymosin-beta-4-guide",
    title: "TB-500 research overview",
    description: "TB-500 is the synthetic version of the Thymosin Beta-4 fragment, studied for its role in actin regulation, cellular migration and tissue recovery mechanisms.",
    tag: "Tissue repair",
    readTime: "5 min read",
    publishedAt: "2026-01-10",
    relatedHandle: "tb-500",
    sections: [
      {
        heading: "What is TB-500?",
        body: `TB-500 refers to the synthetic form of the active fragment of Thymosin Beta-4 (Tβ4), a 43-amino-acid actin-sequestering protein. The synthetic fragment corresponds to amino acids 17–23 of Tβ4 (Ac-LKKTETQ). CAS: 885340-08-9.

Thymosin Beta-4 is produced by platelets, white blood cells and other cell types and is released in high concentrations following tissue injury. Research has focused on its role as a promoter of angiogenesis, cellular migration, and inflammatory regulation.`,
      },
      {
        heading: "Mechanism of action",
        body: `TB-500 functions primarily through its interaction with G-actin (globular actin). By binding monomeric actin and preventing its polymerisation into F-actin filaments, Tβ4 regulates cytoskeletal dynamics critical to cell migration.

In tissue-repair models, this promotes keratinocyte and endothelial cell migration into the repair site. TB-500 also appears to upregulate matrix metalloproteinases (MMPs) and modulate inflammatory mediators, facilitating extracellular matrix remodelling.`,
      },
      {
        heading: "Animal model research",
        body: `Published rodent and large animal studies have examined TB-500 in:

• Cardiac muscle repair following myocardial infarction (mouse/rat)
• Dermal repair (full-thickness excision models)
• Corneal repair
• Traumatic brain injury (mouse)
• Tendon injury (horse — naturally occurring Tβ4)

As with other research peptides, translation to human clinical outcomes has not been established and no human clinical data exists.`,
      },
      {
        heading: "Reconstitution and storage",
        body: `Store lyophilized TB-500 at −20 °C. Reconstitute with bacteriostatic water immediately before use. Reconstituted solutions are stable for 28 days at 4 °C. Avoid light exposure and repeated freeze-thaw.`,
      },
    ],
  },
];

export function getGuideBySlug(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** A guide resolved into a single language (German fields when lang === "de"
 *  and they exist, otherwise English). */
export type LocalizedGuide = {
  slug: string;
  title: string;
  description: string;
  tag: string;
  readTime: string;
  publishedAt: string;
  sections: GuideSection[];
  relatedHandle?: string;
};

export function localizeGuide(guide: Guide, lang: "en" | "de"): LocalizedGuide {
  const de = lang === "de";
  return {
    slug: guide.slug,
    title: de && guide.titleDe ? guide.titleDe : guide.title,
    description:
      de && guide.descriptionDe ? guide.descriptionDe : guide.description,
    tag: de && guide.tagDe ? guide.tagDe : guide.tag,
    readTime: de && guide.readTimeDe ? guide.readTimeDe : guide.readTime,
    publishedAt: guide.publishedAt,
    sections: de && guide.sectionsDe ? guide.sectionsDe : guide.sections,
    relatedHandle: guide.relatedHandle,
  };
}
