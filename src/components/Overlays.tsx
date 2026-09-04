import { useState } from "react";
import {
  useSettings, DISGUISES, THEMES, FONTS, DEFAULT_SETTINGS,
  useNetLog, useConsoleLog, clearLogs, conPush,
} from "../lib/settings";
import type { FontId, DensityId, PanicKind } from "../lib/settings";
import { ENGINES, SEARCHES } from "../lib/router";
import type { EngineId } from "../lib/router";
import {
  IX, ICheck, IPalette, IType, IGrid, IList, IWide, ITrash, ITerm, IBack, IForward, IRefresh, IEyeOff, IGlobe, IEye, IZap,
} from "./Icons";

/* ---------------------------- settings drawer ------------------------ */

function SectionHead({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div className="flex items-center gap-2.5 mt-7 mb-3 first:mt-0">
      <span className="grid place-items-center w-7 h-7 rounded-[var(--radius)] bg-bg3 text-acc flex-none">{icon}</span>
      <div>
        <p className="font-disp font-semibold text-[13.5px] leading-none">{title}</p>
        <p className="font-mono text-[9.5px] text-mut mt-1">{sub}</p>
      </div>
    </div>
  );
}

export function SettingsDrawer({ open, onClose, pushToast }: { open: boolean; onClose: () => void; pushToast: (m: string) => void }) {
  const { s, set, brand } = useSettings();
  if (!open) return null;

  const themeCard = (id: "graphite" | "oled" | "matrix", label: string, desc: string) => {
    const p = THEMES[id];
    return (
      <button
        key={id}
        onClick={() => { set({ theme: id }); pushToast("Theme → " + label); }}
        className={`panel p-3 text-left transition-all duration-150 hover:-translate-y-0.5 ${s.theme === id ? "!border-[color-mix(in_srgb,var(--acc)_60%,transparent)]" : ""}`}
      >
        <span className="flex gap-1.5 mb-2.5">
          {[p.bg0, p.bg2, p.fg, p.mut].map((c, i) => (
            <span key={i} className="w-5 h-5 rounded-[4px] border border-line" style={{ background: c }} />
          ))}
        </span>
        <span className="block text-[12.5px] font-semibold">{label}</span>
        <span className="block font-mono text-[9px] text-mut mt-0.5">{desc}</span>
      </button>
    );
  };

  const densityBtn = (id: DensityId, label: string, ic: React.ReactNode) => (
    <button className={s.density === id ? "on" : ""} onClick={() => { set({ density: id }); pushToast("Layout density → " + label); }}>
      <span className="inline-flex items-center gap-1.5">{ic}{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 z-[70]">
      <div className="absolute inset-0 bg-black/55" style={{ backdropFilter: `blur(${Math.min(s.blur, 8)}px)` }} onClick={onClose} />
      <aside className="absolute right-0 top-0 bottom-0 w-[392px] max-w-full bg-bg1 border-l border-line overflow-y-auto anim-fadeup">
        <div className="sticky top-0 z-10 flex items-center gap-3 px-5 h-14 border-b border-line bg-bg1">
          <div>
            <p className="font-disp font-bold text-[15px] leading-none">Workspace Settings</p>
            <p className="font-mono text-[9.5px] text-mut mt-1">local-only · persisted to this device</p>
          </div>
          <span className="flex-1" />
          <button className="iconbtn" onClick={onClose}><IX className="w-4 h-4" /></button>
        </div>

        <div className="px-5 py-5">
          <SectionHead icon={<IPalette className="w-4 h-4" />} title="Theme override" sub="live CSS variable injection — no reload" />
          <div className="grid grid-cols-3 gap-2">
            {themeCard("graphite", "Graphite", "charcoal #0e0e10")}
            {themeCard("oled", "OLED Stealth", "true black #000")}
            {themeCard("matrix", "Matrix", "phosphor emerald")}
          </div>
          <div className={`panel p-3 mt-2 ${s.theme === "custom" ? "!border-[color-mix(in_srgb,var(--acc)_60%,transparent)]" : ""}`}>
            <div className="flex items-center gap-2.5">
              <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.customBg) ? s.customBg : "#0f0f0f"} onChange={(e) => { set({ theme: "custom", customBg: e.target.value }); }} title="Custom base" />
              <div className="flex-1">
                <p className="text-[12.5px] font-semibold">Custom hex base</p>
                <p className="font-mono text-[9px] text-mut">surfaces derived automatically</p>
              </div>
              <input
                className="input !w-[92px] !h-8 font-mono !text-[11px]"
                value={s.customBg}
                onChange={(e) => {
                  const v = e.target.value;
                  if (/^#[0-9a-fA-F]{6}$/.test(v)) set({ theme: "custom", customBg: v });
                  else if (v.length <= 7) set({ customBg: v });
                }}
              />
            </div>
          </div>
          <div className="flex items-center gap-2.5 mt-3">
            <input type="color" value={s.accent} onChange={(e) => set({ accent: e.target.value })} title="Accent" />
            <span className="text-[12.5px] font-medium flex-1">Accent shift</span>
            <span className="font-mono text-[10.5px] text-mut">{s.accent}</span>
            {["#43d9ad", "#5b8def", "#e8b45a", "#e0637c", "#35e06b"].map((c) => (
              <button key={c} className="w-5 h-5 rounded-full border border-line transition-transform hover:scale-125" style={{ background: c }} onClick={() => { set({ accent: c }); pushToast("Accent → " + c); }} />
            ))}
          </div>

          <SectionHead icon={<IType className="w-4 h-4" />} title="Typography sculpting" sub="system-wide nomenclature face" />
          <div className="grid grid-cols-2 gap-2">
            {(Object.keys(FONTS) as FontId[]).map((f) => (
              <button
                key={f}
                onClick={() => { set({ font: f }); pushToast("Typeface → " + FONTS[f].label); }}
                className={`panel p-3 text-left transition-all duration-150 hover:-translate-y-0.5 ${s.font === f ? "!border-[color-mix(in_srgb,var(--acc)_60%,transparent)]" : ""}`}
              >
                <span className="block text-[17px] font-semibold leading-none" style={{ fontFamily: FONTS[f].body }}>Aa Rr 01</span>
                <span className="block font-mono text-[9px] text-mut mt-1.5">{FONTS[f].label}</span>
              </button>
            ))}
          </div>
          <p className="panel px-3 py-2.5 mt-2 font-mono text-[10.5px] text-mut" style={{ fontFamily: "var(--font-mono)" }}>
            mono preview → scribe://lessons?unit=SIM-104
          </p>

          <SectionHead icon={<IGrid className="w-4 h-4" />} title="Layout engine" sub="density · curvature · frost" />
          <div className="seg w-full [&>button]:flex-1">{densityBtn("compact", "Compact", <IGrid className="w-3.5 h-3.5" />)}{densityBtn("wide", "Wide", <IWide className="w-3.5 h-3.5" />)}{densityBtn("list", "List", <IList className="w-3.5 h-3.5" />)}</div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <div className="flex justify-between mb-1.5"><span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut">Radius</span><span className="font-mono text-[10px]">{s.radius}px</span></div>
              <input type="range" min={0} max={16} value={s.radius} className="w-full" onChange={(e) => set({ radius: +e.target.value })} />
            </div>
            <div>
              <div className="flex justify-between mb-1.5"><span className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut">Frost blur</span><span className="font-mono text-[10px]">{s.blur}px</span></div>
              <input type="range" min={0} max={24} value={s.blur} className="w-full" onChange={(e) => set({ blur: +e.target.value })} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <span className="text-[12.5px] font-medium">Workspace rail</span>
            <button onClick={() => set({ sidebar: !s.sidebar })} className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${s.sidebar ? "bg-acc" : "bg-bg3"}`}>
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-bg0 transition-all duration-200 ${s.sidebar ? "left-[18px]" : "left-0.5"}`} />
            </button>
          </div>

          <SectionHead icon={<IGlobe className="w-4 h-4" />} title="Proxy routing" sub="how external URLs reach the frame" />
          <div className="flex flex-col gap-1.5">
            {ENGINES.map((e) => (
              <button
                key={e.id}
                onClick={() => { set({ engine: e.id as EngineId }); pushToast("Routing engine → " + e.label); }}
                className={`panel p-2.5 text-left transition-all duration-150 flex items-start gap-2.5 ${s.engine === e.id ? "!border-[color-mix(in_srgb,var(--acc)_60%,transparent)]" : "hover:bg-bg2"}`}
              >
                <span className={`mt-0.5 w-3.5 h-3.5 rounded-full border flex-none grid place-items-center ${s.engine === e.id ? "border-acc" : "border-line"}`}>
                  {s.engine === e.id && <span className="w-1.5 h-1.5 rounded-full bg-acc" />}
                </span>
                <span>
                  <span className="block text-[12.5px] font-semibold">{e.label}</span>
                  <span className="block text-[10.5px] text-mut leading-snug mt-0.5">{e.desc}</span>
                </span>
              </button>
            ))}
          </div>
          {s.engine === "gateway" && (
            <div className="mt-2">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.14em] text-mut mb-1.5">Gateway prefix</p>
              <input className="input font-mono !text-[11px]" value={s.gateway} onChange={(e) => set({ gateway: e.target.value })} placeholder="https://your-uv-host/service" />
            </div>
          )}
          <div className="flex items-center gap-2.5 mt-3">
            <span className="text-[12.5px] font-medium flex-1">Omnibox search fallback</span>
            <div className="seg">
              {SEARCHES.map((x) => (
                <button key={x.id} className={s.search === x.id ? "on" : ""} onClick={() => set({ search: x.id })}>{x.label.split(" ")[0]}</button>
              ))}
            </div>
          </div>

          <SectionHead icon={<IEyeOff className="w-4 h-4" />} title="Stealth & disguise" sub="panic screen · one-click identities" />
          <div className="flex items-center gap-2.5">
            <span className="text-[12.5px] font-medium flex-1">Panic key <kbd>ESC</kbd> renders</span>
            <div className="seg">
              {(["docs", "desmos"] as PanicKind[]).map((k) => (
                <button key={k} className={s.panicScreen === k ? "on" : ""} onClick={() => { set({ panicScreen: k }); pushToast("Panic screen → " + (k === "docs" ? "Google Docs" : "Desmos")); }}>
                  {k === "docs" ? "Docs" : "Desmos"}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-1.5 mt-3">
            {DISGUISES.map((d) => (
              <button
                key={d.id}
                onClick={() => { set({ ...d.patch, disguise: d.id }); pushToast(d.id === "none" ? "Identity restored." : "Disguise engaged → " + d.brand); }}
                className={`panel p-2.5 text-left transition-all duration-150 flex items-center gap-2.5 ${s.disguise === d.id ? "!border-[color-mix(in_srgb,var(--acc)_60%,transparent)]" : "hover:bg-bg2"}`}
              >
                <span className="flex gap-1 flex-none">
                  {(d.patch.accent ? [d.patch.theme === "oled" ? "#000000" : "#0e0e10", d.patch.accent] : ["#0e0e10", s.accent]).map((c, i) => (
                    <span key={i} className="w-4 h-4 rounded-[4px] border border-line" style={{ background: c }} />
                  ))}
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-[12.5px] font-semibold">{d.brand} <span className="text-mut font-normal">· {d.tag}</span></span>
                  <span className="block text-[10.5px] text-mut truncate">{d.desc}</span>
                </span>
                {s.disguise === d.id && <ICheck className="w-4 h-4 text-acc flex-none" />}
              </button>
            ))}
          </div>
          <p className="font-mono text-[9.5px] text-mut mt-2">Active identity: {brand.brand} — title & favicon follow automatically.</p>

          <SectionHead icon={<ITrash className="w-4 h-4" />} title="Danger zone" sub="local storage only — no cloud sync" />
          <div className="flex gap-2">
            <button className="ghost-btn flex-1 !justify-center" onClick={() => { set({ ...DEFAULT_SETTINGS }); pushToast("All settings reset to defaults."); }}>
              <IRefresh className="w-3.5 h-3.5" /> Reset settings
            </button>
            <button className="ghost-btn flex-1 !justify-center !text-acc2" onClick={() => { localStorage.clear(); location.reload(); }}>
              <ITrash className="w-3.5 h-3.5" /> Wipe & reload
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}

/* ------------------------------ find overlay ------------------------- */

interface FindProps {
  open: boolean;
  query: string;
  count: number;
  pos: number;
  limited: boolean;
  onQuery: (q: string) => void;
  onMove: (d: number) => void;
  onClose: () => void;
}

export function FindOverlay({ open, query, count, pos, limited, onQuery, onMove, onClose }: FindProps) {
  if (!open) return null;
  return (
    <div className="fixed top-[118px] right-5 z-[75] w-[330px] panel p-2.5 anim-pop shadow-[0_18px_50px_rgba(0,0,0,0.5)]" style={{ backdropFilter: "blur(var(--blur))" }}>
      <div className="flex items-center gap-2">
        <input
          autoFocus
          className="input !h-8 flex-1 font-mono !text-[11.5px]"
          placeholder="Find in page…"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") onMove(e.shiftKey ? -1 : 1);
            if (e.key === "Escape") onClose();
          }}
        />
        <span className="font-mono text-[10.5px] text-mut w-12 text-center tabular-nums">
          {query ? (count > 0 ? `${pos + 1}/${count}` : "0/0") : "—"}
        </span>
        <button className="iconbtn !w-7 !h-7" onClick={() => onMove(-1)} disabled={!count} title="Previous (⇧Enter)"><IBack className="w-3.5 h-3.5" /></button>
        <button className="iconbtn !w-7 !h-7" onClick={() => onMove(1)} disabled={!count} title="Next (Enter)"><IForward className="w-3.5 h-3.5" /></button>
        <button className="iconbtn !w-7 !h-7" onClick={onClose} title="Close (Esc)"><IX className="w-3.5 h-3.5" /></button>
      </div>
      {limited && (
        <p className="font-mono text-[9.5px] text-acc2 mt-2 leading-snug">
          ⚠ cross-origin frame — the remote document can’t be queried. Workspace-level surfaces only.
        </p>
      )}
    </div>
  );
}

/* -------------------------------- devtools --------------------------- */

function ElementNode({ el, depth }: { el: Element; depth: number }) {
  const [open, setOpen] = useState(depth < 1);
  const kids = depth > 5 ? [] : Array.from(el.children).slice(0, 40);
  const cls = typeof el.className === "string" && el.className.trim() ? "." + el.className.trim().split(/\s+/).slice(0, 2).join(".") : "";
  return (
    <div>
      <button
        className="w-full flex items-center gap-1 h-[22px] px-1 rounded hover:bg-bg3 font-mono text-[10.5px] text-left"
        style={{ paddingLeft: depth * 13 + 4 }}
        onClick={() => kids.length && setOpen(!open)}
      >
        <span className="w-3 text-mut inline-block">{kids.length ? (open ? "▾" : "▸") : " "}</span>
        <span className="text-acc">&lt;{el.tagName.toLowerCase()}</span>
        {el.id && <span className="text-acc2">#{el.id}</span>}
        <span className="text-mut truncate">{cls}</span>
        <span className="text-acc">&gt;</span>
        {kids.length > 0 && <span className="text-mut/60 ml-1">×{el.children.length}</span>}
      </button>
      {open && kids.map((k, i) => <ElementNode key={i} el={k} depth={depth + 1} />)}
    </div>
  );
}

export function DevTools({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [tab, setTab] = useState<"console" | "network" | "elements">("console");
  const [ev, setEv] = useState("");
  const [treeKey, setTreeKey] = useState(0);
  const net = useNetLog();
  const con = useConsoleLog();
  if (!open) return null;

  const evalCmd = () => {
    if (!ev.trim()) return;
    conPush("info", "› " + ev);
    try {
      const out = new Function(`return (${ev})`)();
      conPush("log", typeof out === "object" ? JSON.stringify(out, null, 1) : String(out));
    } catch (e) {
      conPush("error", String(e));
    }
    setEv("");
  };

  return (
    <div className="absolute bottom-0 left-0 right-0 h-[280px] z-30 border-t border-line bg-bg1 flex flex-col anim-fadeup" style={{ background: "color-mix(in srgb, var(--bg1) 92%, transparent)", backdropFilter: "blur(var(--blur))" }}>
      <div className="flex items-center gap-1 h-9 px-2 border-b border-line flex-none">
        <ITerm className="w-4 h-4 text-acc mx-1" />
        {(["console", "network", "elements"] as const).map((t) => (
          <button key={t} className={`chip !h-[24px] !font-body !text-[11px] ${tab === t ? "on" : ""}`} onClick={() => setTab(t)}>
            {t} {t === "network" ? `(${net.length})` : t === "console" ? `(${con.length})` : ""}
          </button>
        ))}
        <span className="flex-1" />
        <span className="font-mono text-[9px] text-mut mr-2 hidden sm:block">inspecting scribedesk runtime — proxied frames are opaque by design</span>
        {tab === "elements" && <button className="iconbtn !w-7 !h-7" onClick={() => setTreeKey((k) => k + 1)} title="Refresh tree"><IRefresh className="w-3.5 h-3.5" /></button>}
        <button className="iconbtn !w-7 !h-7" onClick={clearLogs} title="Clear logs"><ITrash className="w-3.5 h-3.5" /></button>
        <button className="iconbtn !w-7 !h-7" onClick={onClose} title="Close inspector"><IX className="w-3.5 h-3.5" /></button>
      </div>

      {tab === "console" && (
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-[1.7]">
            {con.length === 0 && <p className="text-mut">console attached — runtime events stream here.</p>}
            {con.map((c) => (
              <div key={c.id} className="flex gap-2.5 border-b border-line/50 py-0.5">
                <span className="text-mut/70 flex-none">{c.t}</span>
                <span className={`flex-none w-11 uppercase text-[9px] pt-[3px] tracking-wider ${c.level === "error" ? "text-[#f87171]" : c.level === "warn" ? "text-acc2" : c.level === "info" ? "text-acc" : "text-mut"}`}>{c.level}</span>
                <span className="whitespace-pre-wrap break-all">{c.text}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 px-3 h-9 border-t border-line flex-none">
            <span className="font-mono text-[11px] text-acc">›</span>
            <input
              className="flex-1 bg-transparent outline-none font-mono text-[11.5px]"
              placeholder="evaluate in workspace context…"
              value={ev}
              onChange={(e) => setEv(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && evalCmd()}
            />
            <kbd>⏎ eval</kbd>
          </div>
        </div>
      )}

      {tab === "network" && (
        <div className="flex-1 overflow-y-auto font-mono text-[10.5px]">
          <div className="grid grid-cols-[70px_52px_1fr_110px_86px_54px] gap-2 px-3 h-7 items-center sticky top-0 bg-bg1 border-b border-line text-mut uppercase text-[9px] tracking-[0.14em]">
            <span>time</span><span>verb</span><span>route</span><span>engine</span><span>status</span><span className="text-right">ms</span>
          </div>
          {net.length === 0 && <p className="px-3 py-3 text-mut font-body text-[12px]">No traffic yet — route something through the omnibox.</p>}
          {net.map((n) => (
            <div key={n.id} className="grid grid-cols-[70px_52px_1fr_110px_86px_54px] gap-2 px-3 h-[26px] items-center border-b border-line/40 hover:bg-bg2">
              <span className="text-mut">{n.t}</span>
              <span className="text-acc">{n.method}</span>
              <span className="truncate">{n.url}</span>
              <span className="text-mut">{n.engine}</span>
              <span className={n.status === "FAILED" ? "text-[#f87171]" : "text-acc"}>{n.status}</span>
              <span className="text-right text-mut tabular-nums">{n.ms}</span>
            </div>
          ))}
        </div>
      )}

      {tab === "elements" && (
        <div className="flex-1 overflow-y-auto py-1.5">
          {(() => {
            const root = document.getElementById("sd-app");
            return root ? <ElementNode key={treeKey} el={root} depth={0} /> : <p className="px-3 text-mut text-[12px]">root not mounted</p>;
          })()}
        </div>
      )}
    </div>
  );
}

/* ------------------------------ panic screen ------------------------- */

function DocsPanic() {
  const tool = "w-6 h-6 grid place-items-center rounded hover:bg-[#f1f3f4] text-[#444746] cursor-default";
  const bar = (w: string) => <span className={`block h-[3px] rounded bg-[#80868b] ${w}`} />;
  return (
    <div className="fixed inset-0 z-[100] bg-[#f9fbfd] text-[#202124] flex flex-col" style={{ fontFamily: "Arial, sans-serif" }}>
      <div className="flex items-center gap-3 px-4 pt-2.5 pb-1.5">
        <svg viewBox="0 0 48 48" className="w-10 h-10"><path fill="#4285f4" d="M29 4H12a4 4 0 0 0-4 4v32a4 4 0 0 0 4 4h24a4 4 0 0 0 4-4V15L29 4z" /><path fill="#a1c2fa" d="M29 4l11 11H29z" /><path fill="#fff" d="M14 22h20v2.5H14zm0 6h20v2.5H14zm0 6h13v2.5H14z" /></svg>
        <div>
          <p className="text-[15px] leading-tight">Untitled document</p>
          <div className="flex gap-3 text-[12.5px] text-[#444746] mt-0.5">
            {["File", "Edit", "View", "Insert", "Format", "Tools", "Extensions", "Help"].map((m) => <span key={m} className="hover:bg-[#f1f3f4] rounded px-1 cursor-default">{m}</span>)}
          </div>
        </div>
        <span className="flex-1" />
        <span className="w-8 h-8 grid place-items-center rounded-full hover:bg-[#f1f3f4] text-[#444746]"><IEye className="w-4 h-4" /></span>
        <span className="bg-[#c2e7ff] text-[#001d35] text-[13px] font-medium rounded-full px-5 h-8 grid place-items-center cursor-default">Share</span>
        <span className="w-8 h-8 grid place-items-center rounded-full bg-[#7b1fa2] text-white text-[12px] font-medium cursor-default">A</span>
      </div>
      <div className="flex items-center gap-0.5 px-3 h-10 mx-3 rounded-t bg-white border border-[#dadce0]">
        {[bar("w-4"), bar("w-3")].map((b, i) => <span key={i} className={tool}>{b}</span>)}
        <span className="w-px h-5 bg-[#dadce0] mx-1" />
        <span className={tool + " text-[11px] w-20 justify-between px-1.5"}>Arial <span>▾</span></span>
        <span className={tool + " text-[11px]"}>11 <span className="text-[8px]">▾</span></span>
        <span className="w-px h-5 bg-[#dadce0] mx-1" />
        <span className={tool + " font-bold text-[12px]"}>B</span>
        <span className={tool + " italic text-[12px]"}>I</span>
        <span className={tool + " underline text-[12px]"}>U</span>
        <span className={tool + " text-[12px]"}><span className="border-b-[3px] border-[#c5221f] pb-0.5">A</span></span>
        <span className="w-px h-5 bg-[#dadce0] mx-1" />
        <span className={tool}><span className="w-4 h-3 border border-[#80868b] rounded-sm relative"><span className="absolute inset-x-0 bottom-0 h-1 bg-[#1a73e8]" /></span></span>
        <span className="w-px h-5 bg-[#dadce0] mx-1" />
        {["w-3", "w-4", "w-3"].map((w, i) => <span key={i} className={tool}>{bar(w)}</span>)}
      </div>
      <div className="flex-1 overflow-hidden grid justify-center pt-6 bg-[#f9fbfd]">
        <div className="w-[816px] max-w-[94vw] bg-white shadow-[0_1px_3px_rgba(60,64,67,0.15)] px-16 py-14 min-h-[640px]">
          <h1 className="text-[22px] font-bold mb-1">The Role of Photosynthesis in Closed Ecosystem Systems</h1>
          <p className="text-[12px] text-[#5f6368] mb-7">Alex Student · Period 4 Biology · Draft 3</p>
          {[
            "Closed ecological systems, whether engineered biospheres or sealed terraria, depend entirely on the steady conversion of light energy into chemical bonds. The thylakoid membranes inside each chloroplast behave like microscopic solar arrays, splitting water and fixing carbon at a rate that ultimately sets the ceiling for every other organism in the loop.",
            "In a sealed environment the margin for error is narrow. Oxygen produced during the light reactions must balance the respiration of every consumer in the system, and any drift accumulates within days. This is why engineers of closed-loop life support study chlorophyll fluorescence curves with the same seriousness that pilots study fuel gauges.",
            "The practical implication for our greenhouse unit is straightforward: light intensity, CO₂ concentration, and leaf area index are the three levers that keep the loop closed. The data collected in Lab 3 supports the hypothesis that a 12% increase in leaf area stabilizes overnight O₂ decline far better than increasing lamp output alone.",
            "Further reading: Taiz & Zeiger, Plant Physiology, ch. 7; the 1991 Biosphere 2 atmospheric reports; and our own class dataset, attached in the shared drive under /period-4/closed-loops."
          ].map((p, i) => (
            <p key={i} className="text-[13.5px] leading-[1.85] mb-5 text-[#202124]">{p}</p>
          ))}
          <p className="text-[13.5px] leading-[1.85]"><span className="caret">Next, consider how nitrogen fixation constrains</span></p>
        </div>
      </div>
      <div className="h-7 bg-white border-t border-[#dadce0] flex items-center gap-2 px-4 text-[11px] text-[#5f6368]">
        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5" /></svg>
        All changes saved in Drive
        <span className="flex-1" />
        Editing: Alex S. · alex.student@school.edu
      </div>
    </div>
  );
}

function DesmosPanic() {
  const W = 900, H = 620, cx = W / 2, cy = H / 2, S = 34;
  const pts = (f: (x: number) => number, from: number, to: number) => {
    const out: string[] = [];
    for (let x = from; x <= to; x += 0.08) {
      const y = f(x);
      if (Math.abs(y) < 40) out.push(`${(cx + x * S).toFixed(1)},${(cy - y * S).toFixed(1)}`);
    }
    return "M" + out.join(" L");
  };
  const parabola = pts((x) => (x * x) / 4 - 2, -8, 8);
  const sine = pts((x) => 3 * Math.sin(x / 1.6), -13, 13);
  const line = pts((x) => 0.5 * x + 1, -13, 13);
  const exprs = [
    { c: "#c74440", e: "y = x²/4 − 2" },
    { c: "#2d70b3", e: "y = 3 sin(x/1.6)" },
    { c: "#388c46", e: "y = x/2 + 1" },
    { c: "#6042a6", e: "(x−4)² + (y−3)² = 4" },
  ];
  return (
    <div className="fixed inset-0 z-[100] bg-white text-[#333] flex flex-col" style={{ fontFamily: "'Segoe UI', Arial, sans-serif" }}>
      <div className="flex items-center gap-3 h-12 px-3 border-b border-[#e5e5e5]">
        <svg viewBox="0 0 32 32" className="w-8 h-8"><rect width="32" height="32" rx="6" fill="#157d4c" /><path d="M9 23V9M9 23h14" stroke="#fff" strokeWidth="2" /><path d="M10 21q7-14 14-11" fill="none" stroke="#fff" strokeWidth="2.4" /></svg>
        <span className="font-semibold text-[16px]">Desmos</span>
        <span className="text-[13px] text-[#888] border-l border-[#ddd] pl-3">Graphing Calculator</span>
        <span className="flex-1" />
        {["Save", "Share"].map((b) => (
          <span key={b} className="h-8 px-4 grid place-items-center rounded border border-[#ccc] text-[13px] text-[#555] cursor-default hover:bg-[#f5f5f5]">{b}</span>
        ))}
        <span className="w-8 h-8 grid place-items-center rounded-full bg-[#555] text-white text-[12px] cursor-default">A</span>
      </div>
      <div className="flex-1 flex min-h-0">
        <div className="w-[290px] border-r border-[#e5e5e5] flex flex-col">
          {exprs.map((x, i) => (
            <div key={i} className="flex items-stretch border-b border-[#efefef] group">
              <span className="w-[6px] flex-none" style={{ background: x.c }} />
              <span className="flex-1 px-3 h-14 flex items-center text-[15px] italic" style={{ fontFamily: "Georgia, serif" }}>{x.e}</span>
              <span className="w-10 grid place-items-center text-[#bbb] group-hover:text-[#777]"><IEye className="w-4 h-4" /></span>
            </div>
          ))}
          <div className="flex items-center gap-2 px-3 h-14 text-[#157d4c] text-[14px] cursor-default hover:bg-[#f5fbf8]">
            <span className="w-5 h-5 grid place-items-center rounded-full bg-[#157d4c] text-white text-[13px]">+</span>
            Add expression
          </div>
          <span className="flex-1" />
          <div className="p-3 border-t border-[#e5e5e5] text-[12px] text-[#999]">4 expressions · radian mode</div>
        </div>
        <div className="flex-1 relative overflow-hidden">
          <svg viewBox={`0 0 ${W} ${H}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="g" width={S} height={S} patternUnits="userSpaceOnUse">
                <path d={`M ${S} 0 L 0 0 0 ${S}`} fill="none" stroke="#eee" strokeWidth="1" />
              </pattern>
            </defs>
            <rect width={W} height={H} fill="#fff" />
            <rect width={W} height={H} fill="url(#g)" />
            <line x1="0" y1={cy} x2={W} y2={cy} stroke="#999" strokeWidth="1.4" />
            <line x1={cx} y1="0" x2={cx} y2={H} stroke="#999" strokeWidth="1.4" />
            <circle cx={cx + 4 * S} cy={cy - 3 * S} r={2 * S} fill="none" stroke="#6042a6" strokeWidth="2.4" />
            <path d={parabola} fill="none" stroke="#c74440" strokeWidth="2.4" />
            <path d={sine} fill="none" stroke="#2d70b3" strokeWidth="2.4" />
            <path d={line} fill="none" stroke="#388c46" strokeWidth="2.4" />
            <circle r="5" fill="#c74440">
              <animateMotion dur="7s" repeatCount="indefinite" path={parabola} />
            </circle>
          </svg>
          <div className="absolute bottom-3 right-3 flex gap-1">
            {["+", "−", "⌂"].map((z) => (
              <span key={z} className="w-8 h-8 grid place-items-center bg-white border border-[#ddd] rounded text-[#666] text-[15px] cursor-default shadow-sm">{z}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function PanicOverlay({ kind }: { kind: PanicKind }) {
  return kind === "docs" ? <DocsPanic /> : <DesmosPanic />;
}

/* -------------------------------- toasts ----------------------------- */

export function Toasts({ items }: { items: { id: number; msg: string }[] }) {
  return (
    <div className="fixed bottom-10 right-4 z-[80] flex flex-col gap-2 items-end">
      {items.map((t) => (
        <div key={t.id} className="anim-toast panel px-3.5 h-10 flex items-center gap-2.5 shadow-[0_12px_30px_rgba(0,0,0,0.45)]" style={{ backdropFilter: "blur(var(--blur))" }}>
          <IZap className="w-3.5 h-3.5 text-acc" />
          <span className="text-[12.5px] font-medium">{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
