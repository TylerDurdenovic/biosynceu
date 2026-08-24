"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "bsl_age_verified_v1";

/**
 * 21+ age / research-use gate.
 *
 * Blocks the page until the visitor confirms they are 21 or older and that
 * they are acquiring the compounds for laboratory research use only. Required
 * for RUO compound advertising — the gate must sit in front of the content,
 * not alongside it.
 *
 * Renders nothing on the server pass and while the stored decision is being
 * read, so a returning visitor never sees a flash of the gate. Declining sends
 * the visitor away rather than revealing the catalogue.
 */
export function AgeGate() {
  // "checking" until localStorage is read — avoids both a hydration mismatch
  // and a flash of the overlay for someone who already confirmed.
  const [state, setState] = useState<"checking" | "blocked" | "passed" | "declined">(
    "checking",
  );

  useEffect(() => {
    try {
      setState(localStorage.getItem(SEEN_KEY) ? "passed" : "blocked");
    } catch {
      // Sandboxed iframe / storage disabled — gate rather than fail open.
      setState("blocked");
    }
  }, []);

  // Freeze background scroll while the gate is up.
  useEffect(() => {
    if (state !== "blocked" && state !== "declined") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [state]);

  const confirm = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore — they'll simply be asked again next visit */
    }
    setState("passed");
  };

  if (state === "checking" || state === "passed") return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="age-gate-title"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 p-4 backdrop-blur-sm"
    >
      <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-900 p-7 text-center shadow-2xl">
        {state === "declined" ? (
          <>
            <h2 id="age-gate-title" className="text-xl font-bold text-white">
              Access denied
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              You must be 21 or older and acquiring these compounds for
              laboratory research use to access this site.
            </p>
            <button
              type="button"
              onClick={() => setState("blocked")}
              className="mt-6 text-xs font-semibold text-slate-400 underline underline-offset-4 hover:text-slate-200"
            >
              Go back
            </button>
          </>
        ) : (
          <>
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full border-2 border-cyan-400/40 bg-cyan-400/10">
              <span className="text-lg font-black tracking-tight text-cyan-300">21+</span>
            </div>

            <h2 id="age-gate-title" className="text-xl font-bold text-white">
              Age &amp; research-use verification
            </h2>

            <p className="mt-3 text-sm leading-relaxed text-slate-300">
              All products on this site are supplied{" "}
              <strong className="font-semibold text-white">
                for laboratory research use only
              </strong>{" "}
              and are{" "}
              <strong className="font-semibold text-white">
                not for human consumption
              </strong>
              .
            </p>

            <p className="mt-4 text-sm leading-relaxed text-slate-300">
              By entering you confirm you are{" "}
              <strong className="font-semibold text-white">21 years or older</strong>{" "}
              and are acquiring these compounds strictly for in-vitro laboratory
              research.
            </p>

            <div className="mt-7 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={confirm}
                className="w-full rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 active:scale-[.99]"
              >
                I am 21+ and confirm research use
              </button>
              <button
                type="button"
                onClick={() => setState("declined")}
                className="w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition-colors hover:bg-slate-800"
              >
                Exit
              </button>
            </div>

            <p className="mt-5 text-[11px] leading-relaxed text-slate-500">
              For laboratory research use only. Not for human consumption.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
