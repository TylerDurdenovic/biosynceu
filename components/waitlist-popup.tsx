"use client";

import { useEffect, useRef, useState } from "react";

const SEEN_KEY = "bslwl_seen_v2pen";
const BASE = 132;

/**
 * V2 pen waiting-list popup. First visit only (localStorage-gated), appears
 * after a short delay. Captures the email to Shopify + shows the REAL shared
 * count from /api/waitlist. Kill-switch: set NEXT_PUBLIC_WAITLIST_POPUP=off
 * (gated at the mount site in app/layout.tsx).
 */
export function WaitlistPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [err, setErr] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [count, setCount] = useState(BASE);
  const bumped = useRef(false);

  // First-visit gate + delayed reveal + fetch the live count.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem(SEEN_KEY)) return;
    const timer = setTimeout(() => setOpen(true), 5000);
    fetch("/api/waitlist")
      .then((r) => r.json())
      .then((d) => {
        if (typeof d?.count === "number") setCount(d.count);
      })
      .catch(() => {});
    return () => clearTimeout(timer);
  }, []);

  const dismiss = () => {
    if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
    setOpen(false);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setErr("Please enter a valid email.");
      return;
    }
    setErr("");
    setStatus("loading");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data?.error || "failed");
      if (typeof data.count === "number") {
        setCount(data.count);
        bumped.current = true;
      }
      if (typeof window !== "undefined") localStorage.setItem(SEEN_KEY, "1");
      setStatus("done");
    } catch {
      setStatus("idle");
      setErr("Could not join right now. Please try again.");
    }
  };

  if (!open) return null;

  return (
    <div className="wl-stage" role="dialog" aria-modal="true" aria-labelledby="wl-ttl">
      <style>{CSS}</style>
      <div className="wl-backdrop" onClick={dismiss} />
      <div className="wl-modal">
        <div className="wl-hero">
          <div className="wl-glow" />
          <span className="wl-ribbon">
            <span className="wl-dot" />Free weekly giveaway
          </span>
          <button className="wl-close" onClick={dismiss} aria-label="Close">
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="wl-pen"
            src="/v2-pen-hero.jpg"
            alt="BioSync Labs V2 Retatrutide 30 mg research pen"
          />
          <div className="wl-herocopy">
            <div className="wl-eyebrow">BioSync Labs</div>
            <div className="wl-model">V2 Retatrutide 30&nbsp;mg</div>
          </div>
          <span className="wl-ruo">RUO</span>
        </div>

        {status === "done" ? (
          <div className="wl-done">
            <div className="wl-check">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                <path d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3>You&rsquo;re entered! 🎉</h3>
            <p>
              You&rsquo;re in this week&rsquo;s giveaway for the V2 Retatrutide 30&nbsp;mg pen. If
              you win, we&rsquo;ll email you.
            </p>
            <p>
              You&rsquo;re entry <span className="wl-num">#{count.toLocaleString()}</span>.
            </p>
            <button className="wl-decline" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        ) : (
          <div className="wl-body">
            <h2 id="wl-ttl">
              Win the new <span className="wl-g">V2 Retatrutide 30&nbsp;mg pen.</span>
            </h2>
            <p className="wl-sub">
              Every week we give one away — <b>free</b>. It&rsquo;s our new pre-filled pen:
              ready to use, no reconstitution, no winding. Enter your email for a chance to win
              this week&rsquo;s.
            </p>
            <div className="wl-chips">
              {["Pre-filled — ready to use", "No reconstitution", "Free to enter"].map((c) => (
                <span className="wl-chip" key={c}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                  {c}
                </span>
              ))}
            </div>
            <form onSubmit={submit} noValidate>
              <input
                className="wl-in"
                type="email"
                placeholder="you@lab.com"
                aria-label="Email address"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {err && <p className="wl-err">{err}</p>}
              <button className="wl-cta" type="submit" disabled={status === "loading"}>
                {status === "loading" ? "Entering…" : "Enter the giveaway"}
              </button>
            </form>
            <button className="wl-decline" type="button" onClick={dismiss}>
              No thanks
            </button>
            <div className="wl-divider" />
            <div className="wl-wait">
              <div className="wl-avatars">
                <span className="wl-av wl-av1">TR</span>
                <span className="wl-av wl-av2">JD</span>
                <span className="wl-av wl-av3">AK</span>
              </div>
              <div className="wl-waittxt">
                <b>{count.toLocaleString()}</b> already entered
              </div>
            </div>
            <p className="wl-terms">
              One entry per email · winners emailed · no purchase necessary.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

const CSS = `
.wl-stage{position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
.wl-backdrop{position:absolute;inset:0;background:rgba(6,15,25,.62);backdrop-filter:blur(3px)}
.wl-modal{position:relative;width:100%;max-width:428px;max-height:calc(100vh - 40px);overflow-y:auto;background:#fff;border-radius:22px;box-shadow:0 30px 80px -20px rgba(2,10,20,.7);animation:wlpop .45s cubic-bezier(.2,.9,.25,1) both}
@keyframes wlpop{from{opacity:0;transform:translateY(18px) scale(.97)}to{opacity:1;transform:none}}
@media(prefers-reduced-motion:reduce){.wl-modal{animation:none}}
.wl-hero{position:relative;height:210px;overflow:hidden;border-bottom:1px solid #E3EBF1;background:radial-gradient(120% 90% at 78% 12%,#DFF3F8 0%,#EAF6F9 40%,#F4F8FB 100%);border-radius:22px 22px 0 0}
.wl-glow{position:absolute;left:-14%;top:-32%;width:60%;height:120%;border-radius:50%;background:radial-gradient(circle,rgba(6,182,212,.20),transparent 62%);filter:blur(6px)}
.wl-pen{position:absolute;right:2%;top:50%;transform:translateY(-50%) rotate(6deg);height:230px;width:auto;filter:drop-shadow(0 18px 26px rgba(11,25,41,.22))}
.wl-ribbon{position:absolute;left:16px;top:15px;display:inline-flex;align-items:center;gap:7px;background:rgba(11,25,41,.9);color:#fff;font-size:10px;font-weight:800;letter-spacing:.11em;text-transform:uppercase;padding:7px 12px;border-radius:999px;z-index:2}
.wl-dot{width:6px;height:6px;border-radius:50%;background:#06B6D4;box-shadow:0 0 0 3px rgba(6,182,212,.28);animation:wlpulse 1.8s ease-in-out infinite}
@keyframes wlpulse{0%,100%{opacity:1}50%{opacity:.4}}
.wl-close{position:absolute;right:13px;top:13px;width:32px;height:32px;border-radius:50%;border:none;cursor:pointer;background:rgba(255,255,255,.8);color:#33475b;font-size:18px;line-height:1;display:grid;place-items:center;z-index:2}
.wl-close:hover{background:#fff}.wl-close:focus-visible{outline:2px solid #06B6D4;outline-offset:2px}
.wl-herocopy{position:absolute;left:18px;bottom:14px;z-index:2}
.wl-eyebrow{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:#1D4ED8}
.wl-model{font-size:13px;font-weight:700;color:#0E1E30;margin-top:2px}
.wl-ruo{position:absolute;right:13px;bottom:14px;font-size:9px;font-weight:800;letter-spacing:.1em;color:#5C728A;border:1px solid #C7D6E2;border-radius:5px;padding:2px 6px;background:rgba(255,255,255,.6);z-index:2}
.wl-body{padding:20px 22px 22px}
.wl-body h2{font-size:23px;line-height:1.12;letter-spacing:-.02em;margin:0 0 8px;color:#0E1E30;text-wrap:balance}
.wl-g{background:linear-gradient(90deg,#06B6D4,#1D4ED8);-webkit-background-clip:text;background-clip:text;color:transparent}
.wl-sub{font-size:13.5px;line-height:1.5;color:#5B6B7E;margin:0 0 14px}
.wl-sub b{color:#0E1E30}
.wl-chips{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:16px}
.wl-chip{font-size:11.5px;font-weight:600;color:#0A6C7E;background:#EAF6F9;border:1px solid #CDEAF0;border-radius:999px;padding:5px 11px;display:inline-flex;align-items:center;gap:5px}
.wl-chip svg{width:12px;height:12px;color:#06B6D4}
.wl-body form{display:flex;flex-direction:column;gap:9px}
.wl-in{width:100%;font-family:inherit;font-size:14.5px;padding:13px 14px;border:1.5px solid #E3EBF1;border-radius:12px;background:#fff;color:#0E1E30}
.wl-in::placeholder{color:#9FB1C0}
.wl-in:focus{outline:none;border-color:#06B6D4;box-shadow:0 0 0 4px rgba(6,182,212,.15)}
.wl-cta{width:100%;font-family:inherit;font-size:15.5px;font-weight:800;color:#04222b;cursor:pointer;border:none;border-radius:12px;padding:15px;background:linear-gradient(100deg,#06B6D4,#0EA5C4 55%,#1D4ED8);box-shadow:0 10px 22px -8px rgba(6,132,190,.6)}
.wl-cta:hover{filter:brightness(1.05)}.wl-cta:active{transform:translateY(1px)}.wl-cta:disabled{opacity:.7;cursor:default}
.wl-cta:focus-visible{outline:2px solid #0B1929;outline-offset:2px}
.wl-decline{display:block;width:100%;background:none;border:none;color:#93A4B4;font-size:12.5px;cursor:pointer;padding:9px;font-family:inherit;margin-top:2px}
.wl-decline:hover{color:#5B6B7E;text-decoration:underline}
.wl-err{color:#C0392B;font-size:12px;margin:-2px 0 0}
.wl-divider{height:1px;background:#E3EBF1;margin:15px 0 14px}
.wl-wait{display:flex;align-items:center;gap:11px}
.wl-avatars{display:flex}
.wl-av{width:28px;height:28px;border-radius:50%;border:2px solid #fff;margin-left:-9px;display:grid;place-items:center;font-size:10px;font-weight:800;color:#fff}
.wl-av:first-child{margin-left:0}
.wl-av1{background:linear-gradient(135deg,#06B6D4,#0EA5C4)}.wl-av2{background:linear-gradient(135deg,#1D4ED8,#3B82F6)}.wl-av3{background:linear-gradient(135deg,#0B1929,#334E68)}
.wl-waittxt{font-size:12.5px;color:#5B6B7E}
.wl-waittxt b{color:#0E1E30;font-variant-numeric:tabular-nums;font-size:14px;font-family:ui-monospace,Menlo,monospace}
.wl-terms{font-size:10.5px;color:#A6B5C3;margin-top:12px;line-height:1.4;text-align:center}
.wl-done{padding:32px 24px 24px;text-align:center;animation:wlpop .4s ease both}
.wl-check{width:56px;height:56px;border-radius:50%;margin:0 auto 14px;display:grid;place-items:center;background:linear-gradient(135deg,#06B6D4,#1D4ED8);color:#fff}
.wl-done h3{font-size:20px;margin:0 0 6px;color:#0E1E30;letter-spacing:-.01em}
.wl-done p{font-size:13.5px;color:#5B6B7E;margin:0 0 4px;line-height:1.5}
.wl-num{font-family:ui-monospace,Menlo,monospace;font-weight:800;color:#1D4ED8}
`;
