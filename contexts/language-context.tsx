"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import { translations, type Lang } from "lib/i18n/translations";

type LanguageContextValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (typeof translations)[Lang];
};

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: translations.en,
});

export function LanguageProvider({
  children,
  initialLang = "en",
}: {
  children: React.ReactNode;
  /**
   * Language resolved on the server (from the `lang` cookie, falling back to
   * the Accept-Language header) so the very first paint is already in the
   * right language — no English→German flash for German visitors.
   */
  initialLang?: Lang;
}) {
  const router = useRouter();

  const [lang, setLangState] = useState<Lang>(initialLang);

  /* ── resolve language on first render ──
     Priority:
       1. An explicit stored preference (the customer used the toggle before).
       2. Otherwise auto-detect from the browser language — biosynclabs.de is
          a German-market store, and a first-time visitor on a German browser
          was previously shown English (the default), which is exactly what
          customers complained about. de-* browsers now get German out of the
          box while everyone else keeps English.
     Wrapped in try/catch — when the page is rendered inside a sandboxed
     iframe (translator widgets, preview tools, some chat embeds) accessing
     localStorage / document.cookie / navigator throws an uncaught
     DOMException that surfaces as the "Application error: a client-side
     exception has occurred" overlay. Failing silently and falling back to
     "en" is the correct UX in those constrained contexts.
  */
  useEffect(() => {
    try {
      const stored = localStorage.getItem("lang") as Lang | null;
      if (stored === "de" || stored === "en") {
        setLangState(stored);
        return;
      }
    } catch {
      // sandboxed / blocked storage — fall through to auto-detect
    }

    // No stored preference → auto-detect from the browser.
    try {
      const candidates = [
        ...(navigator.languages ?? []),
        navigator.language,
      ].filter(Boolean);
      const prefersGerman = candidates.some((l) =>
        l.toLowerCase().startsWith("de"),
      );
      if (prefersGerman) {
        setLangState("de");
        // Persist so server components (e.g. the shop page, which reads the
        // `lang` cookie) render German on the next navigation too, and so the
        // choice sticks without the customer touching the toggle.
        try {
          localStorage.setItem("lang", "de");
        } catch {
          /* ignore */
        }
        try {
          document.cookie = `lang=de;path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
        } catch {
          /* ignore */
        }
      }
    } catch {
      // navigator unavailable — keep default "en"
    }
  }, []);

  const setLang = useCallback(
    (newLang: Lang) => {
      setLangState(newLang);
      try {
        localStorage.setItem("lang", newLang);
      } catch {
        // sandboxed / blocked storage — fine, state still updates in-memory
      }
      try {
        /* set a cookie so server components can read it on next navigation */
        document.cookie = `lang=${newLang};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
      } catch {
        // sandboxed / blocked cookies — fine, server fallback to default
      }
      /* re-render server components */
      router.refresh();
    },
    [router]
  );

  return (
    <LanguageContext.Provider
      value={{ lang, setLang, t: translations[lang] }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
