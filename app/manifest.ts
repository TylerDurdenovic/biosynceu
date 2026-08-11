import type { MetadataRoute } from "next";

/**
 * Web App Manifest (Next.js App Router convention).
 *
 * Provides PWA / "Add to Home Screen" signals and feeds Google's page-experience
 * surface. Colors match the dark brand background (#0B1929). Icons reference the
 * existing /icon.png asset at the two sizes Google expects (192 + 512).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BioSyncLabs",
    short_name: "BioSyncLabs",
    description:
      "Germany-based EU research peptide supplier. Buy BPC-157, TB-500, GHK-Cu, Retatrutide and more — HPLC-verified ≥99% purity. Research Use Only.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B1929",
    theme_color: "#0B1929",
    lang: "en",
    categories: ["shopping", "medical"],
    icons: [
      {
        src: "/icon.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icon.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
  };
}
