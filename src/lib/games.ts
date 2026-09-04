/* ------------------------------------------------------------------ */
/*  scribe://lessons content index.                                    */
/*  Live source: github.com/genizy/web-port — every game lives on its  */
/*  own branch and is served from genizy.github.io/web-port/<branch>/. */
/*  A packaged local index is merged in so the catalog still renders   */
/*  on filtered networks (GitHub API blocked / rate-limited).          */
/* ------------------------------------------------------------------ */

import { useSyncExternalStore } from "react";

export interface GameDef {
  id: string;
  title: string;
  src: string;
  tech: "WASM" | "WebGL" | "HTML5" | "EMU";
  unit: string;
  code: string;
  credits: number;
  mins: number;
  blurb: string;
  remote: boolean;
}

export const DEPARTMENTS = [
  "Interactive Media Lab",
  "Applied Physics Wing",
  "Logic & Systems Annex",
  "Retro Computing Archive",
  "Spatial Reasoning Studio",
  "Reflex & Cognition Unit",
];

function prettify(slug: string): string {
  return slug
    .replace(/[-_.]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

const BLURBS = [
  "Frame-perfect input pipeline with a sandboxed WASM runtime and zero-install launch.",
  "Ported build streamed from the web-port CDN; state persists per session tab.",
  "Deterministic simulation loop — ideal for reflex drills and timing studies.",
  "Classic engine reconstruction running entirely inside a sealed iframe context.",
  "Low-latency render path with configurable resolution scaling and aspect lock.",
  "Procedural systems demo wired into the ScribeDesk runtime configuration layer.",
];

function def(id: string, src: string, tech: GameDef["tech"], i: number, remote: boolean, title?: string): GameDef {
  return {
    id,
    title: title ?? prettify(id),
    src,
    tech,
    unit: DEPARTMENTS[i % DEPARTMENTS.length],
    code: `SIM-${String(101 + i)}`,
    credits: 1 + (i % 3),
    mins: 15 + ((i * 7) % 40),
    blurb: BLURBS[i % BLURBS.length],
    remote,
  };
}

/**
 * Packaged snapshot of genizy/web-port branches — used when both the
 * GitHub API and the jsDelivr mirror are filtered. If you fork the repo
 * (e.g. to yourname/web-port), games still resolve on this list and the
 * live fetchers can be re-pointed by editing WEBPORT_REPO below.
 */
export const WEBPORT_REPO = "genizy/web-port";
const SNAPSHOT_BRANCHES = [
  "buckshot-roulette",
  "bendy-and-the-ink-machine",
  "doom",
  "minecraft",
  "sm64",
  "gta-vc",
  "portal",
  "fnaf",
  "pokemon",
  "sonic",
];

/** Packaged fallback index — guaranteed to render offline. */
export const LOCAL_INDEX: GameDef[] = [
  ...SNAPSHOT_BRANCHES.map((slug, i) => def(slug, `https://genizy.github.io/web-port/${slug}/`, i % 2 === 0 ? "WASM" : "EMU", i, true)),
  def("2048", "https://gabrielecirulli.github.io/2048/", "HTML5", 9, false, "2048 — Tile Merge"),
  def("hextris", "https://hextris.github.io/hextris/", "HTML5", 10, false, "Hextris — Radial Stack"),
  def("clumsy-bird", "https://ellisonleao.github.io/clumsy-bird/", "WebGL", 11, false, "Clumsy Bird — Flight Drill"),
  def("react-tetris", "https://chvin.github.io/react-tetris/", "HTML5", 12, false, "Tetris — Block Lab"),
  def("floppybird", "https://nebez.github.io/floppybird/", "HTML5", 13, false, "Floppy Bird — Reflex"),
  def("javascript-snake", "https://patorjk.github.io/JavaScript-Snake/", "HTML5", 14, false, "Snake — Grid Traversal"),
  def("astray", "https://wwwtyro.github.io/Astray/", "WebGL", 15, false, "Astray — Maze Solver"),
];

type Status = "loading" | "ready" | "error";

interface Store {
  status: Status;
  list: GameDef[];
  source: string;
}

const CACHE_KEY = "sd:games:v2";
const TTL = 6 * 60 * 60 * 1000;

const store: Store = { status: "loading", list: LOCAL_INDEX, source: "packaged index" };
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function getGame(id: string | undefined): GameDef | undefined {
  return store.list.find((g) => g.id === id);
}

export function loadGames(force = false): void {
  if (store.status === "loading" && !force) return;
  store.status = "loading";
  emit();
  try {
    const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null") as { ts: number; branches: string[] } | null;
    if (cached && !force && Date.now() - cached.ts < TTL) {
      applyBranches(cached.branches, "cached web-port index");
      return;
    }
  } catch {
    /* cache unreadable — refetch */
  }

  const persist = (names: string[]) => {
    try {
      localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), branches: names }));
    } catch {
      /* quota */
    }
  };

  /* hop 1 — GitHub API */
  fetch(`https://api.github.com/repos/${WEBPORT_REPO}/branches?per_page=100`)
    .then((r) => {
      if (!r.ok) throw new Error("GitHub API " + r.status);
      return r.json() as Promise<{ name: string }[]>;
    })
    .then((branches) => {
      const names = branches.map((b) => b.name).filter((n) => n !== "main" && n !== "master");
      persist(names);
      applyBranches(names, `live tree · GitHub API (${WEBPORT_REPO})`);
    })
    /* hop 2 — jsDelivr data mirror (CORS-open, survives GitHub rate limits) */
    .catch(() => fetch(`https://data.jsdelivr.com/v1/packages/gh/${WEBPORT_REPO}`))
    .then((r) => {
      if (store.status === "ready") return undefined; // hop 1 already resolved it
      if (!r || !r.ok) throw new Error("jsDelivr mirror unreachable");
      return r.json() as Promise<{ versions?: { name: string; type?: string }[] }>;
    })
    .then((pkg) => {
      if (!pkg || store.status === "ready") return; // nothing left to do
      const names = (pkg.versions ?? []).map((v) => v.name).filter((n) => n !== "main" && n !== "master");
      if (!names.length) throw new Error("mirror returned no branches");
      persist(names);
      applyBranches(names, `live tree · jsDelivr mirror (${WEBPORT_REPO})`);
    })
    /* hop 3 — packaged snapshot */
    .catch(() => {
      store.list = LOCAL_INDEX;
      store.status = "ready";
      store.source = `snapshot index · ${SNAPSHOT_BRANCHES.length} ${WEBPORT_REPO} branches packaged`;
      emit();
    });
}

function applyBranches(names: string[], source: string) {
  const remote = names.map((n, i) =>
    def(n, `https://genizy.github.io/web-port/${n}/`, i % 3 === 2 ? "EMU" : i % 2 === 0 ? "WASM" : "WebGL", i, true)
  );
  store.list = [...remote, ...LOCAL_INDEX.filter((g) => !g.remote)];
  store.status = "ready";
  store.source = source;
  emit();
}

export function useGames(): Store {
  return useSyncExternalStore(subscribe, () => store);
}

/* ---------- per-title emulation config (persisted) ---------- */

export interface GameConfig {
  scale: number; // 50–150 (%)
  aspect: "free" | "16:9" | "4:3";
  fps: "uncapped" | "60" | "30";
  gain: number; // 0–150 (%)
  hw: boolean;
}

export const DEFAULT_CONFIG: GameConfig = { scale: 100, aspect: "free", fps: "uncapped", gain: 100, hw: true };

export function loadConfig(id: string): GameConfig {
  try {
    const raw = JSON.parse(localStorage.getItem("sd:game:" + id) || "null");
    return raw ? { ...DEFAULT_CONFIG, ...raw } : { ...DEFAULT_CONFIG };
  } catch {
    return { ...DEFAULT_CONFIG };
  }
}

export function saveConfig(id: string, cfg: GameConfig): void {
  try {
    localStorage.setItem("sd:game:" + id, JSON.stringify(cfg));
  } catch {
    /* quota */
  }
}
