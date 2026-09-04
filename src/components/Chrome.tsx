import { useEffect, useState } from "react";
import { useSettings, DISGUISES } from "../lib/settings";
import type { Tab, Route, MethodId } from "../lib/router";
import { cur, METHODS, methodLabel, urlHost } from "../lib/router";
import {
  IBack, IForward, IRefresh, IHome, IStar, IStarFill, IX, IPlus, IGear, IBug, IFind,
  IShield, IGlobe, ILock, IBook, IChevD, IPanel, IGame, IPen, IZap, ICheck, ITrash, IWifi, IExt, IClock,
} from "./Icons";

/* ------------------------------ bookmarks ---------------------------- */

export interface Bookmark { label: string; url: string }

export const STATIC_BOOKMARKS: Bookmark[] = [
  { label: "Workspace Home", url: "scribe://home" },
  { label: "Course Catalog", url: "scribe://lessons" },
  { label: "Wikipedia", url: "https://en.wikipedia.org/wiki/Main_Page" },
  { label: "OSM Atlas", url: "https://www.openstreetmap.org/export/embed.html?bbox=-0.135%2C51.49&layer=mapnik" },
  { label: "2048 — Tile Merge", url: "https://gabrielecirulli.github.io/2048/" },
  { label: "Hextris", url: "https://hextris.github.io/hextris/" },
];

export function loadCustomBookmarks(): Bookmark[] {
  try {
    return JSON.parse(localStorage.getItem("sd:bookmarks") || "[]") as Bookmark[];
  } catch {
    return [];
  }
}
export function saveCustomBookmarks(b: Bookmark[]): void {
  try {
    localStorage.setItem("sd:bookmarks", JSON.stringify(b));
  } catch { /* quota */ }
}

function RouteGlyph({ url, className = "w-3.5 h-3.5" }: { url: string; className?: string }) {
  if (url.startsWith("scribe://home")) return <IHome className={className} />;
  if (url.startsWith("scribe://lessons")) return <IBook className={className} />;
  if (url.startsWith("scribe://play")) return <IGame className={className} />;
  return <S2Fav url={url} className={className} />;
}

function S2Fav({ url, className = "w-3.5 h-3.5" }: { url: string; className?: string }) {
  const [err, setErr] = useState(false);
  if (err) return <IGlobe className={className} />;
  return (
    <img
      src={`https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(urlHost(url))}`}
      alt=""
      className={className + " rounded-[3px]"}
      onError={() => setErr(true)}
    />
  );
}

/* ------------------------------- top bar ----------------------------- */

interface TopBarProps {
  onNavigate: (url: string) => void;
  onOpenSettings: () => void;
  moduleTabs: Tab[];
  onSwitchTab: (id: string) => void;
  onPanic: () => void;
  pushToast: (m: string) => void;
}

export function TopBar({ onNavigate, onOpenSettings, moduleTabs, onSwitchTab, onPanic, pushToast }: TopBarProps) {
  const { s, set, brand } = useSettings();
  const [menu, setMenu] = useState<null | "mat" | "mod" | "ava">(null);
  const [clock, setClock] = useState(() => new Date());

  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const btn = (active: boolean) =>
    `h-8 px-3 rounded-[var(--radius)] text-[12.5px] font-medium transition-all duration-150 inline-flex items-center gap-1.5 ${
      active ? "bg-bg3 text-fg" : "text-mut hover:text-fg hover:bg-bg2"
    }`;

  const menuPanel = "absolute left-0 top-[calc(100%+6px)] w-72 panel p-1.5 z-50 anim-pop shadow-[0_18px_50px_rgba(0,0,0,0.5)]";
  const item = "w-full flex items-center gap-2.5 px-2.5 h-9 rounded-[calc(var(--radius)-2px)] text-left text-[12.5px] text-fg hover:bg-bg3 transition-colors cursor-pointer";

  return (
    <div className="relative z-40 flex items-center gap-1 h-12 px-3 border-b border-line"
      style={{ background: "color-mix(in srgb, var(--bg1) 85%, transparent)", backdropFilter: `blur(${s.blur}px)` }}>
      <button className="flex items-center gap-2.5 mr-2 group" onClick={() => onNavigate("scribe://home")}>
        <span className="grid place-items-center w-7 h-7 rounded-[var(--radius)] border border-line bg-bg2 text-acc transition-transform duration-200 group-hover:rotate-[-8deg] group-hover:scale-105">
          <IPen className="w-4 h-4" />
        </span>
        <span className="leading-none text-left">
          <span className="block font-disp font-bold text-[14px] tracking-tight">{brand.brand}</span>
          <span className="block font-mono text-[9px] text-mut tracking-[0.14em] uppercase mt-0.5">{brand.tag} · v2.4</span>
        </span>
      </button>

      {menu && <div className="fixed inset-0 z-30" onClick={() => setMenu(null)} />}

      <div className="relative">
        <button className={btn(menu === "mat")} onClick={() => setMenu(menu === "mat" ? null : "mat")}>
          Course Materials <IChevD className="w-3 h-3" />
        </button>
        {menu === "mat" && (
          <div className={menuPanel}>
            {[
              { l: "Course Catalog", d: "Full module index · scribe://lessons", u: "scribe://lessons", ic: <IBook className="w-4 h-4 text-acc" /> },
              { l: "Workspace Home", d: "Schedule, recents & system status", u: "scribe://home", ic: <IHome className="w-4 h-4 text-acc" /> },
              { l: "Reading List", d: "Wikipedia main portal", u: "https://en.wikipedia.org/wiki/Main_Page", ic: <IGlobe className="w-4 h-4 text-acc" /> },
              { l: "Field Atlas", d: "OpenStreetMap embed", u: "https://www.openstreetmap.org/export/embed.html?bbox=-0.135%2C51.49&layer=mapnik", ic: <IGlobe className="w-4 h-4 text-acc" /> },
            ].map((x) => (
              <button key={x.l} className={item} onClick={() => { setMenu(null); onNavigate(x.u); }}>
                {x.ic}
                <span className="flex-1">
                  <span className="block font-medium">{x.l}</span>
                  <span className="block text-[10.5px] text-mut font-mono">{x.d}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="relative">
        <button className={btn(menu === "mod")} onClick={() => setMenu(menu === "mod" ? null : "mod")}>
          Active Modules
          {moduleTabs.length > 0 && (
            <span className="grid place-items-center min-w-[16px] h-4 px-1 rounded-full bg-acc text-bg0 text-[9.5px] font-bold font-mono">
              {moduleTabs.length}
            </span>
          )}
          <IChevD className="w-3 h-3" />
        </button>
        {menu === "mod" && (
          <div className={menuPanel}>
            {moduleTabs.length === 0 ? (
              <div className="p-3 text-center">
                <p className="text-[12px] text-mut mb-2.5">No simulation modules are attached to tabs.</p>
                <button className="ghost-btn mx-auto" onClick={() => { setMenu(null); onNavigate("scribe://lessons"); }}>
                  <IGame className="w-3.5 h-3.5" /> Open catalog
                </button>
              </div>
            ) : (
              moduleTabs.map((t) => (
                <button key={t.id} className={item} onClick={() => { setMenu(null); onSwitchTab(t.id); }}>
                  <span className="pulse-dot" />
                  <span className="flex-1 min-w-0">
                    <span className="block font-medium truncate">{cur(t).title}</span>
                    <span className="block text-[10px] text-mut font-mono truncate">{cur(t).display}</span>
                  </span>
                  <span className="chip !cursor-default">LIVE</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <button className={btn(false)} onClick={onOpenSettings}>Settings</button>

      <div className="flex-1" />

      <span className="hidden md:inline-flex chip !cursor-default mr-1"><IWifi className="w-3 h-3" /> RELAY OK</span>
      <span className="hidden lg:inline-flex items-center gap-1.5 mr-1 font-mono text-[11px] text-mut">
        <IClock className="w-3.5 h-3.5" />
        {clock.toLocaleTimeString("en-GB")}
      </span>
      <button className="iconbtn" title="Announcements" onClick={() => pushToast("No new announcements from the front office.")}>
        <span className="relative">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" />
          </svg>
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-acc2" />
        </span>
      </button>

      <div className="relative">
        <button className="flex items-center gap-2 ml-1 h-8 pl-1 pr-2 rounded-[var(--radius)] hover:bg-bg2 transition-colors" onClick={() => setMenu(menu === "ava" ? null : "ava")}>
          <span className="grid place-items-center w-6.5 h-6.5 min-w-[26px] min-h-[26px] rounded-full bg-acc text-bg0 text-[10.5px] font-bold">ST</span>
          <IChevD className="w-3 h-3 text-mut" />
        </button>
        {menu === "ava" && (
          <div className="absolute right-0 top-[calc(100%+6px)] w-80 panel p-1.5 z-50 anim-pop shadow-[0_18px_50px_rgba(0,0,0,0.5)]">
            <div className="flex items-center gap-3 p-2.5 mb-1 border-b border-line">
              <span className="relative grid place-items-center w-10 h-10 rounded-full bg-acc text-bg0 font-bold font-disp">
                ST
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-acc border-2 border-bg2" />
              </span>
              <div className="flex-1 leading-tight">
                <p className="font-semibold text-[13px]">Student, Alex</p>
                <p className="font-mono text-[10.5px] text-mut">Period 4 · Room 214 · ID 88412</p>
              </div>
            </div>
            <p className="px-2.5 pt-1.5 pb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-mut">Disguise profiles</p>
            {DISGUISES.map((d) => (
              <button key={d.id} className={item} onClick={() => { set({ ...d.patch, disguise: d.id }); pushToast(d.id === "none" ? "ScribeDesk identity restored." : `Disguise engaged — ${d.brand}.`); }}>
                <span className="w-4 grid place-items-center">{s.disguise === d.id ? <ICheck className="w-3.5 h-3.5 text-acc" /> : <span className="w-1.5 h-1.5 rounded-full bg-bg3" />}</span>
                <span className="flex-1">
                  <span className="block font-medium">{d.brand} <span className="text-mut font-normal">· {d.tag}</span></span>
                  <span className="block text-[10.5px] text-mut">{d.desc}</span>
                </span>
              </button>
            ))}
            <div className="flex gap-1.5 p-2 mt-1 border-t border-line">
              <button className="ghost-btn flex-1 !justify-center" onClick={() => { setMenu(null); onPanic(); }}>
                <IZap className="w-3.5 h-3.5 text-acc2" /> Panic now
              </button>
              <button className="ghost-btn flex-1 !justify-center" onClick={() => { localStorage.clear(); location.reload(); }}>
                <ITrash className="w-3.5 h-3.5" /> Wipe local data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------- sidebar ----------------------------- */

export interface RecentEntry { display: string; title: string }

interface SidebarProps {
  onNavigate: (url: string) => void;
  recents: RecentEntry[];
  current: string;
  pushToast: (m: string) => void;
}

export function Sidebar({ onNavigate, recents, current, pushToast }: SidebarProps) {
  const { s, set, brand } = useSettings();
  const collapsed = !s.sidebar;
  const row = (active: boolean) =>
    `w-full flex items-center gap-2.5 h-9 rounded-[var(--radius)] text-[12.5px] font-medium transition-all duration-150 cursor-pointer ${
      collapsed ? "justify-center px-0" : "px-2.5"
    } ${active ? "bg-bg3 text-fg" : "text-mut hover:text-fg hover:bg-bg2"}`;

  return (
    <aside
      className="flex flex-col border-r border-line bg-bg1 transition-[width] duration-300 ease-out overflow-hidden flex-none"
      style={{ width: collapsed ? 54 : 226 }}
    >
      <nav className="flex flex-col gap-0.5 p-2">
        <button className={row(current === "scribe://home")} title="Workspace Home" onClick={() => onNavigate("scribe://home")}>
          <IHome className="w-4 h-4 flex-none" />
          {!collapsed && <span>Home</span>}
        </button>
        <button className={row(current === "scribe://lessons")} title={brand.catalogTitle} onClick={() => onNavigate("scribe://lessons")}>
          <IBook className="w-4 h-4 flex-none" />
          {!collapsed && <span>{brand.lessonsLabel}</span>}
          {!collapsed && <span className="ml-auto pulse-dot" />}
        </button>
      </nav>

      {!collapsed && (
        <div className="flex-1 overflow-y-auto px-2 pb-2 min-h-0">
          <p className="px-2.5 pt-3 pb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-mut">Recent</p>
          {recents.length === 0 && <p className="px-2.5 text-[11.5px] text-mut italic">Nothing routed yet this session.</p>}
          {recents.slice(0, 7).map((r, i) => (
            <button key={i} className={row(false)} title={r.display} onClick={() => onNavigate(r.display)}>
              <RouteGlyph url={r.display} className="w-3.5 h-3.5 flex-none" />
              <span className="truncate">{r.title}</span>
            </button>
          ))}
          <p className="px-2.5 pt-4 pb-1 font-mono text-[9.5px] uppercase tracking-[0.16em] text-mut">Pinned</p>
          {STATIC_BOOKMARKS.slice(2, 5).map((b) => (
            <button key={b.url} className={row(false)} title={b.url} onClick={() => onNavigate(b.url)}>
              <RouteGlyph url={b.url} className="w-3.5 h-3.5 flex-none" />
              <span className="truncate">{b.label}</span>
            </button>
          ))}
        </div>
      )}
      {collapsed && <div className="flex-1" />}

      <div className="p-2 border-t border-line">
        <button className={row(false)} onClick={() => { set({ sidebar: !s.sidebar }); pushToast(s.sidebar ? "Rail collapsed." : "Rail expanded."); }} title="Toggle rail">
          <IPanel className="w-4 h-4 flex-none" />
          {!collapsed && <span className="font-mono text-[10.5px]">Collapse rail</span>}
        </button>
      </div>
    </aside>
  );
}

/* ------------------------------ tab strip ---------------------------- */

interface TabStripProps {
  tabs: Tab[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
}

function TabFav({ route }: { route: Route }) {
  if (route.kind === "home") return <IHome className="w-3.5 h-3.5 text-acc" />;
  if (route.kind === "lessons") return <IBook className="w-3.5 h-3.5 text-acc" />;
  if (route.kind === "game") return <IGame className="w-3.5 h-3.5 text-acc2" />;
  return <S2Fav url={route.display} />;
}

export function TabStrip({ tabs, activeId, onSelect, onClose, onNew }: TabStripProps) {
  return (
    <div className="flex items-end gap-1 px-2 pt-1.5 bg-bg0 border-b border-line overflow-x-auto flex-none" style={{ scrollbarWidth: "none" }}>
      {tabs.map((t) => {
        const r = cur(t);
        const active = t.id === activeId;
        return (
          <div
            key={t.id}
            onClick={() => onSelect(t.id)}
            onMouseUp={(e) => { if (e.button === 1) { e.preventDefault(); onClose(t.id); } }}
            className={`group relative flex items-center gap-2 min-w-[128px] max-w-[196px] flex-1 h-[34px] px-2.5 rounded-t-[var(--radius)] cursor-pointer select-none transition-colors duration-150 ${
              active ? "bg-bg1 text-fg" : "text-mut hover:bg-bg1/60 hover:text-fg"
            }`}
            title={r.display}
          >
            {active && <span className="absolute inset-x-2 top-0 h-[2px] rounded-b bg-acc" />}
            {t.loading ? <IRefresh className="w-3.5 h-3.5 flex-none spin text-acc" /> : <span className="flex-none"><TabFav route={r} /></span>}
            <span className="flex-1 truncate text-[12px] font-medium">{r.title || "Loading…"}</span>
            <button
              className="iconbtn !w-5 !h-5 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={(e) => { e.stopPropagation(); onClose(t.id); }}
              title="Close tab"
            >
              <IX className="w-3 h-3" />
            </button>
          </div>
        );
      })}
      <button className="iconbtn !w-7 !h-7 mb-[3px] ml-0.5 flex-none" onClick={onNew} title="New tab (Ctrl+T)">
        <IPlus className="w-4 h-4" />
      </button>
    </div>
  );
}

/* ------------------------------- toolbar ----------------------------- */

interface ToolbarProps {
  route: Route;
  canBack: boolean;
  canFwd: boolean;
  loading: boolean;
  engine: MethodId;
  bookmarked: boolean;
  findOpen: boolean;
  devOpen: boolean;
  inputRef: React.RefObject<HTMLInputElement>;
  input: string;
  setInput: (v: string) => void;
  onSubmit: () => void;
  onBack: () => void;
  onFwd: () => void;
  onRefresh: () => void;
  onHome: () => void;
  onToggleBookmark: () => void;
  onFind: () => void;
  onDev: () => void;
  onPanic: () => void;
  onSettings: () => void;
  onMethod: (m: MethodId) => void;
}

export function Toolbar(p: ToolbarProps) {
  const [mmOpen, setMmOpen] = useState(false);
  const r = p.route;
  const left =
    r.kind === "web" && r.display.startsWith("https://") ? <ILock className="w-3.5 h-3.5 text-acc" />
    : r.kind === "web" ? <IGlobe className="w-3.5 h-3.5 text-acc2" />
    : <IShield className="w-3.5 h-3.5 text-acc" />;

  return (
    <div className="flex items-center gap-1.5 h-[52px] px-2.5 border-b border-line bg-bg1 flex-none">
      <button className="iconbtn" onClick={p.onBack} disabled={!p.canBack} title="Back"><IBack className="w-[17px] h-[17px]" /></button>
      <button className="iconbtn" onClick={p.onFwd} disabled={!p.canFwd} title="Forward"><IForward className="w-[17px] h-[17px]" /></button>
      <button className="iconbtn" onClick={p.onRefresh} title="Reload frame (Ctrl+R)">
        <IRefresh className={`w-[15px] h-[15px] ${p.loading ? "spin text-acc" : ""}`} />
      </button>
      <button className="iconbtn" onClick={p.onHome} title="Workspace home"><IHome className="w-[16px] h-[16px]" /></button>

      <div
        className="flex-1 flex items-center gap-2 h-9 px-3 rounded-[calc(var(--radius)+4px)] bg-bg0 border border-line transition-all duration-200 focus-within:border-[color-mix(in_srgb,var(--acc)_55%,transparent)] focus-within:shadow-[0_0_0_3px_color-mix(in_srgb,var(--acc)_14%,transparent)] min-w-0"
      >
        {left}
        <input
          ref={p.inputRef}
          className="flex-1 bg-transparent outline-none font-mono text-[12px] text-fg placeholder:text-mut/60 min-w-0"
          value={p.input}
          spellCheck={false}
          placeholder="Search or route a URL — scribe://lessons, wikipedia.org, “tensor calculus”…"
          onChange={(e) => p.setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") p.onSubmit(); }}
          onFocus={(e) => e.target.select()}
        />
        <div className="relative hidden sm:block flex-none">
          <button
            className={`chip ${mmOpen ? "on" : ""}`}
            onClick={() => setMmOpen(!mmOpen)}
            title={METHODS.find((x) => x.id === p.engine)?.desc ?? "Transport method"}
          >
            {methodLabel(p.engine)}
            <IChevD className={`w-3 h-3 transition-transform duration-200 ${mmOpen ? "rotate-180" : ""}`} />
          </button>
          {mmOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setMmOpen(false)} />
              <div className="absolute right-0 top-8 w-[330px] panel p-1.5 z-50 anim-pop shadow-[0_20px_55px_rgba(0,0,0,0.55)] max-h-[64vh] overflow-y-auto" style={{ backdropFilter: "blur(var(--blur))" }}>
                <p className="px-2 pt-1.5 pb-1 font-mono text-[9px] uppercase tracking-[0.18em] text-acc">anti-embed bypass · {METHODS.length} transports</p>
                {(["smart", "direct", "relay", "mirror"] as const).map((g) => (
                  <div key={g}>
                    <p className="px-2 pt-2 pb-1 font-mono text-[8.5px] uppercase tracking-[0.16em] text-mut">
                      {g === "smart" ? "smart bypass" : g === "direct" ? "direct transports" : g === "relay" ? "cors relays · xfo-immune" : "mirror snapshots"}
                    </p>
                    {METHODS.filter((m) => m.group === g).map((m) => (
                      <button
                        key={m.id}
                        className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-[var(--radius)] hover:bg-bg3 text-left transition-colors duration-100"
                        onClick={() => { p.onMethod(m.id); setMmOpen(false); }}
                      >
                        <span className="font-mono text-[9px] text-acc w-[46px] flex-none">{m.short}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[12px] font-medium leading-tight">{m.label}</span>
                          <span className="block text-[9.5px] text-mut leading-snug mt-0.5">{m.desc}</span>
                        </span>
                        {m.id === p.engine && <ICheck className="w-3.5 h-3.5 text-acc flex-none" />}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <button className="iconbtn !w-7 !h-7" onClick={p.onToggleBookmark} title={p.bookmarked ? "Remove bookmark" : "Pin bookmark"}>
          {p.bookmarked ? <IStarFill className="w-4 h-4 text-acc2" /> : <IStar className="w-4 h-4" />}
        </button>
      </div>

      <button className={`iconbtn ${p.findOpen ? "on" : ""}`} onClick={p.onFind} title="Find in page (Ctrl+F)"><IFind className="w-[17px] h-[17px]" /></button>
      <button className={`iconbtn ${p.devOpen ? "on" : ""}`} onClick={p.onDev} title="Scribe inspector"><IBug className="w-[17px] h-[17px]" /></button>
      <button className="iconbtn" onClick={p.onPanic} title="Panic switch (Esc) — instant disguise"><IZap className="w-[17px] h-[17px] text-acc2" /></button>
      <button className="iconbtn" onClick={p.onSettings} title="Workspace settings"><IGear className="w-[17px] h-[17px]" /></button>
    </div>
  );
}

/* ---------------------------- bookmark bar --------------------------- */

export function BookmarkBar({ bookmarks, onNavigate }: { bookmarks: Bookmark[]; onNavigate: (u: string) => void }) {
  return (
    <div className="flex items-center gap-1 h-9 px-2.5 border-b border-line bg-bg1/70 overflow-x-auto flex-none" style={{ scrollbarWidth: "none" }}>
      {bookmarks.map((b) => (
        <button key={b.url} className="chip !h-[26px] !text-[11px] !font-body" onClick={() => onNavigate(b.url)} title={b.url}>
          <RouteGlyph url={b.url} className="w-3.5 h-3.5" />
          {b.label}
        </button>
      ))}
      <span className="ml-auto hidden md:block font-mono text-[9.5px] text-mut tracking-[0.14em] uppercase flex-none">
        {bookmarks.length} pinned
      </span>
    </div>
  );
}

/* ----------------------------- status strip -------------------------- */

export function StatusStrip({ route, tabCount }: { route: Route; tabCount: number }) {
  return (
    <div className="flex items-center gap-3 h-[26px] px-3 border-t border-line bg-bg1 text-mut flex-none overflow-hidden">
      <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.14em] flex-none">
        <span className="pulse-dot" /> routed · {route.via}
      </span>
      <span className="flex-1 truncate font-mono text-[10.5px] text-mut/80 text-center">
        {route.note && <span className="text-acc2">{route.note} · </span>}
        {route.display}
      </span>
      <span className="hidden md:flex items-center gap-1.5 flex-none text-[10px] font-mono">
        <kbd>ESC</kbd> panic
      </span>
      <span className="hidden lg:flex items-center gap-1.5 flex-none text-[10px] font-mono">
        <kbd>⌃F</kbd> find
      </span>
      <span className="chip !h-[18px] !px-2 !text-[9px] !cursor-default flex-none">{tabCount} tabs</span>
      <IExt className="w-3 h-3 flex-none opacity-40" />
    </div>
  );
}


