import { useEffect, useRef, useState, Fragment } from "react";
import { useSettings, netPush } from "../lib/settings";
import { useGames, loadGames, loadConfig, saveConfig, DEFAULT_CONFIG } from "../lib/games";
import type { GameDef, GameConfig } from "../lib/games";
import { METHODS, urlHost } from "../lib/router";
import type { Route } from "../lib/router";
import type { ReactNode } from "react";
import { STATIC_BOOKMARKS } from "./Chrome";
import type { RecentEntry } from "./Chrome";
import {
  ISearch, IPlay, IExt, IGear, IRefresh, IBook, IHome, IGame, ICheck, IClock, IZap, ICpu, IGlobe, IBack, IHash,
} from "./Icons";

function Fav({ url, className = "w-4 h-4" }: { url: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (url.startsWith("scribe://home")) return <IHome className={className + " text-acc"} />;
  if (url.startsWith("scribe://lessons")) return <IBook className={className + " text-acc"} />;
  if (url.startsWith("scribe://play")) return <IGame className={className + " text-acc2"} />;
  if (err) return <IGlobe className={className + " text-mut"} />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(urlHost(url))}`}
      alt=""
      className={className + " rounded-[3px]"}
      onError={() => setErr(true)}
    />
  );
}

function useRevealRef<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ob = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { el.classList.add("on"); ob.disconnect(); } }),
      { threshold: 0.06 }
    );
    ob.observe(el);
    return () => ob.disconnect();
  }, []);
  return ref;
}

/* ------------------------------- home page --------------------------- */

const SCHEDULE = [
  { t: "09:15", title: "Linear Algebra — Eigen Review", room: "Rm 214", pct: 72, status: "In progress" },
  { t: "11:00", title: "Biology Lab — Cell Mitosis Sim", room: "Lab 3", pct: 100, status: "Submitted" },
  { t: "13:30", title: "World History — Primary Sources", room: "Rm 108", pct: 18, status: "Queued" },
  { t: "15:00", title: "Physics — Projectile Lab (SIM-104)", room: "Virtual", pct: 0, status: "Locked" },
];

export function HomePage({ onNavigate, recents }: { onNavigate: (u: string) => void; recents: RecentEntry[] }) {
  const { s, brand } = useSettings();
  const games = useGames();
  const [now, setNow] = useState(() => new Date());
  const [armed, setArmed] = useState(false);
  const [q, setQ] = useState("");

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    const a = requestAnimationFrame(() => setArmed(true));
    return () => { clearInterval(t); cancelAnimationFrame(a); };
  }, []);

  const hour = now.getHours();
  const greet = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Evening session";
  const engine = METHODS.find((e) => e.id === s.engine);

  const sysRow = (k: string, v: string, dot?: boolean) => (
    <div className="flex items-center justify-between h-8 px-3 border-b border-line last:border-0">
      <span className="font-mono text-[9.5px] uppercase tracking-[0.16em] text-mut">{k}</span>
      <span className="flex items-center gap-1.5 font-mono text-[11px] text-fg">
        {dot && <span className="pulse-dot" />}
        {v}
      </span>
    </div>
  );

  return (
    <div data-findroot className="h-full overflow-y-auto">
      <div className="max-w-[1080px] mx-auto px-7 py-8 grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr] gap-6 anim-fadeup">
        <div className="min-w-0">
          <p className="font-mono text-[10.5px] uppercase tracking-[0.2em] text-acc">
            {now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} · period 4
          </p>
          <h1 className="font-disp font-bold text-[30px] tracking-tight mt-2 leading-none">{greet}, Student.</h1>
          <div className="font-mono text-[54px] leading-none mt-4 tabular-nums text-fg">
            {now.toLocaleTimeString("en-GB")}
          </div>

          <form
            className="flex gap-2 mt-6"
            onSubmit={(e) => { e.preventDefault(); if (q.trim()) { onNavigate(q); setQ(""); } }}
          >
            <div className="flex-1 flex items-center gap-2.5 input !h-10 focus-within:!border-[color-mix(in_srgb,var(--acc)_55%,transparent)]">
              <ISearch className="w-4 h-4 text-mut flex-none" />
              <input
                className="flex-1 bg-transparent outline-none text-[13px] min-w-0"
                placeholder={`Route anything through ${brand.brand} — try “scribe://lessons” or “orbital mechanics”`}
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <kbd>⏎ route</kbd>
            </div>
            <button className="btn-acc !h-10" type="submit"><IPlay className="w-3.5 h-3.5" /> Route</button>
          </form>

          <p className="mt-8 mb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-mut">Quick access</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {STATIC_BOOKMARKS.slice(0, 4).map((b) => (
              <button
                key={b.url}
                onClick={() => onNavigate(b.url)}
                className="panel p-3 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-[color-mix(in_srgb,var(--acc)_45%,transparent)] group"
              >
                <span className="grid place-items-center w-8 h-8 rounded-[var(--radius)] bg-bg3 text-acc mb-2.5 transition-transform duration-200 group-hover:scale-110">
                  <Fav url={b.url} />
                </span>
                <span className="block text-[12.5px] font-semibold truncate">{b.label}</span>
                <span className="block font-mono text-[9.5px] text-mut truncate mt-0.5">{b.url}</span>
              </button>
            ))}
          </div>

          <p className="mt-8 mb-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-mut">Continue where you left off</p>
          <div className="panel overflow-hidden">
            {recents.length === 0 && (
              <p className="px-4 py-5 text-[12.5px] text-mut">
                Nothing routed yet. Open the <button className="text-acc hover:underline" onClick={() => onNavigate("scribe://lessons")}>course catalog</button> or type a URL above.
              </p>
            )}
            {recents.slice(0, 6).map((r, i) => (
              <button
                key={i}
                onClick={() => onNavigate(r.display)}
                className="w-full flex items-center gap-3 px-3.5 h-11 text-left hover:bg-bg3 transition-colors border-b border-line last:border-0"
              >
                <Fav url={r.display} className="w-4 h-4 flex-none" />
                <span className="flex-1 truncate text-[12.5px] font-medium">{r.title}</span>
                <span className="font-mono text-[10px] text-mut truncate max-w-[220px]">{r.display}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="min-w-0">
          <div className="panel overflow-hidden">
            <div className="flex items-center justify-between px-3.5 h-10 border-b border-line">
              <span className="font-disp font-semibold text-[13px]">Today’s modules</span>
              <span className="chip !cursor-default">{SCHEDULE.filter((x) => x.pct > 0).length} active</span>
            </div>
            {SCHEDULE.map((m) => (
              <div key={m.t} className="px-3.5 py-3 border-b border-line last:border-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10.5px] text-acc tabular-nums">{m.t}</span>
                  <span className="flex-1 truncate text-[12.5px] font-medium">{m.title}</span>
                  <span className={`chip !cursor-default ${m.status === "In progress" ? "on" : ""}`}>{m.status}</span>
                </div>
                <div className="flex items-center gap-2.5 mt-2">
                  <div className="flex-1 h-[5px] rounded-full bg-bg3 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ width: armed ? m.pct + "%" : "0%", background: m.pct === 100 ? "var(--acc)" : "linear-gradient(90deg,var(--acc),var(--acc2))" }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-mut w-8 text-right tabular-nums">{m.pct}%</span>
                </div>
                <p className="font-mono text-[9.5px] text-mut mt-1.5">{m.room}</p>
              </div>
            ))}
          </div>

          <div className="panel mt-4 overflow-hidden">
            <div className="flex items-center gap-2 px-3.5 h-10 border-b border-line">
              <ICpu className="w-4 h-4 text-acc" />
              <span className="font-disp font-semibold text-[13px]">Routing core</span>
            </div>
            {sysRow("engine", engine?.label ?? s.engine, true)}
            {sysRow("search", s.search === "ddg" ? "DuckDuckGo Lite" : "Wikipedia")}
            {sysRow("module index", games.status === "ready" ? games.source : games.status === "loading" ? "syncing…" : "offline — packaged", games.status === "ready")}
            {sysRow("panic key", "ESC → " + s.panicScreen)}
            {sysRow("disguise", brand.brand)}
          </div>

          <button
            onClick={() => onNavigate("scribe://lessons")}
            className="w-full mt-4 panel p-4 flex items-center gap-3.5 text-left transition-all duration-200 hover:border-[color-mix(in_srgb,var(--acc)_50%,transparent)] group"
          >
            <span className="grid place-items-center w-10 h-10 rounded-[var(--radius)] bg-acc text-bg0 transition-transform duration-200 group-hover:scale-105 group-hover:-rotate-3">
              <IGame className="w-5 h-5" />
            </span>
            <span className="flex-1">
              <span className="block font-disp font-semibold text-[14px]">{brand.catalogTitle}</span>
              <span className="block text-[11.5px] text-mut mt-0.5">
                {games.list.length} modules indexed · WASM builds stream from genizy/web-port
              </span>
            </span>
            <IPlay className="w-4 h-4 text-acc transition-transform duration-200 group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------ lessons page ------------------------- */

const TECH: Record<GameDef["tech"], string> = { WASM: "#5ad8a6", WebGL: "#6aa6ff", HTML5: "#e8b45a", EMU: "#c792ea" };

function GameCard({ g, onLaunch, density, delay }: { g: GameDef; onLaunch: (g: GameDef) => void; density: string; delay: number }) {
  const ref = useRevealRef<HTMLDivElement>();
  const c = TECH[g.tech];
  const tuned = JSON.stringify(loadConfig(g.id)) !== JSON.stringify(DEFAULT_CONFIG);

  const badge = (
    <span
      className="inline-flex items-center gap-1 h-[18px] px-1.5 rounded-[4px] font-mono text-[9px] tracking-[0.08em] border"
      style={{ color: c, borderColor: c + "55", background: c + "14" }}
    >
      <ICpu className="w-2.5 h-2.5" /> {g.tech}
    </span>
  );

  if (density === "list") {
    return (
      <div ref={ref} className="reveal flex items-center gap-3 panel px-3.5 h-[52px] hover:border-[color-mix(in_srgb,var(--acc)_40%,transparent)] transition-colors" style={{ transitionDelay: delay + "ms" }}>
        <span className="font-mono text-[10px] text-mut w-14 flex-none">{g.code}</span>
        {badge}
        <span className="flex-1 min-w-0">
          <span className="block text-[13px] font-semibold truncate">{g.title}</span>
          <span className="block font-mono text-[9.5px] text-mut truncate">{g.unit} · {g.credits} cr · ~{g.mins} min {tuned && "· tuned"}</span>
        </span>
        <button className="btn-acc !h-7 !px-3 !text-[11px]" onClick={() => onLaunch(g)}><IPlay className="w-3 h-3" /> Launch</button>
      </div>
    );
  }

  const wide = density === "wide";
  return (
    <div
      ref={ref}
      className={`reveal panel flex flex-col group transition-all duration-200 hover:-translate-y-1 hover:border-[color-mix(in_srgb,var(--acc)_45%,transparent)] hover:shadow-[0_14px_36px_rgba(0,0,0,0.4)] ${wide ? "p-5" : "p-3.5"}`}
      style={{ transitionDelay: delay + "ms" }}
    >
      <div className="flex items-center gap-1.5">
        <span className="font-mono text-[9.5px] text-mut tracking-[0.08em]">{g.code}</span>
        <span className="flex-1" />
        {badge}
      </div>
      <h3 className={`font-disp font-bold tracking-tight mt-2 leading-snug ${wide ? "text-[18px]" : "text-[14.5px]"}`}>{g.title}</h3>
      <p className="font-mono text-[9.5px] text-acc uppercase tracking-[0.14em] mt-1">{g.unit}</p>
      <p className={`text-[11.5px] text-mut leading-relaxed mt-2 ${wide ? "" : "line-clamp-2"}`}>{g.blurb}</p>
      <div className="flex-1" />
      <div className="flex items-center gap-2 mt-3.5 pt-3 border-t border-line">
        <span className="font-mono text-[9.5px] text-mut">{g.credits} cr · ~{g.mins}m</span>
        {tuned && <span className="chip !h-[17px] !px-1.5 !text-[8.5px] on !cursor-default">TUNED</span>}
        <span className="flex-1" />
        <button className={`btn-acc ${wide ? "!h-8" : "!h-7 !px-3 !text-[11px]"}`} onClick={() => onLaunch(g)}>
          <IPlay className="w-3 h-3" /> Launch
        </button>
      </div>
    </div>
  );
}

export function LessonsPage({ onLaunch }: { onLaunch: (g: GameDef) => void }) {
  const { s, brand } = useSettings();
  const store = useGames();
  const [q, setQ] = useState("");
  const [tech, setTech] = useState<"ALL" | GameDef["tech"]>("ALL");

  useEffect(() => { loadGames(); }, []);

  const list = store.list.filter(
    (g) =>
      (tech === "ALL" || g.tech === tech) &&
      (q.trim() === "" || (g.title + " " + g.unit + " " + g.code).toLowerCase().includes(q.trim().toLowerCase()))
  );

  const counts = (t: string) => (t === "ALL" ? store.list.length : store.list.filter((g) => g.tech === t).length);
  const gridCls =
    s.density === "list"
      ? "flex flex-col gap-2"
      : s.density === "wide"
        ? "grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(320px,1fr))]"
        : "grid gap-3 [grid-template-columns:repeat(auto-fill,minmax(218px,1fr))]";

  return (
    <div data-findroot className="h-full overflow-y-auto">
      <div className="max-w-[1180px] mx-auto px-7 py-7 anim-fadeup">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-acc">scribe://lessons · spring term 2026</p>
            <h1 className="font-disp font-bold text-[28px] tracking-tight leading-none mt-1.5">{brand.catalogTitle}</h1>
          </div>
          <span className="chip !cursor-default mb-1">{list.length} modules</span>
          <span className="chip !cursor-default mb-1"><span className="pulse-dot" /> {store.source}</span>
          <div className="flex-1" />
          <div className="flex items-center gap-2 input !w-[300px] !h-9">
            <ISearch className="w-3.5 h-3.5 text-mut" />
            <input className="flex-1 bg-transparent outline-none text-[12.5px] min-w-0" placeholder="Filter modules, units, codes…" value={q} onChange={(e) => setQ(e.target.value)} />
            {q && <button className="text-mut hover:text-fg" onClick={() => setQ("")}><IRefresh className="w-3 h-3" /></button>}
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-5">
          {(["ALL", "WASM", "WebGL", "HTML5", "EMU"] as const).map((t) => (
            <button key={t} className={`chip !h-[26px] ${tech === t ? "on" : ""}`} onClick={() => setTech(t)}>
              {t === "ALL" ? <IHash className="w-3 h-3" /> : <ICpu className="w-3 h-3" />}
              {t} <span className="opacity-60">{counts(t)}</span>
            </button>
          ))}
          <span className="flex-1" />
          <button className="ghost-btn !h-[26px] !text-[11px]" onClick={() => loadGames(true)}>
            <IRefresh className="w-3 h-3" /> Re-sync web-port tree
          </button>
        </div>

        {store.status === "loading" && (
          <div className={gridCls + " mt-6"}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="shimmer rounded-[var(--radius)] border border-line" style={{ height: s.density === "list" ? 52 : 176 }} />
            ))}
          </div>
        )}

        {store.status === "error" && (
          <div className="panel mt-6 p-5 flex items-center gap-4">
            <IZap className="w-5 h-5 text-acc2 flex-none" />
            <div className="flex-1">
              <p className="font-semibold text-[13.5px]">Live web-port sync failed — network filter suspected.</p>
              <p className="text-[12px] text-mut mt-0.5">Serving the packaged local index instead. Re-sync when the filter clears.</p>
            </div>
            <button className="ghost-btn" onClick={() => loadGames(true)}><IRefresh className="w-3.5 h-3.5" /> Retry sync</button>
          </div>
        )}

        {store.status !== "loading" && list.length === 0 && (
          <div className="panel mt-6 p-8 text-center">
            <p className="font-disp font-semibold text-[15px]">No modules match “{q}”.</p>
            <p className="text-[12px] text-mut mt-1">Try clearing the tech filter or the search box.</p>
          </div>
        )}

        {store.status !== "loading" && list.length > 0 && (
          <div className={gridCls + " mt-6 pb-10"}>
            {list.map((g, i) => (
              <GameCard key={g.id} g={g} onLaunch={onLaunch} density={s.density} delay={(i % 12) * 35} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- game stage -------------------------- */

export function GameStage({ game, onBack, pushToast }: { game: GameDef; onBack: () => void; pushToast: (m: string) => void }) {
  const { s } = useSettings();
  const [cfg, setCfg] = useState<GameConfig>(() => loadConfig(game.id));
  const [gear, setGear] = useState(false);
  const [flash, setFlash] = useState(false);
  const [frame, setFrame] = useState(0);
  const [heap, setHeap] = useState(41.7);

  useEffect(() => {
    const t = setInterval(() => setHeap(+(28 + Math.random() * 36).toFixed(1)), 1700);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    saveConfig(game.id, cfg);
    setFlash(true);
    const t = setTimeout(() => setFlash(false), 1100);
    return () => clearTimeout(t);
  }, [cfg, game.id]);

  const set = (patch: Partial<GameConfig>) => setCfg((c) => ({ ...c, ...patch }));

  const box =
    cfg.aspect === "free"
      ? "h-full"
      : cfg.aspect === "16:9"
        ? "aspect-video h-full max-w-full"
        : "aspect-[4/3] h-full max-w-full";

  const seg = (v: string, label: string, fn: () => void) => (
    <button className={cfg[v as "aspect"] === label || String(cfg.fps) === label ? "on" : ""} onClick={fn}>
      {label}
    </button>
  );

  return (
    <div className="h-full flex flex-col min-h-0">
      <div className="flex items-center gap-2 h-12 px-3 border-b border-line bg-bg1 flex-none">
        <button className="ghost-btn !h-8" onClick={onBack}><IBack className="w-3.5 h-3.5" /> Catalog</button>
        <span className="w-px h-5 bg-line mx-1" />
        <span className="font-disp font-bold text-[14px] tracking-tight truncate">{game.title}</span>
        <span className="font-mono text-[10px] text-mut">{game.code}</span>
        <span
          className="inline-flex items-center h-[18px] px-1.5 rounded-[4px] font-mono text-[9px] border"
          style={{ color: TECH[game.tech], borderColor: TECH[game.tech] + "55", background: TECH[game.tech] + "14" }}
        >
          {game.tech}
        </span>
        <span className="flex-1" />
        <span className="chip !cursor-default hidden sm:inline-flex">{cfg.scale}% · {cfg.aspect} · {cfg.fps === "uncapped" ? "∞fps" : cfg.fps + "fps"}</span>
        {flash && <span className="font-mono text-[9.5px] text-acc anim-pop inline-flex items-center gap-1"><ICheck className="w-3 h-3" /> persisted</span>}
        <a className="iconbtn" href={game.src} target="_blank" rel="noreferrer" title="Open raw port in new tab"><IExt className="w-4 h-4" /></a>
        <button className="iconbtn" onClick={() => { setFrame((f) => f + 1); pushToast("Module frame remounted — " + game.title); }} title="Remount frame">
          <IRefresh className="w-4 h-4" />
        </button>
        <button className={`iconbtn ${gear ? "on" : ""}`} onClick={() => setGear(!gear)} title="Emulation tuning"><IGear className="w-4 h-4" /></button>
      </div>

      <div className="flex-1 relative min-h-0 bg-bg0">
        <div className="absolute inset-0 grid place-items-center p-3">
          <div className={box} style={{ width: cfg.aspect === "free" ? cfg.scale + "%" : undefined }}>
            <iframe
              key={frame}
              src={game.src}
              title={game.title}
              className="w-full h-full border-0 rounded-[var(--radius)] bg-bg2 scanlines"
              sandbox="allow-scripts allow-same-origin allow-pointer-lock allow-popups allow-forms"
              allow="fullscreen; pointer-lock; gamepad; autoplay"
              onLoad={() => netPush({ method: "WASM", url: game.src, engine: "web-port", status: "ATTACHED", ms: Math.round(60 + Math.random() * 240) })}
            />
          </div>
        </div>

        {!cfg.hw && (
          <span className="absolute top-3 right-3 chip !cursor-default !text-acc2">HW ACCEL OFF — software raster</span>
        )}

        {gear && (
          <div
            className="absolute right-3 top-3 bottom-3 w-[292px] panel p-4 overflow-y-auto anim-pop z-20 shadow-[0_18px_50px_rgba(0,0,0,0.55)]"
            style={{ background: "color-mix(in srgb, var(--bg2) 86%, transparent)", backdropFilter: `blur(${s.blur}px)` }}
          >
            <div className="flex items-center justify-between mb-1">
              <p className="font-disp font-semibold text-[13.5px]">Emulation tuning</p>
              <button className="font-mono text-[9.5px] text-mut hover:text-fg underline" onClick={() => set({ ...DEFAULT_CONFIG })}>reset</button>
            </div>
            <p className="font-mono text-[9.5px] text-mut mb-4">Per-title config · localStorage:{game.id}</p>

            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut mb-1.5">Resolution scale — {cfg.scale}%</p>
            <input type="range" min={50} max={150} step={5} value={cfg.scale} className="w-full" onChange={(e) => set({ scale: +e.target.value })} />
            <p className="text-[10.5px] text-mut mt-1 mb-4">Container upscale; framebuffer stays native.</p>

            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut mb-1.5">Aspect lock</p>
            <div className="seg w-full [&>button]:flex-1 mb-4">
              {seg("aspect", "free", () => set({ aspect: "free" }))}
              {seg("aspect", "16:9", () => set({ aspect: "16:9" }))}
              {seg("aspect", "4:3", () => set({ aspect: "4:3" }))}
            </div>

            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut mb-1.5">Frame limiter</p>
            <div className="seg w-full [&>button]:flex-1 mb-1.5">
              {seg("fps", "uncapped", () => set({ fps: "uncapped" }))}
              {seg("fps", "60", () => set({ fps: "60" }))}
              {seg("fps", "30", () => set({ fps: "30" }))}
            </div>
            <p className="text-[10.5px] text-mut mb-4">Hint passed to the runtime scheduler.</p>

            <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut mb-1.5">Audio gain — {cfg.gain}%</p>
            <input type="range" min={0} max={150} step={5} value={cfg.gain} className="w-full" onChange={(e) => set({ gain: +e.target.value })} />

            <div className="flex items-center justify-between mt-4 mb-4">
              <span className="text-[12px] font-medium">Hardware acceleration</span>
              <button
                onClick={() => set({ hw: !cfg.hw })}
                className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${cfg.hw ? "bg-acc" : "bg-bg3"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg0 transition-all duration-200 ${cfg.hw ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            <p className="font-mono text-[9.5px] text-mut leading-relaxed">
              {cfg.hw ? "WebGL context requests discrete GPU." : "Software raster path — slower, quieter on shared labs."}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 h-9 px-3 border-t border-line bg-bg1 flex-none">
        <span className="font-mono text-[9.5px] text-mut uppercase tracking-[0.12em]">wasm heap</span>
        <div className="heapbar w-40"><i style={{ width: (heap / 256) * 100 * 2.2 + "%" }} /></div>
        <span className="font-mono text-[10px] text-mut tabular-nums">{heap.toFixed(1)} MB / 256 MB</span>
        <span className="flex-1" />
        <span className="hidden sm:block font-mono text-[9.5px] text-mut">sandbox: sealed · origin-isolated · zero-leak pool</span>
        <IClock className="w-3.5 h-3.5 text-mut" />
      </div>
    </div>
  );
}

/* ------------------------------- reader mode ------------------------- */

function inlineMd(s: string, kp: string): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\*\*[^*]+?\*\*|\*[^*\s][^*]*?\*|`[^`]+?`|\[[^\]]+?\]\([^)]+?\)|!\[[^\]]*?\]\([^)]+?\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(s))) {
    if (m.index > last) out.push(s.slice(last, m.index));
    const tok = m[0];
    const k = kp + ":" + i++;
    if (tok.startsWith("**")) out.push(<strong key={k}>{tok.slice(2, -2)}</strong>);
    else if (tok.startsWith("`")) out.push(<code key={k} className="font-mono text-[0.85em] px-1 py-0.5 rounded bg-bg3 text-acc">{tok.slice(1, -1)}</code>);
    else if (tok.startsWith("![")) {
      const src = tok.slice(tok.indexOf("(") + 1, -1);
      out.push(<img key={k} src={src} alt="" loading="lazy" className="max-w-full rounded-[var(--radius)] my-3 border border-line" />);
    } else if (tok.startsWith("[")) {
      const label = tok.slice(1, tok.indexOf("]"));
      const href = tok.slice(tok.indexOf("(") + 1, -1);
      out.push(
        <a key={k} href={href} target="_blank" rel="noreferrer noopener" className="text-acc underline underline-offset-2 decoration-[color-mix(in_srgb,var(--acc)_40%,transparent)] hover:text-acc2 transition-colors duration-150">
          {label}
        </a>
      );
    } else out.push(<em key={k}>{tok.slice(1, -1)}</em>);
    last = m.index + tok.length;
  }
  if (last < s.length) out.push(s.slice(last));
  return out;
}

function MdBlocks({ md }: { md: string }) {
  const lines = md.split("\n");
  const blocks: ReactNode[] = [];
  let code: string[] | null = null;
  let list: { ordered: boolean; items: string[] } | null = null;
  const flushList = (key: string) => {
    if (!list) return;
    const items = list.items.map((it, i) => <li key={i}>{inlineMd(it, key + ":" + i)}</li>);
    blocks.push(list.ordered ? <ol key={key} className="reader-ol">{items}</ol> : <ul key={key} className="reader-ul">{items}</ul>);
    list = null;
  };
  lines.forEach((ln, i) => {
    if (ln.trim().startsWith("```")) {
      if (code) {
        blocks.push(<pre key={"c" + i} className="reader-pre">{code.join("\n")}</pre>);
        code = null;
      } else {
        flushList("l" + i);
        code = [];
      }
      return;
    }
    if (code) { code.push(ln); return; }
    const t = ln.trim();
    if (!t) { flushList("l" + i); return; }
    if (/^#{1,6}\s/.test(t)) {
      flushList("l" + i);
      const level = (t.match(/^#+/) ?? ["#"])[0].length;
      const text = t.replace(/^#+\s*/, "");
      const Tag = level === 1 ? "h1" : level === 2 ? "h2" : "h3";
      blocks.push(<Tag key={"h" + i} className={level === 1 ? "reader-h1" : level === 2 ? "reader-h2" : "reader-h3"}>{inlineMd(text, "h" + i)}</Tag>);
      return;
    }
    if (/^>\s?/.test(t)) {
      flushList("l" + i);
      blocks.push(<blockquote key={"q" + i} className="reader-quote">{inlineMd(t.replace(/^>\s?/, ""), "q" + i)}</blockquote>);
      return;
    }
    if (/^[-*]\s+/.test(t)) {
      if (!list || list.ordered) { flushList("l" + i); list = { ordered: false, items: [] }; }
      list.items.push(t.replace(/^[-*]\s+/, ""));
      return;
    }
    if (/^\d+\.\s+/.test(t)) {
      if (!list || !list.ordered) { flushList("l" + i); list = { ordered: true, items: [] }; }
      list.items.push(t.replace(/^\d+\.\s+/, ""));
      return;
    }
    if (/^-{3,}$/.test(t)) { flushList("l" + i); blocks.push(<hr key={"r" + i} className="reader-hr" />); return; }
    flushList("l" + i);
    blocks.push(<p key={"p" + i} className="reader-p">{inlineMd(t, "p" + i)}</p>);
  });
  flushList("lend");
  const leftover = code as string[] | null;
  if (leftover && leftover.length) blocks.push(<pre key="cend" className="reader-pre">{leftover.join("\n")}</pre>);
  return <>{blocks.map((b, i) => <Fragment key={i}>{b}</Fragment>)}</>;
}

export function ReaderPage({ route, onNavigate }: { route: Route; onNavigate: (u: string) => void }) {
  if (route.error || !route.markdown) {
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-xl mx-auto px-6 py-20 anim-fadeup text-center">
          <span className="chip on !cursor-default mx-auto mb-5">READER UNREACHABLE</span>
          <h2 className="font-disp text-2xl font-bold mb-3">The extraction proxy didn’t answer</h2>
          <p className="font-mono text-[11px] text-mut mb-2">{route.display}</p>
          <p className="text-[12.5px] text-mut mb-8">{route.error ?? "empty payload"} — r.jina.ai is rate-limited or filtered on this network.</p>
          <div className="flex items-center justify-center gap-2.5 flex-wrap">
            <button className="btn-acc" onClick={() => onNavigate(route.raw)}><IRefresh className="w-3.5 h-3.5" /> Retry extraction</button>
            <a className="ghost-btn" href={`https://r.jina.ai/${route.raw}`} target="_blank" rel="noreferrer noopener"><IExt className="w-3.5 h-3.5" /> r.jina.ai mirror</a>
          </div>
        </div>
      </div>
    );
  }
  const lines = route.markdown.split("\n");
  let title = "";
  let start = 0;
  lines.forEach((l, i) => {
    if (l.startsWith("Title:")) title = l.slice(6).trim();
    if (l.startsWith("Markdown Content:")) start = i + 1;
  });
  const body = lines.slice(start).join("\n");
  return (
    <div className="flex-1 overflow-y-auto">
      <article className="max-w-[730px] mx-auto px-6 pt-10 pb-24 anim-fadeup">
        <div className="flex items-center gap-2 mb-6 flex-wrap">
          <span className="chip on !cursor-default"><IBack className="w-3 h-3 rotate-180" /> READER MODE</span>
          <span className="font-mono text-[10px] text-mut truncate max-w-[420px]">{route.display}</span>
        </div>
        {title && <h1 className="reader-h1 !mb-7">{title}</h1>}
        <MdBlocks md={body} />
        <footer className="mt-14 pt-5 border-t border-line font-mono text-[9.5px] text-mut">
          rendered via r.jina.ai · page stripped to markdown — frame bans, scripts and heavy assets never touch this workspace
        </footer>
      </article>
    </div>
  );
}
