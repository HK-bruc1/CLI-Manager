import { useEffect, useState } from "react";
import type { Language } from "./i18n";

export type Preferences = { theme: "light" | "dark" | "system"; language: Language; fontSize: number };
const KEY = "cli-manager.tap.preferences";
/** Invalid/blocked storage must never keep the workspace from opening. */
export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(() => {
    let saved: Partial<Preferences> = {};
    try { saved = JSON.parse(localStorage.getItem(KEY) ?? "{}"); } catch { /* Optional persistence. */ }
    return {
      theme: saved?.theme === "light" || saved?.theme === "dark" ? saved.theme : "system",
      language: saved?.language === "en-US" ? "en-US" : "zh-CN",
      fontSize: typeof saved?.fontSize === "number" ? Math.min(24, Math.max(11, saved.fontSize)) : 14,
    };
  });
  const [phone, setPhone] = useState(() => matchMedia("(max-width: 767px), (pointer: coarse) and (max-height: 500px)").matches);
  useEffect(() => {
    const media = matchMedia("(max-width: 767px), (pointer: coarse) and (max-height: 500px)");
    const change = () => setPhone(media.matches);
    media.addEventListener("change", change); return () => media.removeEventListener("change", change);
  }, []);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* Optional persistence. */ }
    const media = matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const dark = prefs.theme === "dark" || (prefs.theme === "system" && media.matches);
      document.documentElement.dataset.theme = dark ? "dark" : "light";
      document.documentElement.lang = prefs.language;
      document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#17151c" : "#ffffff");
    };
    apply(); media.addEventListener("change", apply); return () => media.removeEventListener("change", apply);
  }, [prefs]);
  return { prefs, setPrefs, phone };
}
