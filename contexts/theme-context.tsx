"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  // Storage access is guarded — sandboxed iframes (translator widgets,
  // preview tools) throw on localStorage. Falling back to the default
  // theme keeps the page rendering instead of crashing into the "client
  // exception" error overlay.
  useEffect(() => {
    let initial: Theme = "light";
    try {
      const stored = localStorage.getItem("theme") as Theme | null;
      initial = stored ?? "light";
    } catch {
      // sandboxed / blocked storage — keep default light theme
    }
    setTheme(initial);
    try {
      document.documentElement.classList.toggle("dark", initial === "dark");
    } catch {
      // documentElement.classList should always exist, but be safe
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === "light" ? "dark" : "light";
      try {
        document.documentElement.classList.toggle("dark", next === "dark");
      } catch {}
      try {
        localStorage.setItem("theme", next);
      } catch {
        // sandboxed / blocked storage — preference reverts on reload
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
