/* ------------------------------------------------------------------ */
/*  ScribeDesk transport layer.                                        */
/*  12 selectable bypass methods + an Auto engine that races the CORS  */
/*  relays and renders the first live payload into a sealed srcdoc     */
/*  frame — where X-Frame-Options / CSP frame-ancestors never apply.   */
/* ------------------------------------------------------------------ */

import { netPush } from "./settings";

export type MethodId =
  | "auto" | "direct" | "gateway"
  | "relayA" | "relayB" | "relayC" | "relayD" | "relayE"
  | "translate" | "wb2if" | "wb2id" | "reader";

export type SearchId = "wikipedia" | "ddg";
export type RouteKind = "home" | "lessons" | "game" | "web" | "reader";

export interface Route {
  kind: RouteKind;
  raw: string; // original omnibox input — used to re-route through other methods
  display: string;
  title: string;
  src: string | null;
  srcdoc: string | null;
  sealed: boolean; // render in an origin-opaque sandboxed frame
  via: string;
  note?: string;
  markdown?: string;
  gameId?: string;
  error?: string;
}

export interface Tab {
  id: string;
  entries: Route[];
  idx: number;
  loading: boolean;
  reload: number;
}

export const METHODS: {
  id: MethodId;
  label: string;
  short: string;
  group: "smart" | "direct" | "relay" | "mirror";
  desc: string;
}[] = [
  { id: "auto", label: "Auto Bypass", short: "AUTO", group: "smart", desc: "Races all relays in parallel; first live payload wins. Falls back to direct embed." },
  { id: "reader", label: "Reader Mode", short: "READ", group: "smart", desc: "r.jina.ai strips the page to clean text/markdown. Beats even total frame bans." },
  { id: "direct", label: "Direct Embed", short: "DIRECT", group: "direct", desc: "No rewrite — load the origin as-is. Full JS, but frame-hostile sites will render blank." },
  { id: "gateway", label: "UV Gateway", short: "UV", group: "direct", desc: "Ultraviolet-style prefix gateway. Point it at your own /service/ deployment." },
  { id: "relayA", label: "Relay α · allorigins/raw", short: "RLY·α", group: "relay", desc: "CORS relay, raw body. Rendered in a sealed srcdoc frame — immune to XFO." },
  { id: "relayB", label: "Relay β · allorigins/json", short: "RLY·β", group: "relay", desc: "Second allorigins endpoint (JSON envelope). Survives endpoint-level blocks." },
  { id: "relayC", label: "Relay γ · corsproxy.io", short: "RLY·γ", group: "relay", desc: "corsproxy.io transport. Independent infrastructure from the α/β relays." },
  { id: "relayD", label: "Relay δ · codetabs", short: "RLY·δ", group: "relay", desc: "api.codetabs.com proxy hop. Often up when the others are filtered." },
  { id: "relayE", label: "Relay ε · thingproxy", short: "RLY·ε", group: "relay", desc: "thingproxy.freeboard.io — the classic fetch-forwarder." },
  { id: "translate", label: "Translate Proxy", short: "GTR", group: "mirror", desc: "Routes through Google Translate's page proxy, which strips frame headers." },
  { id: "wb2if", label: "Wayback 2if_", short: "WB·if", group: "mirror", desc: "Archive snapshot served with the iframe-safe 2if_ flag." },
  { id: "wb2id", label: "Wayback 2id_", short: "WB·id", group: "mirror", desc: "Archive snapshot, identity (2id_) flag — fewer rewrites than the web view." },
];

export const SEARCHES: { id: SearchId; label: string }[] = [
  { id: "wikipedia", label: "Wikipedia (frame-safe)" },
  { id: "ddg", label: "DuckDuckGo Lite" },
];

const URL_RE = /^[\w-]+(\.[\w-]+)+(:\d+)?([/?#]\S*)?$/i;
const enc = encodeURIComponent;

export function methodLabel(id: MethodId): string {
  return METHODS.find((m) => m.id === id)?.short ?? id.toUpperCase();
}

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
    kind, raw: display, display,
    title: kind === "home" ? "Workspace Home" : kind === "lessons" ? "Course Catalog" : "Module Session",
    src: null, srcdoc: null, sealed: false, via: "internal", gameId,
  };
}

export function parseOmnibox(raw: string, search: SearchId): string {
  const input = raw.trim();
  if (!input) return "scribe://home";
  if (/^scribe:\/\//i.test(input)) return input.replace(/\s+/g, "").toLowerCase();
  if (/^https?:\/\//i.test(input)) return input;
  if (URL_RE.test(input)) return "https://" + input;
  const q = enc(input);
  return search === "ddg" ? `https://lite.duckduckgo.com/lite/?q=${q}` : `https://en.wikipedia.org/w/index.php?search=${q}`;
}

function searchTitle(raw: string, search: SearchId): string {
  const input = raw.trim();
  if (URL_RE.test(input) || /^https?:\/\//i.test(input)) return urlHost(input.startsWith("http") ? input : "https://" + input);
  return `${input} — ${search === "ddg" ? "DuckDuckGo" : "Wikipedia search"}`;
}

function timeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error("timed out after " + ms / 1000 + "s")), ms);
    p.then((v) => { clearTimeout(t); res(v); }, (e) => { clearTimeout(t); rej(e); });
  });
}

/* ------------------------------ relays ------------------------------- */

function looksLikeHtml(s: string): boolean {
  return s.length > 120 && /<[a-z!]/i.test(s);
}

function stamp(url: string, html: string): string {
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1><base href="${url}"><style>img,video{max-width:100%}</style>`);
  }
  return `<base href="${url}">` + html;
}

interface Relay {
  id: MethodId;
  label: string;
  fetch: (u: string) => Promise<string>;
}

const RELAYS: Relay[] = [
  {
    id: "relayA", label: "Relay α",
    fetch: async (u) => (await fetch(`https://api.allorigins.win/raw?url=${enc(u)}`)).text(),
  },
  {
    id: "relayB", label: "Relay β",
    fetch: async (u) => {
      const r = await fetch(`https://api.allorigins.win/get?url=${enc(u)}`);
      const j = (await r.json()) as { contents?: string };
      if (!j.contents) throw new Error("empty envelope");
      return j.contents;
    },
  },
  {
    id: "relayC", label: "Relay γ",
    fetch: async (u) => (await fetch(`https://corsproxy.io/?url=${enc(u)}`)).text(),
  },
  {
    id: "relayD", label: "Relay δ",
    fetch: async (u) => (await fetch(`https://api.codetabs.com/v1/proxy?quest=${u}`)).text(),
  },
  {
    id: "relayE", label: "Relay ε",
    fetch: async (u) => (await fetch(`https://thingproxy.freeboard.io/fetch/${u}`)).text(),
  },
];

/** Race every relay; resolve with the first payload that looks like HTML. */
async function raceRelays(url: string): Promise<{ engine: MethodId; label: string; html: string } | null> {
  return new Promise((resolve) => {
    let pending = RELAYS.length;
    let done = false;
    RELAYS.forEach((r) => {
      const t0 = performance.now();
      timeout(r.fetch(url), 8000)
        .then((html) => {
          const ms = Math.round(performance.now() - t0);
          if (!looksLikeHtml(html)) throw new Error("non-HTML payload");
          netPush({ method: "GET", url, ms, status: "200", engine: r.label });
          if (!done) { done = true; resolve({ engine: r.id, label: r.label, html }); }
        })
        .catch(() => {
          netPush({ method: "GET", url, ms: Math.round(performance.now() - t0), status: "FAILED", engine: r.label });
          if (--pending === 0 && !done) { done = true; resolve(null); }
        });
    });
  });
}

/* ------------------------------ resolver ----------------------------- */

function webRoute(url: string, title: string, src: string, via: string, note?: string): Route {
  return { kind: "web", raw: url, display: url, title, src, srcdoc: null, sealed: false, via, note };
}

export async function resolveRoute(
  raw: string,
  method: MethodId,
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

  switch (method) {
    case "gateway": {
      const g = (gateway || "https://").trim().replace(/\/+$/, "");
      return webRoute(target, title, `${g}/${target}`, "UV Gateway");
    }
    case "direct":
      return webRoute(target, title, target, "Direct");
    case "translate":
      return webRoute(
        target, title,
        `https://translate.google.com/translate?sl=auto&tl=en&u=${enc(target)}`,
        "Translate proxy",
        "Google's proxy strips frame headers — UI chrome belongs to Translate."
      );
    case "wb2if":
      return webRoute(target, title, `https://web.archive.org/web/2if_/${target}`, "Wayback 2if_");
    case "wb2id":
      return webRoute(target, title, `https://web.archive.org/web/2id_/${target}`, "Wayback 2id_");
    case "reader": {
      const r: Route = {
        kind: "reader", raw: target, display: target, title: title + " — Reader",
        src: null, srcdoc: null, sealed: true, via: "Reader · r.jina.ai",
        markdown: undefined, error: undefined,
      };
      try {
        const res = await timeout(fetch(`https://r.jina.ai/${target}`), 12000);
        if (!res.ok) throw new Error("reader responded " + res.status);
        r.markdown = await res.text();
      } catch (e) {
        r.error = e instanceof Error ? e.message : "reader failed";
      }
      return r;
    }
    case "relayA": case "relayB": case "relayC": case "relayD": case "relayE": {
      const relay = RELAYS.find((x) => x.id === method)!;
      const t0 = performance.now();
      const r: Route = {
        kind: "web", raw: target, display: target, title,
        src: null, srcdoc: null, sealed: true, via: relay.label,
      };
      try {
        const html = await timeout(relay.fetch(target), 10000);
        if (!looksLikeHtml(html)) throw new Error("non-HTML payload");
        netPush({ method: "GET", url: target, ms: Math.round(performance.now() - t0), status: "200", engine: relay.label });
        r.srcdoc = stamp(target, html);
      } catch (e) {
        netPush({ method: "GET", url: target, ms: Math.round(performance.now() - t0), status: "FAILED", engine: relay.label });
        r.error = e instanceof Error ? e.message : "relay failed";
      }
      return r;
    }
    case "auto":
    default: {
      const won = await raceRelays(target);
      if (won) {
        return {
          kind: "web", raw: target, display: target, title,
          src: null, srcdoc: stamp(target, won.html), sealed: true,
          via: "Auto · " + won.label,
          note: "frame ban neutralized — payload sealed in an opaque sandbox",
        };
      }
      return webRoute(
        target, title, target, "Auto · direct",
        "all relay probes failed — fell back to direct embed; switch transports if the page is blank"
      );
    }
  }
}

export function cur(tab: Tab): Route {
  return tab.entries[tab.idx];
}

let seq = 0;
export function makeTab(route: Route): Tab {
  seq += 1;
  return { id: "t" + seq + "-" + Math.random().toString(36).slice(2, 7), entries: [route], idx: 0, loading: false, reload: 0 };
}
