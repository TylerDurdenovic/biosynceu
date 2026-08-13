"use client";

import { useLanguage } from "contexts/language-context";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

const SYRINGES = [
  { units: 30, img: "/pc/syringe-30-units.png" },
  { units: 50, img: "/pc/syringe-50-units.png" },
  { units: 100, img: "/pc/syringe-100-units.png" },
] as const;

function fill(tpl: string, vars: Record<string, string | number>) {
  return Object.entries(vars).reduce(
    (s, [k, v]) => s.replaceAll(`{${k}}`, String(v)),
    tpl,
  );
}

export default function PeptideCalculatorContent() {
  const { t } = useLanguage();
  const c = t.calculator;

  const [syringe, setSyringe] = useState<number>(100);
  const [vial, setVial] = useState("");
  const [water, setWater] = useState("");
  const [dose, setDose] = useState("");

  const calc = useMemo(() => {
    const v = parseFloat(vial);
    const w = parseFloat(water);
    const d = parseFloat(dose);
    if (!(v > 0) || !(w > 0) || !(d > 0)) return null;

    // Units = (Dose mcg × BAC Water ml) ÷ (Vial mg × 10) — U-100 std (1u = 0.01ml)
    const units = (d * w) / (v * 10);
    const concentration = v / w; // mg/ml
    const volumePerDose = units * 0.01; // ml
    const dosesPerVial = Math.floor((v * 1000) / d);
    return {
      units: Math.round(units * 100) / 100,
      concentration: Math.round(concentration * 100) / 100,
      volumePerDose: Math.round(volumePerDose * 1000) / 1000,
      dosesPerVial,
      over: units > syringe,
    };
  }, [vial, water, dose, syringe]);

  const inputCls =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-900 outline-none transition-colors focus:border-blue-500 focus:ring-2 focus:ring-blue-100 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
  const stepLabel = "mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      {/* Header */}
      <div className="text-center">
        <span className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-600 dark:bg-blue-900/30 dark:text-blue-300">
          {c.badge}
        </span>
        <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white sm:text-4xl">
          {c.title}
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-slate-500 dark:text-slate-400">
          {c.subtitle}
        </p>
      </div>

      {/* Calculator card */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 sm:p-7">
        {/* Step 1 — syringe */}
        <label className={stepLabel}>{c.steps.step1}</label>
        <div className="grid grid-cols-3 gap-2.5">
          {SYRINGES.map((s) => (
            <button
              key={s.units}
              type="button"
              onClick={() => setSyringe(s.units)}
              className={`flex flex-col items-center gap-1 rounded-xl border-2 p-3 transition-all ${
                syringe === s.units
                  ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                  : "border-slate-200 bg-white hover:border-slate-300 dark:border-slate-700 dark:bg-slate-900"
              }`}
            >
              <div className="relative h-10 w-full">
                <Image
                  src={s.img}
                  alt={`${s.units} unit syringe`}
                  fill
                  sizes="120px"
                  className="object-contain"
                />
              </div>
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                {s.units} units
              </span>
            </button>
          ))}
        </div>

        {/* Steps 2–4 — inputs */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div>
            <label className={stepLabel}>{c.steps.step2} (mg)</label>
            <input
              inputMode="decimal"
              value={vial}
              onChange={(e) => setVial(e.target.value)}
              placeholder={c.placeholders.vial}
              className={inputCls}
            />
          </div>
          <div>
            <label className={stepLabel}>{c.steps.step3} (ml)</label>
            <input
              inputMode="decimal"
              value={water}
              onChange={(e) => setWater(e.target.value)}
              placeholder={c.placeholders.water}
              className={inputCls}
            />
          </div>
          <div>
            <label className={stepLabel}>{c.steps.step4} (mcg)</label>
            <input
              inputMode="decimal"
              value={dose}
              onChange={(e) => setDose(e.target.value)}
              placeholder={c.placeholders.dose}
              className={inputCls}
            />
          </div>
        </div>

        {/* Result */}
        <div className="mt-6 rounded-xl bg-slate-50 p-5 dark:bg-slate-800/60">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {c.result.label}
          </p>

          {!calc ? (
            <p className="mt-2 text-slate-500">{c.result.fillPrompt}</p>
          ) : calc.over ? (
            <div className="mt-2 rounded-lg border border-amber-300 bg-amber-50 p-4 dark:border-amber-500/40 dark:bg-amber-900/20">
              <p className="font-bold text-amber-800 dark:text-amber-300">
                {c.result.warning}
              </p>
              <p className="mt-1 text-sm text-amber-800 dark:text-amber-400">
                {fill(c.result.warningBody, { units: calc.units, max: syringe })}
              </p>
            </div>
          ) : (
            <>
              <p className="mt-1 text-lg font-semibold text-slate-900 dark:text-white">
                {fill(c.result.instruction, { dose, units: calc.units })}
              </p>
              <div className="mt-3 flex items-center justify-center rounded-lg bg-blue-600 py-4 text-center">
                <span className="text-3xl font-extrabold text-white">
                  {fill(c.result.unitsLabel, { units: calc.units })}
                </span>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {c.result.concentration}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                    {calc.concentration} mg/ml
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {c.result.volumePerDose}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                    {calc.volumePerDose} ml
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {c.result.dosesPerVial}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">
                    {calc.dosesPerVial}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Formula */}
        <p className="mt-4 text-xs leading-relaxed text-slate-400">
          <span className="font-semibold text-slate-500 dark:text-slate-400">
            {c.formula.label}
          </span>{" "}
          {c.formula.body}
        </p>
      </div>

      {/* Reconstitution guide */}
      <div className="mt-12">
        <p className="text-center text-xs font-bold uppercase tracking-wider text-blue-600">
          {c.reconstitution.eyebrow}
        </p>
        <h2 className="mt-2 text-center text-2xl font-bold text-slate-900 dark:text-white">
          {c.reconstitution.title}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-sm text-slate-500 dark:text-slate-400">
          {c.reconstitution.subtitle}
        </p>
        <div className="mt-6 space-y-3">
          {c.reconstitution.steps.map((s, i) => (
            <div
              key={i}
              className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900"
            >
              <h3 className="font-semibold text-slate-900 dark:text-white">
                {s.title}
              </h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {s.body}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Disclaimer */}
      <div className="mt-8 rounded-xl border border-amber-300 bg-amber-50 p-5 dark:border-amber-500/40 dark:bg-amber-900/10">
        <p className="font-bold text-amber-900 dark:text-amber-300">
          {c.disclaimer.title}
        </p>
        <p className="mt-1.5 text-sm leading-relaxed text-amber-800 dark:text-amber-400">
          {c.disclaimer.body}
        </p>
      </div>

      {/* CTA */}
      <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-slate-900 p-8 text-center dark:bg-slate-800">
        <p className="text-lg font-semibold text-white">{c.cta.question}</p>
        <Link
          href="/product/bacteriostatic-water-bac-water"
          className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-slate-900 transition-colors hover:bg-slate-100"
        >
          {c.cta.button}
        </Link>
      </div>
    </div>
  );
}
