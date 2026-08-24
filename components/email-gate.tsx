"use client";

import { useEffect, useState } from "react";

const SEEN_KEY = "bsl_email_gate_v1";
const AGE_KEY = "bsl_age_verified_v1";

/**
 * Dismissible email-capture gate.
 *
 * Sits in front of the catalogue to build the list (and to satisfy merchant
 * processors that require a gated site), but stays skippable so the
 * conversion-rate hit of a hard gate is avoided.
 *
 * Deliberately waits for the 21+ age gate to be cleared first — two stacked
 * blocking overlays on a first visit is what kills conversion outright.
 */
export function EmailGate() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  useEffect(() => {
    let cancelled = false;

    const maybeOpen = () => {
      if (cancelled) return false;
      try {
        if (localStorage.getItem(SEEN_KEY)) return true; // already handled
        if (!localStorage.getItem(AGE_KEY)) return false; // age gate still up
        setOpen(true);
        return true;
      } catch {
        return true; // storage unavailable — don't nag
      }
    };

    if (maybeOpen()) return;
    // Age gate is still showing; re-check until it clears.
    const iv = setInterval(() => {
      if (maybeOpen()) clearInterval(iv);
    }, 600);
    return () => {
      cancelled = true;
      clearInterval(iv);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    try {
      localStorage.setItem(SEEN_KEY, "1");
    } catch {
      /* ignore */
    }
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setErr("Please enter a valid email address.");
      return;
    }
    setErr("");
    setStatus("loading");
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: clean }),
      });
      if (!res.ok) throw new Error("subscribe failed");
      setStatus("done");
      setTimeout(close, 1400);
    } catch {
      // Never trap the visitor behind a failing API — let them through.
      setErr("Could not sign you up right now.");
      setStatus("idle");
      setTimeout(close, 1200);
    }
  };

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="email-gate-title"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <button
          type="button"
          onClick={close}
          aria-label="Close"
          className="absolute right-3 top-3 z-10 flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <div className="bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] px-7 py-6 text-center">
          <p className="text-[11px] font-bold uppercase tracking-widest text-white/80">
            Research access
          </p>
          <h2 id="email-gate-title" className="mt-1 text-2xl font-bold text-white">
            Get catalogue access
          </h2>
          <p className="mt-1 text-sm text-white/80">
            New compound releases, batch CoAs &amp; research updates.
          </p>
        </div>

        <div className="px-7 py-6">
          {status === "done" ? (
            <p className="py-4 text-center text-sm font-semibold text-emerald-600">
              You&apos;re on the list — enjoy the catalogue.
            </p>
          ) : (
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.com"
                autoComplete="email"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition-colors focus:border-[#06B6D4] dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              />
              {err && <p className="text-xs font-medium text-red-500">{err}</p>}
              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full rounded-xl bg-gradient-to-r from-[#06B6D4] to-[#1D4ED8] px-5 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {status === "loading" ? "Signing up…" : "Unlock catalogue"}
              </button>
              <button
                type="button"
                onClick={close}
                className="text-xs font-medium text-slate-400 underline underline-offset-4 transition-colors hover:text-slate-600"
              >
                Continue without signing up
              </button>
            </form>
          )}

          <p className="mt-4 text-center text-[11px] leading-relaxed text-slate-400">
            For laboratory research use only. Not for human consumption.
          </p>
        </div>
      </div>
    </div>
  );
}
