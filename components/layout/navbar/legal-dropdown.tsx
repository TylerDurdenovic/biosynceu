"use client";

import Link from "next/link";
import { useRef, useState } from "react";

const LEGAL_NAV = [
  { title: "Terms of Service", path: "/terms-of-service" },
  { title: "Refund & Returns", path: "/refund-returns" },
  { title: "Shipping Policy", path: "/shipping-policy" },
  { title: "Privacy Policy", path: "/privacy-policy" },
];

export default function LegalDropdown() {
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setOpen(false), 120);
  };

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  return (
    <div
      className="relative"
      onMouseEnter={() => { cancelClose(); setOpen(true); }}
      onMouseLeave={scheduleClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        className="flex items-center gap-1 rounded-md px-2 py-1.5 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-blue-700"
      >
        Legal
        <svg
          className={`h-3.5 w-3.5 transition-transform duration-150 ${open ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>

      {/* Invisible bridge so moving mouse into dropdown doesn't trigger close */}
      {open && <div className="absolute right-0 top-full h-2 w-full" />}

      {open && (
        <div
          className="absolute right-0 top-[calc(100%+4px)] z-50 min-w-[210px] rounded-xl border border-slate-200 bg-white py-2 shadow-lg"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          role="menu"
        >
          <div className="mb-1 border-b border-slate-100 px-3 pb-2 pt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
              RUO Products Only
            </span>
          </div>
          {LEGAL_NAV.map((item) => (
            <Link
              key={item.title}
              href={item.path}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm text-slate-600 transition-colors hover:bg-slate-50 hover:text-blue-700"
            >
              {item.title}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
