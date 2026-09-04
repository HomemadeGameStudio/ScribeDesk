/* ------------------------------------------------------------------ */
/*  ScribeDesk virtual router — parses the omnibox, resolves internal  */
/*  scribe:// schemes and routes external traffic through the          */
/*  configured proxy engine (mirrors the Ultraviolet gateway model:    */
/*  gateway prefix + encoded transport).                               */
/* ------------------------------------------------------------------ */

export type EngineId = "direct" | "gateway" | "relay" | "wayback";
export type SearchId = "wikipedia" | "ddg";
export type RouteKind = "home" | "lessons" | "game" | "web";

export interface Route {
  kind: RouteKind;
  display: string; // what the omnibox shows
  title: string;
  src: string | null; // iframe src for web routes
  srcdoc: string | null; // rendered payload for relay routes
  via: string; // engine label for the status strip / netlog
  gameId?: string;
  error?: string;
}

export interface Tab {
  id: string;
  entries: Route[];
  idx: number;
  loading: boolean;
  reload: number; // bump to force-remount the frame
}

export const ENGINES: { id: EngineId; label: string; desc: string }[] = [
  { id: "direct", label: "Direct", desc: "No rewrite — load the origin as-is. Fastest; some origins refuse framing." },
  { id: "gateway", label: "UV Gateway", desc: "Ultraviolet-style prefix gateway. Point it at your own /service/ deployment." },
  { id: "relay", label: "Scribe Relay", desc: "CORS relay — fetches the payload and renders it inside a sealed srcdoc frame." },
  { id: "wayback", label: "Wayback", desc: "Route through the Internet Archive snapshot mirror (web.archive.org/2id_)." },
];

export const SEARCHES: { id: SearchId; label: string }[] = [
  { id: "wikipedia", label: "Wikipedia (frame-safe)" },
  { id: "ddg", label: "DuckDuckGo Lite" },
];

const URL_RE = /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#]\S*)?$/i;

export function urlHost(u: string): string {
  try {
    return new URL(u).host;
  } catch {
    return u;
  }
}

export function internalRoute(kind: RouteKind, gameId?: string): Route {
  const display =
    kind === "home" ? "scribe://home" : kind === "lessons" ? "scribe://lessons" : `scribe://play/${gameId ?? ""}`;
  return {
    kind,
    display,
    title: kind === "home" ? "Workspace Home" : kind === "lessons" ? "Course Catalog" : "Module Session",
    src: null,
    srcdoc: null,
    via: "internal",
    gameId,
  };
}

/** Omnibox parsing: internal scheme → scribe://, bare domain → https://, anything else → search. */
export function parseOmnibox(raw: string, search: SearchId): string {
  const input = raw.trim();
  if (!input) return "scribe://home";
  if (/^scribe:\/\//i.test(input)) return input.replace(/\s+/g, "").toLowerCase();
  if (/^https?:\/\//i.test(input)) return input;
  if (URL_RE.test(input)) return "https://" + input;
  const q = encodeURIComponent(input);
  return search === "ddg" ? `https://lite.duckduckgo.com/lite/?q=${q}` : `https://en.wikipedia.org/w/index.php?search=${q}`;
}

function searchTitle(raw: string, search: SearchId): string {
  const input = raw.trim();
  if (URL_RE.test(input) || /^https?:\/\//i.test(input)) return urlHost(input.startsWith("http") ? input : "https://" + input);
  return `${input} — ${search === "ddg" ? "DuckDuckGo" : "Wikipedia search"}`;
}

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("Relay timed out after " + ms / 1000 + "s")), ms);
    p.then((v) => {
      clearTimeout(t);
      res(v);
    }, rej);
  });
}

/** Resolve an omnibox string into a fully-routed Route for the active engine. */
export async function resolveRoute(
  raw: string,
  engine: EngineId,
  gateway: string,
  search: SearchId,
  gameTitle?: (id: string) => string
): Promise<Route> {
  const target = parseOmnibox(raw, search);

  if (target.startsWith("scribe://")) {
    const path = target.slice(9).replace(/^\/+/, "");
    if (path === "play" || path.startsWith("play/")) {
      const id = path.split("/")[1] ?? "";
      const r = internalRoute("game", id);
      r.title = gameTitle ? gameTitle(id) : id;
      return r;
    }
    if (path === "lessons") return internalRoute("lessons");
    return internalRoute("home");
  }

  const title = searchTitle(raw, search);
  const base: Route = { kind: "web", display: target, title, src: null, srcdoc: null, via: "Direct" };

  if (engine === "gateway") {
    const g = (gateway || "https://").trim().replace(/\/+$/, "");
    base.src = `${g}/${target}`;
    base.via = "UV Gateway";
    return base;
  }

  if (engine === "wayback") {
    base.src = `https://web.archive.org/web/2id_/${target}`;
    base.via = "Wayback 2id_";
    return base;
  }

  if (engine === "relay") {
    base.via = "Scribe Relay";
    try {
      const res = await timeout(
        fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(target)}`),
        9000
      );
      if (!res.ok) throw new Error("Relay responded " + res.status);
      const html = await res.text();
      base.srcdoc = html.replace(
        /<head([^>]*)>/i,
        `<head$1><base href="${target}"><style>img,video{max-width:100%}</style>`
      );
    } catch (e) {
      base.error = e instanceof Error ? e.message : "Relay failed";
    }
    return base;
  }

  base.src = target;
  return base;
}

export function cur(tab: Tab): Route {
  return tab.entries[tab.idx];
}

let seq = 0;
export function makeTab(route: Route): Tab {
  seq += 1;
  return { id: "t" + seq + "-" + Math.random().toString(36).slice(2, 7), entries: [route], idx: 0, loading: false, reload: 0 };
}
