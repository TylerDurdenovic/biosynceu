import Footer from "components/layout/footer";
import { getGuideBySlug, GUIDES, localizeGuide } from "lib/guides-data";
import { baseUrl } from "lib/utils";
import type { Metadata } from "next";
import { cookies } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  return GUIDES.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  const guideUrl = `${baseUrl}/guides/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: {
      canonical: `/guides/${guide.slug}`,
    },
    openGraph: {
      type: "article",
      url: guideUrl,
      siteName: "BioSyncLabs",
      title: guide.title,
      description: guide.description,
      publishedTime: guide.publishedAt,
      authors: ["BioSyncLabs"],
      tags: [guide.tag],
    },
    twitter: {
      card: "summary_large_image",
      title: guide.title,
      description: guide.description,
    },
  };
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const raw = getGuideBySlug(slug);
  if (!raw) notFound();

  // Render in the visitor's language (German fields when present + lang=de).
  const cookieStore = await cookies();
  const lang = cookieStore.get("lang")?.value === "de" ? "de" : "en";
  const guide = localizeGuide(raw, lang);

  const guideUrl = `${baseUrl}/guides/${guide.slug}`;

  // Article JSON-LD — qualifies the page for Google's "Article" rich
  // results (headline shown alongside the search snippet, eligible for
  // Top Stories on mobile).
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.publishedAt,
    dateModified: guide.publishedAt,
    author: { "@type": "Organization", name: "BioSyncLabs", url: baseUrl },
    publisher: {
      "@type": "Organization",
      name: "BioSyncLabs",
      logo: { "@type": "ImageObject", url: `${baseUrl}/logo2.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": guideUrl },
    articleSection: guide.tag,
  };

  // BreadcrumbList — shows the Home › Guides › {title} trail in SERPs.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseUrl },
      { "@type": "ListItem", position: 2, name: "Guides", item: `${baseUrl}/guides` },
      { "@type": "ListItem", position: 3, name: guide.title, item: guideUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Header */}
      <div className="border-b border-slate-200 bg-white px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-3xl">
          {/* Breadcrumb */}
          <nav className="mb-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Link href="/" className="hover:text-slate-700">Home</Link>
            <span>/</span>
            <Link href="/guides" className="hover:text-slate-700">Guides</Link>
            <span>/</span>
            <span className="text-slate-600">{guide.title}</span>
          </nav>

          <span className="mb-3 inline-block rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-blue-600">
            {guide.tag}
          </span>
          <h1 className="text-2xl font-bold text-slate-900 md:text-3xl">
            {guide.title}
          </h1>
          <p className="mt-3 text-slate-500">{guide.description}</p>
          <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
            <span>{guide.readTime}</span>
            <span>·</span>
            <span>
              {new Date(guide.publishedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Article body */}
      <div className="bg-slate-50 px-6 py-10 lg:px-8">
        <div className="mx-auto max-w-3xl">
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-8">
            <div className="prose prose-slate max-w-none prose-headings:font-bold prose-headings:text-slate-900 prose-p:text-slate-600 prose-p:leading-relaxed prose-li:text-slate-600 prose-strong:text-slate-800">
              {guide.sections.map((section) => (
                <div key={section.heading} className="mb-8 last:mb-0">
                  <h2 className="mb-3 text-lg font-bold text-slate-900">
                    {section.heading}
                  </h2>
                  <div className="space-y-3">
                    {section.body.split("\n\n").map((para, i) => {
                      // Render bullet lists
                      if (para.startsWith("•") || para.startsWith("1.")) {
                        const lines = para.split("\n");
                        return (
                          <ul key={i} className="space-y-1.5 pl-4">
                            {lines.map((line, j) => {
                              const cleaned = line.replace(/^[•\d.]\s*/, "");
                              return (
                                <li key={j} className="text-sm leading-relaxed text-slate-600">
                                  <span
                                    dangerouslySetInnerHTML={{
                                      __html: cleaned.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                                    }}
                                  />
                                </li>
                              );
                            })}
                          </ul>
                        );
                      }
                      return (
                        <p
                          key={i}
                          className="text-sm leading-relaxed text-slate-600"
                          dangerouslySetInnerHTML={{
                            __html: para.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>"),
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RUO disclaimer */}
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-800">
            <strong>Research use only.</strong> The information in this guide is provided for
            educational and research purposes only. BioSyncLabs compounds are not approved for
            human therapeutic use. Nothing in this guide constitutes medical advice. Always
            comply with applicable regulations in your jurisdiction.
          </div>

          {/* Link to product */}
          {guide.relatedHandle && (
            <div className="mt-6 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Research this compound</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {guide.sections[0]?.heading.split(" ")[0]} — view product
                </p>
              </div>
              <Link
                href={`/product/${guide.relatedHandle}`}
                className="shrink-0 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-slate-700"
              >
                View product →
              </Link>
            </div>
          )}

          <div className="mt-8">
            <Link href="/guides" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l-4-4m0 0l4-4m-4 4h18" />
              </svg>
              All guides
            </Link>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
