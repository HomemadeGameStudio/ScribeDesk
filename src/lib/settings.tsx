import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { MethodId, SearchId } from "./router";
import { METHODS } from "./router";

/* ------------------------------- types ------------------------------- */

export type ThemeId = "graphite" | "oled" | "matrix" | "custom";
export type FontId = "grotesk" | "geist" | "inter" | "jetbrains";
export type DensityId = "compact" | "wide" | "list";
export type DisguiseId = "none" | "wiki" | "sheets" | "textbook";
export type PanicKind = "docs" | "desmos";

export interface Settings {
  theme: ThemeId;
  customBg: string;
  accent: string;
  font: FontId;
  radius: number;
  blur: number;
  density: DensityId;
  sidebar: boolean;
  engine: MethodId;
  gateway: string;
  search: SearchId;
  panicScreen: PanicKind;
  disguise: DisguiseId;
}

export const DEFAULT_SETTINGS: Settings = {
  theme: "graphite",
  customBg: "#0f0f0f",
  accent: "#43d9ad",
  font: "grotesk",
  radius: 6,
  blur: 14,
  density: "compact",
  sidebar: true,
  engine: "auto",
  gateway: "https://your-uv-gateway.example/service",
  search: "wikipedia",
  panicScreen: "docs",
  disguise: "none",
};

/* ------------------------------ palettes ----------------------------- */

export const THEMES: Record<Exclude<ThemeId, "custom">, Record<string, string>> = {
  graphite: { bg0: "#0e0e10", bg1: "#151517", bg2: "#1b1b1f", bg3: "#24242b", fg: "#ededf0", mut: "#90919b", line: "rgba(255,255,255,0.075)" },
  oled: { bg0: "#000000", bg1: "#0a0a0b", bg2: "#111113", bg3: "#1a1a1e", fg: "#f1f1f3", mut: "#8b8b92", line: "rgba(255,255,255,0.09)" },
  matrix: { bg0: "#020805", bg1: "#05110a", bg2: "#081a10", bg3: "#0d2517", fg: "#d9ffe9", mut: "#6fae8c", line: "rgba(90,255,170,0.10)" },
};

function hexRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(v.slice(0, 2), 16) || 0, parseInt(v.slice(2, 4), 16) || 0, parseInt(v.slice(4, 6), 16) || 0];
}
function shift(hex: string, amt: number): string {
  const [r, g, b] = hexRgb(hex);
  const f = (c: number) => Math.max(0, Math.min(255, Math.round(c + amt)));
  return `#${[f(r), f(g), f(b)].map((c) => c.toString(16).padStart(2, "0")).join("")}`;
}

function customPalette(hex: string): Record<string, string> {
  const [r, g, b] = hexRgb(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  const dark = lum < 0.55;
  return {
    bg0: hex,
    bg1: shift(hex, dark ? 7 : -7),
    bg2: shift(hex, dark ? 14 : -14),
    bg3: shift(hex, dark ? 24 : -24),
    fg: dark ? "#ececEF".toLowerCase() : "#151517",
    mut: dark ? "#90919b" : "#5d5d66",
    line: dark ? "rgba(255,255,255,0.075)" : "rgba(0,0,0,0.12)",
  };
}

export const FONTS: Record<FontId, { label: string; body: string }> = {
  grotesk: { label: "Space Grotesk", body: '"Space Grotesk", sans-serif' },
  geist: { label: "Geist Mono", body: '"Geist Mono", monospace' },
  inter: { label: "Inter", body: '"Inter", sans-serif' },
  jetbrains: { label: "JetBrains Mono", body: '"JetBrains Mono", monospace' },
};

/* ------------------------------ disguises ---------------------------- */

export interface Disguise {
  id: DisguiseId;
  brand: string;
  tag: string;
  title: string;
  catalogTitle: string;
  lessonsLabel: string;
  glyph: "pen" | "book" | "sheet" | "sigma";
  favColor: string; // "ACCENT" sentinel follows the live accent
  desc: string;
  patch: Partial<Settings>;
}

export const DISGUISES: Disguise[] = [
  {
    id: "none", brand: "ScribeDesk", tag: "Student Workspace", title: "ScribeDesk — Student Workspace",
    catalogTitle: "Course Catalog", lessonsLabel: "Lessons", glyph: "pen", favColor: "ACCENT",
    desc: "Full ScribeDesk identity.", patch: {},
  },
  {
    id: "wiki", brand: "ScribeDocs", tag: "Documentation Wiki", title: "ScribeDocs — Documentation",
    catalogTitle: "Documentation Index", lessonsLabel: "Docs", glyph: "book", favColor: "#5b8def",
    desc: "Morphs into a bland internal docs wiki — list density, muted blue, Inter.",
    patch: { theme: "graphite", accent: "#5b8def", font: "inter", density: "list", radius: 4, blur: 8 },
  },
  {
    id: "sheets", brand: "Sheetly", tag: "Spreadsheet Utility", title: "Sheetly — Untitled spreadsheet",
    catalogTitle: "Template Library", lessonsLabel: "Sheets", glyph: "sheet", favColor: "#34a853",
    desc: "Becomes a spreadsheet utility — OLED black, Sheets green, tight radius.",
    patch: { theme: "oled", accent: "#34a853", font: "inter", density: "compact", radius: 2, blur: 6 },
  },
  {
    id: "textbook", brand: "Algebrax", tag: "Mathematics Index", title: "Algebrax — Mathematics Textbook Index",
    catalogTitle: "Chapter Index", lessonsLabel: "Chapters", glyph: "sigma", favColor: "#e8b45a",
    desc: "Reskins as a math textbook companion — amber accent, wide cards.",
    patch: { theme: "graphite", accent: "#e8b45a", font: "grotesk", density: "wide", radius: 10, blur: 16 },
  },
];

/* ------------------------------ favicons ----------------------------- */

function favHref(glyph: string, color: string): string {
  let inner = "";
  if (glyph === "pen") inner = `<path d='M16 5l7 7-9.5 12.5L7 26l1.5-6.5L18 7z' fill='none' stroke='${color}' stroke-width='2.2' stroke-linejoin='round'/>`;
  else if (glyph === "book") inner = `<rect x='7' y='5' width='18' height='22' rx='2' fill='none' stroke='${color}' stroke-width='2.2'/><path d='M11 11h10M11 16h10M11 21h6' stroke='${color}' stroke-width='2.2' stroke-linecap='round'/>`;
  else if (glyph === "sheet") inner = `<rect x='5' y='5' width='22' height='22' rx='2' fill='none' stroke='${color}' stroke-width='2.2'/><path d='M5 13h22M5 20h22M13 5v22' stroke='${color}' stroke-width='2'/>`;
  else if (glyph === "sigma") inner = `<text x='16' y='24' font-family='Georgia,serif' font-size='22' fill='${color}' text-anchor='middle'>Σ</text>`;
  else if (glyph === "docs") inner = `<path d='M8 4h11l5 5v17a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z' fill='${color}'/><path d='M19 4v5h5z' fill='#8ab6f0'/><path d='M10 15h12M10 19h12M10 23h8' stroke='#fff' stroke-width='2' stroke-linecap='round'/>`;
  else inner = `<rect x='4' y='4' width='24' height='24' rx='4' fill='#fff'/><path d='M8 24V8M8 24h16' stroke='#444' stroke-width='2'/><path d='M9 22q7-16 15-13' fill='none' stroke='${color}' stroke-width='2.6'/>`;
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='7' fill='${glyph === "docs" || glyph === "desmos" ? "transparent" : "#0e0e10"}'/>${inner}</svg>`;
  return "data:image/svg+xml," + encodeURIComponent(svg);
}

/* --------------------------- log stores ------------------------------ */

export interface NetEntry { id: number; t: string; method: string; url: string; engine: string; status: string; ms: number }
export interface ConEntry { id: number; t: string; level: "log" | "warn" | "error" | "info"; text: string }

let nid = 0;
let netEntries: NetEntry[] = [];
let conEntries: ConEntry[] = [];
const netLs = new Set<() => void>();
const conLs = new Set<() => void>();

export function netPush(e: Omit<NetEntry, "id" | "t">): void {
  nid += 1;
  netEntries = [{ ...e, id: nid, t: new Date().toLocaleTimeString("en-GB") }, ...netEntries].slice(0, 200);
  netLs.forEach((l) => l());
}
export function conPush(level: ConEntry["level"], text: string): void {
  nid += 1;
  conEntries = [{ id: nid, t: new Date().toLocaleTimeString("en-GB"), level, text }, ...conEntries].slice(0, 200);
  conLs.forEach((l) => l());
}
export function clearLogs(): void {
  netEntries = [];
  conEntries = [];
  netLs.forEach((l) => l());
  conLs.forEach((l) => l());
}
export const useNetLog = () => useSyncExternalStore((l) => (netLs.add(l), () => netLs.delete(l)), () => netEntries);
export const useConsoleLog = () => useSyncExternalStore((l) => (conLs.add(l), () => conLs.delete(l)), () => conEntries);

/* ----------------------------- provider ------------------------------ */

interface Ctx {
  s: Settings;
  set: (patch: Partial<Settings>) => void;
  panic: PanicKind | null;
  setPanic: (p: PanicKind | null) => void;
  togglePanic: () => void;
  brand: Disguise;
}

const SettingsCtx = createContext<Ctx | null>(null);
const KEY = "sd:settings:v2";

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [s, setS] = useState<Settings>(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(KEY) || "null");
      if (!raw) return { ...DEFAULT_SETTINGS };
      const merged = { ...DEFAULT_SETTINGS, ...(raw as Partial<Settings>) };
      if (!METHODS.some((m) => m.id === merged.engine)) merged.engine = "auto"; // migrate stale v1 engine ids
      return merged;
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });
  const [panic, setPanic] = useState<PanicKind | null>(null);

  const set = (patch: Partial<Settings>) => setS((old) => ({ ...old, ...patch }));
  const togglePanic = () => setPanic((p) => (p ? null : s.panicScreen));

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* quota */
    }
  }, [s]);

  useEffect(() => {
    const pal = s.theme === "custom" ? customPalette(s.customBg) : THEMES[s.theme];
    const root = document.documentElement.style;
    (["bg0", "bg1", "bg2", "bg3", "fg", "mut", "line"] as const).forEach((k) => root.setProperty("--" + k, pal[k]));
    root.setProperty("--acc", s.accent);
    root.setProperty("--radius", s.radius + "px");
    root.setProperty("--blur", s.blur + "px");
    root.setProperty("--font-body", FONTS[s.font].body);
    root.setProperty("--font-mono", s.font === "grotesk" || s.font === "inter" ? '"Geist Mono", monospace' : FONTS[s.font].body);
  }, [s]);

  useEffect(() => {
    const d = DISGUISES.find((x) => x.id === s.disguise) ?? DISGUISES[0];
    const link = document.getElementById("sd-favicon") as HTMLLinkElement | null;
    if (panic) {
      document.title = panic === "docs" ? "Untitled document - Google Docs" : "Desmos | Graphing Calculator";
      if (link) link.href = favHref(panic, panic === "docs" ? "#1a73e8" : "#17a05e");
    } else {
      document.title = d.title;
      if (link) link.href = favHref(d.glyph, d.favColor === "ACCENT" ? s.accent : d.favColor);
    }
  }, [s, panic]);

  const brand = DISGUISES.find((x) => x.id === s.disguise) ?? DISGUISES[0];

  return (
    <SettingsCtx.Provider value={{ s, set, panic, setPanic, togglePanic, brand }}>{children}</SettingsCtx.Provider>
  );
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsCtx);
  if (!ctx) throw new Error("useSettings outside provider");
  return ctx;
}
