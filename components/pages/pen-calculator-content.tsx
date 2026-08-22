"use client";

import { useLanguage } from "contexts/language-context";
import Link from "next/link";
import { useMemo, useState } from "react";

const MAX_SINGLE_SHOT_CLICKS = 60;

function fill(tpl: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    tpl,
  );
}

function round(n: number, dp = 2) {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

export default function PenCalculatorContent() {
  const { t } = useLanguage();
  const c = t.penCalculator;
  const [tab, setTab] = useState<"pen" | "vial">("pen");

  // ── Pen tab state ──
  const [penMg, setPenMg] = useState("");
  const [penClicks, setPenClicks] = useState("");
  const [penDose, setPenDose] = useState("");

  // ── Vial tab state ──
  const [vialMg, setVialMg] = useState("");
  const [vialWater, setVialWater] = useState("");
  const [vialDose, setVialDose] = useState("");

  const pen = useMemo(() => {
    const mg = parseFloat(penMg);
    const clicks = parseFloat(penClicks);
    const dose = parseFloat(penDose);
    if (!(mg > 0) || !(clicks > 0)) return null;
    const mcgPerClick = (mg * 1000) / clicks; // total mcg / clicks in full pen
    const maxShotMcg = mcgPerClick * MAX_SINGLE_SHOT_CLICKS;
    if (!(dose > 0)) return { mcgPerClick, maxShotMcg, ready: false as const };
    const rawClicks = dose / mcgPerClick;
    const dialClicks = Math.round(rawClicks);
    const dosesPerPen = Math.floor((mg * 1000) / dose);
    const over = dialClicks > MAX_SINGLE_SHOT_CLICKS;
    const injections = over ? Math.ceil(dialClicks / MAX_SINGLE_SHOT_CLICKS) : 1;
    return {
      ready: true as const,
      mcgPerClick,
      maxShotMcg,
      dialClicks,
      dosesPerPen,
      over,
      injections,
    };
  }, [penMg, penClicks, penDose]);

  const vial = useMemo(() => {
    const mg = parseFloat(vialMg);
    const water = parseFloat(vialWater);
    const dose = parseFloat(vialDose);
    if (!(mg > 0) || !(water > 0) || !(dose > 0)) return null;
    const concentration = mg / water; // mg/ml
    const volume = dose / 1000 / concentration; // ml
    const units = volume * 100; // U-100 insulin syringe
    const dosesPerVial = Math.floor((mg * 1000) / dose);
    return {
      concentration: round(concentration, 2),
      volume: round(volume, 3),
      units: round(units, 1),
      dosesPerVial,
    };
  }, [vialMg, vialWater, vialDose]);

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const label = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          {c.eyebrow}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          {c.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
          {c.subtitle}
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-8 flex gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        {(["pen", "vial"] as const).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors ${
              tab === key
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white"
                : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            {c.tabs[key]}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
        {tab === "pen" ? (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>{c.pen.totalDosage} (mg)</label>
                <input inputMode="decimal" value={penMg} onChange={(e) => setPenMg(e.target.value)} placeholder="e.g. 10" className={inputCls} />
              </div>
              <div>
                <label className={label}>{c.pen.totalClicks}</label>
                <input inputMode="numeric" value={penClicks} onChange={(e) => setPenClicks(e.target.value)} placeholder="e.g. 60" className={inputCls} />
              </div>
              <div>
                <label className={label}>{c.pen.desiredDosage} (mcg)</label>
                <input inputMode="decimal" value={penDose} onChange={(e) => setPenDose(e.target.value)} placeholder="e.g. 250" className={inputCls} />
              </div>
            </div>

            {/* Slider (enabled once pen mg + clicks are set) */}
            {pen && (
              <div className="mt-5">
                <input
                  type="range"
                  min={0}
                  max={Math.round(pen.maxShotMcg)}
                  step={1}
                  value={parseFloat(penDose) || 0}
                  onChange={(e) => setPenDose(e.target.value)}
                  className="w-full accent-blue-600"
                />
                <div className="mt-1 flex justify-between text-[11px] font-medium text-slate-400">
                  <span>{c.pen.sliderMin}</span>
                  <span>{fill(c.pen.sliderMax, { value: Math.round(pen.maxShotMcg) })}</span>
                </div>
              </div>
            )}

            {/* Result */}
            <div className="mt-6 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              {!pen ? (
                <p className="text-slate-500">{c.results.enterAll}</p>
              ) : !pen.ready ? (
                <p className="text-slate-500">{c.results.enterDose}</p>
              ) : (
                <>
                  <div className="flex items-center justify-center rounded-lg bg-blue-600 py-4 text-center">
                    <span className="text-2xl font-extrabold text-white">
                      {fill(pen.dialClicks === 1 ? c.results.dialOne : c.results.dialMany, {
                        clicks: pen.dialClicks,
                        mg: penMg,
                      })}
                    </span>
                  </div>
                  {pen.over && (
                    <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-medium text-amber-800 dark:border-amber-500/40 dark:bg-amber-900/20 dark:text-amber-300">
                      {fill(c.results.overMax, { count: pen.injections })}
                    </p>
                  )}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.results.mcgPerClick}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{round(pen.mcgPerClick, 1)} mcg</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.results.dosesPerPen}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{pen.dosesPerPen}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">{c.footer}</p>
          </>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={label}>{c.vial.amount} (mg)</label>
                <input inputMode="decimal" value={vialMg} onChange={(e) => setVialMg(e.target.value)} placeholder="e.g. 10" className={inputCls} />
              </div>
              <div>
                <label className={label}>{c.vial.water} (ml)</label>
                <input inputMode="decimal" value={vialWater} onChange={(e) => setVialWater(e.target.value)} placeholder="e.g. 2" className={inputCls} />
              </div>
              <div>
                <label className={label}>{c.vial.desiredDosage} (mcg)</label>
                <input inputMode="decimal" value={vialDose} onChange={(e) => setVialDose(e.target.value)} placeholder="e.g. 250" className={inputCls} />
              </div>
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
              {!vial ? (
                <p className="text-slate-500">{c.results.enterAll}</p>
              ) : (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-blue-600 px-5 py-4">
                    <span className="text-sm font-semibold text-white/90">{c.vial.needleVolume}</span>
                    <span className="text-2xl font-extrabold text-white">{vial.volume} ml</span>
                  </div>
                  <p className="mt-3 text-center text-sm font-medium text-slate-600 dark:text-slate-300">
                    {fill(c.results.u100Units, { units: vial.units })}
                  </p>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.results.concentration}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{vial.concentration} mg/ml</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{c.results.dosesPerVial}</p>
                      <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{vial.dosesPerVial}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-slate-400">{c.footerVial}</p>
          </>
        )}
      </div>

      {/* Cross-link to the reconstitution calculator */}
      <div className="mt-6 text-center">
        <Link href="/peptide-calculator" className="text-sm font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400">
          → {t.calculator.title}
        </Link>
      </div>
    </div>
  );
}
