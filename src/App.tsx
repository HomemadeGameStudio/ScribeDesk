import { useEffect, useRef, useState } from "react";
import { SettingsProvider, useSettings, netPush, conPush } from "./lib/settings";
import { resolveRoute, internalRoute, cur, makeTab } from "./lib/router";
import type { Tab, Route } from "./lib/router";
import { getGame, loadGames } from "./lib/games";
import type { GameDef } from "./lib/games";
import {
  TopBar, Sidebar, TabStrip, Toolbar, BookmarkBar, StatusStrip,
  STATIC_BOOKMARKS, loadCustomBookmarks, saveCustomBookmarks,
} from "./components/Chrome";
import type { Bookmark, RecentEntry } from "./components/Chrome";
import { HomePage, LessonsPage, GameStage } from "./components/Internal";
import { SettingsDrawer, FindOverlay, DevTools, PanicOverlay, Toasts } from "./components/Overlays";
import { IInfo, IZap } from "./components/Icons";
import { urlHost } from "./lib/router";

/* ----------------------------- find engine --------------------------- */

function clearMarks() {
  document.querySelectorAll("mark.sd-find").forEach((m) => {
    const p = m.parentNode;
    if (!p) return;
    p.replaceChild(document.createTextNode(m.textContent || ""), m);
    p.normalize();
  });
}

function findInRoot(root: Element, q: string): HTMLElement[] {
  const marks: HTMLElement[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes: Text[] = [];
  let n: Node | null;
  while ((n = walker.nextNode())) {
    const t = n as Text;
    if (t.nodeValue && t.nodeValue.toLowerCase().includes(q.toLowerCase())) nodes.push(t);
  }
  const lq = q.toLowerCase();
  nodes.forEach((node) => {
    const text = node.nodeValue || "";
    const lt = text.toLowerCase();
    if (!node.parentNode) return;
    const frag = document.createDocumentFragment();
    let i = 0;
    let j = lt.indexOf(lq);
    while (j >= 0) {
      frag.appendChild(document.createTextNode(text.slice(i, j)));
      const m = document.createElement("mark");
      m.className = "sd-find";
      m.textContent = text.slice(j, j + q.length);
      frag.appendChild(m);
      marks.push(m);
      i = j + q.length;
      j = lt.indexOf(lq, i);
    }
    frag.appendChild(document.createTextNode(text.slice(i)));
    node.parentNode.replaceChild(frag, node);
  });
  return marks;
}

/* ------------------------------ error panel -------------------------- */

function ErrorPanel({ route, onRetry, onSettings }: { route: Route; onRetry: () => void; onSettings: () => void }) {
  return (
    <div className="h-full grid place-items-center p-6 bg-bg0">
      <div className="panel p-7 max-w-[480px] w-full anim-pop text-center">
        <span className="grid place-items-center w-12 h-12 mx-auto rounded-full bg-bg3 text-acc2 mb-4">
          <IInfo className="w-6 h-6" />
        </span>
        <p className="font-disp font-bold text-[17px]">Couldn’t route this origin</p>
        <p className="font-mono text-[11px] text-mut mt-1.5 break-all">{route.display}</p>
        <p className="text-[12.5px] text-mut mt-3 leading-relaxed">
          {route.error ? <span className="text-acc2">{route.error}.</span> : "The origin refused the frame."}{" "}
          Many origins send <span className="font-mono text-[11px]">X-Frame-Options</span> headers that block embedding on the Direct engine.
        </p>
        <div className="flex gap-2 justify-center mt-5">
          <button className="btn-acc" onClick={onRetry}>Retry route</button>
          <button className="ghost-btn" onClick={onSettings}>Switch engine</button>
        </div>
        <p className="font-mono text-[9.5px] text-mut mt-4">tip: “Scribe Relay” fetches the payload and reseals it inside a srcdoc frame</p>
      </div>
    </div>
  );
}

/* --------------------------------- shell ----------------------------- */

function Shell() {
  const { s, set, panic, setPanic, togglePanic } = useSettings();

  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab(internalRoute("home"))]);
  const [activeId, setActiveId] = useState<string>(tabs[0].id);
  const [input, setInput] = useState("scribe://home");
  const omniRef = useRef<HTMLInputElement>(null);

  const [settingsOpen, setSettingsOpen] = useState(false);
  const [devOpen, setDevOpen] = useState(false);
  const [findOpen, setFindOpen] = useState(false);
  const [findQ, setFindQ] = useState("");
  const [findPos, setFindPos] = useState(0);
  const [findLimited, setFindLimited] = useState(false);
  const marksRef = useRef<HTMLElement[]>([]);

  const [customMarks, setCustomMarks] = useState<Bookmark[]>(() => loadCustomBookmarks());
  const [recents, setRecents] = useState<RecentEntry[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("sd:recent") || "[]") as RecentEntry[];
    } catch {
      return [];
    }
  });
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toastId = useRef(0);

  const active = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const route = cur(active);

  const pushToast = (msg: string) => {
    toastId.current += 1;
    const id = toastId.current;
    setToasts((t) => [...t.slice(-3), { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800);
  };

  /* ------------------------------ navigation ------------------------- */

  const patchTab = (id: string, fn: (t: Tab) => Tab) => setTabs((prev) => prev.map((t) => (t.id === id ? fn(t) : t)));

  const pushRecent = (r: RecentEntry) => {
    setRecents((prev) => {
      const next = [r, ...prev.filter((x) => x.display !== r.display)].slice(0, 10);
      try {
        localStorage.setItem("sd:recent", JSON.stringify(next));
      } catch { /* quota */ }
      return next;
    });
  };

  async function navigateIn(tabId: string, raw: string) {
    const started = performance.now();
    patchTab(tabId, (t) => ({ ...t, loading: true }));
    let r: Route;
    try {
      r = await resolveRoute(raw, s.engine, s.gateway, s.search, (id) => getGame(id)?.title ?? id);
    } catch {
      r = { kind: "web", display: raw, title: raw, src: null, srcdoc: null, via: "—", error: "Route resolution failed" };
    }
    const ms = Math.round(performance.now() - started);
    netPush({ method: "GET", url: r.display, engine: r.via, status: r.error ? "FAILED" : "ROUTED", ms });
    conPush(r.error ? "warn" : "info", `${r.via} → ${r.display}${r.error ? " · " + r.error : ` · ${ms}ms`}`);
    if (r.kind === "game") {
      const g = getGame(r.gameId);
      if (g) r = { ...r, title: g.title };
    }
    patchTab(tabId, (t) => {
      const entries = [...t.entries.slice(0, t.idx + 1), r];
      return { ...t, entries, idx: entries.length - 1, loading: r.kind === "web" };
    });
    if (r.kind !== "web") {
      setTimeout(() => patchTab(tabId, (t) => ({ ...t, loading: false })), 320);
    }
    pushRecent({ display: r.display, title: r.title });
  }

  const openInNewTab = (url: string) => {
    const t = makeTab(internalRoute("home"));
    setTabs((prev) => [...prev, { ...t, loading: true }]);
    setActiveId(t.id);
    void navigateIn(t.id, url);
  };

  const closeTab = (id: string) => {
    setTabs((prev) => {
      const idx = prev.findIndex((t) => t.id === id);
      if (idx === -1) return prev;
      if (prev.length === 1) {
        const fresh = makeTab(internalRoute("home"));
        setActiveId(fresh.id);
        return [fresh];
      }
      const next = prev.filter((t) => t.id !== id);
      if (id === activeId) setActiveId(next[Math.max(0, idx - 1)].id);
      return next;
    });
  };

  const goBack = () => {
    if (active.idx === 0) return;
    const ni = active.idx - 1;
    const target = active.entries[ni];
    patchTab(active.id, (t) => ({ ...t, idx: ni, loading: target.kind === "web" }));
    if (target.kind !== "web") setTimeout(() => patchTab(active.id, (t) => ({ ...t, loading: false })), 260);
  };

  const goFwd = () => {
    if (active.idx >= active.entries.length - 1) return;
    const ni = active.idx + 1;
    const target = active.entries[ni];
    patchTab(active.id, (t) => ({ ...t, idx: ni, loading: target.kind === "web" }));
    if (target.kind !== "web") setTimeout(() => patchTab(active.id, (t) => ({ ...t, loading: false })), 260);
  };

  const refresh = () => {
    patchTab(active.id, (t) => ({ ...t, reload: t.reload + 1, loading: true }));
    const kind = cur(active).kind;
    if (kind !== "web") setTimeout(() => patchTab(active.id, (t) => ({ ...t, loading: false })), 300);
  };

  const cycleTab = (d: number) => {
    const i = tabs.findIndex((t) => t.id === activeId);
    setActiveId(tabs[(i + d + tabs.length) % tabs.length].id);
  };

  /* ------------------------------- omnibox --------------------------- */

  useEffect(() => setInput(route.display), [activeId, route.display]); // eslint-disable-line react-hooks/exhaustive-deps

  const submitOmnibox = () => {
    void navigateIn(active.id, input);
    omniRef.current?.blur();
  };

  /* ------------------------------ bookmarks -------------------------- */

  const bookmarked =
    STATIC_BOOKMARKS.some((b) => b.url === route.display) || customMarks.some((b) => b.url === route.display);

  const toggleBookmark = () => {
    const url = route.display;
    if (customMarks.some((b) => b.url === url)) {
      const next = customMarks.filter((b) => b.url !== url);
      setCustomMarks(next);
      saveCustomBookmarks(next);
      pushToast("Bookmark removed.");
      return;
    }
    if (STATIC_BOOKMARKS.some((b) => b.url === url)) {
      pushToast("That one ships pinned by the workspace.");
      return;
    }
    const label = url.startsWith("scribe://") ? url : urlHost(url);
    const next = [...customMarks, { label, url }];
    setCustomMarks(next);
    saveCustomBookmarks(next);
    pushToast("Pinned to bookmark bar — " + label);
  };

  /* ---------------------------- find engine -------------------------- */

  useEffect(() => {
    clearMarks();
    marksRef.current = [];
    setFindPos(0);
    if (!findOpen || !findQ.trim()) return;
    const pane = document.getElementById("pane-" + active.id);
    const root = pane?.querySelector("[data-findroot]");
    setFindLimited(!root);
    if (!root) return;
    const marks = findInRoot(root, findQ.trim());
    marksRef.current = marks;
    if (marks[0]) marks[0].scrollIntoView({ block: "center", behavior: "smooth" });
  }, [findQ, findOpen, active.id, route.display]); // eslint-disable-line react-hooks/exhaustive-deps

  const moveFind = (d: number) => {
    const marks = marksRef.current;
    if (!marks.length) return;
    marks.forEach((m) => m.classList.remove("cur"));
    const next = (findPos + d + marks.length) % marks.length;
    setFindPos(next);
    marks[next].classList.add("cur");
    marks[next].scrollIntoView({ block: "center", behavior: "smooth" });
  };

  /* ------------------------------ shortcuts -------------------------- */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        const tgt = e.target as HTMLElement | null;
        if (panic) {
          setPanic(null);
          conPush("info", "panic lifted — proxy restored");
          e.preventDefault();
          return;
        }
        if (tgt && (tgt.tagName === "INPUT" || tgt.tagName === "TEXTAREA" || tgt.isContentEditable)) {
          (tgt as HTMLInputElement).blur();
          return;
        }
        if (findOpen) { setFindOpen(false); return; }
        if (settingsOpen) { setSettingsOpen(false); return; }
        if (devOpen) { setDevOpen(false); return; }
        conPush("warn", "PANIC — disguise engaged (" + s.panicScreen + ")");
        togglePanic();
        e.preventDefault();
        return;
      }
      const mod = e.ctrlKey || e.metaKey;
      const k = e.key.toLowerCase();
      if (mod && k === "f") { e.preventDefault(); setFindOpen(true); }
      else if (mod && k === "l") { e.preventDefault(); omniRef.current?.focus(); omniRef.current?.select(); }
      else if (mod && k === "t") { e.preventDefault(); openInNewTab("scribe://home"); }
      else if (mod && k === "w") { e.preventDefault(); closeTab(active.id); }
      else if (mod && k === "r") { e.preventDefault(); refresh(); }
      else if (e.ctrlKey && e.key === "Tab") { e.preventDefault(); cycleTab(e.shiftKey ? -1 : 1); }
      else if (e.altKey && e.key === "ArrowLeft") { e.preventDefault(); goBack(); }
      else if (e.altKey && e.key === "ArrowRight") { e.preventDefault(); goFwd(); }
      else if (e.key === "F3" && findOpen) { e.preventDefault(); moveFind(e.shiftKey ? -1 : 1); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /* ------------------------------ lifecycle -------------------------- */

  useEffect(() => {
    loadGames();
    conPush("info", "ScribeDesk runtime online · routing core armed");
    netPush({ method: "BOOT", url: "scribe://home", engine: "internal", status: "ROUTED", ms: 4 });
    const orig = { log: console.log, warn: console.warn, error: console.error, info: console.info };
    (["log", "warn", "error", "info"] as const).forEach((lv) => {
      console[lv] = (...args: unknown[]) => {
        orig[lv].apply(console, args);
        conPush(lv, args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" "));
      };
    });
    return () => {
      console.log = orig.log;
      console.warn = orig.warn;
      console.error = orig.error;
      console.info = orig.info;
    };
  }, []);

  /* -------------------------------- render --------------------------- */

  const frameLoad = (tabId: string, e: React.SyntheticEvent<HTMLIFrameElement>) => {
    patchTab(tabId, (t) => ({ ...t, loading: false }));
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      const r = cur(tab);
      if (r.kind === "web") netPush({ method: "FRAME", url: r.display, engine: r.via, status: "PAINTED", ms: Math.round(40 + Math.random() * 300) });
      try {
        const title = e.currentTarget.contentDocument?.title;
        if (title) patchTab(tabId, (t) => {
          const entries = [...t.entries];
          entries[t.idx] = { ...entries[t.idx], title };
          return { ...t, entries };
        });
      } catch { /* cross-origin opaque */ }
    }
  };

  const moduleTabs = tabs.filter((t) => cur(t).kind === "game");

  return (
    <>
      <div className="ambient-glow" />
      <div className="ambient-grid" />
      <div className="ambient-noise" />

      <div id="sd-app" className="relative z-10 h-full flex flex-col">
        <TopBar
          onNavigate={(u) => void navigateIn(active.id, u)}
          onOpenSettings={() => setSettingsOpen(true)}
          moduleTabs={moduleTabs}
          onSwitchTab={setActiveId}
          onPanic={() => { conPush("warn", "PANIC — disguise engaged (" + s.panicScreen + ")"); togglePanic(); }}
          pushToast={pushToast}
        />

        <div className="flex flex-1 min-h-0">
          <Sidebar
            onNavigate={(u) => void navigateIn(active.id, u)}
            recents={recents}
            current={route.kind === "home" || route.kind === "lessons" ? route.display : ""}
            pushToast={pushToast}
          />

          <div className="flex flex-col flex-1 min-w-0 bg-bg1/40">
            <TabStrip tabs={tabs} activeId={active.id} onSelect={setActiveId} onClose={closeTab} onNew={() => openInNewTab("scribe://home")} />

            <Toolbar
              route={route}
              canBack={active.idx > 0}
              canFwd={active.idx < active.entries.length - 1}
              loading={active.loading}
              engine={s.engine}
              bookmarked={bookmarked}
              findOpen={findOpen}
              devOpen={devOpen}
              inputRef={omniRef}
              input={input}
              setInput={setInput}
              onSubmit={submitOmnibox}
              onBack={goBack}
              onFwd={goFwd}
              onRefresh={refresh}
              onHome={() => void navigateIn(active.id, "scribe://home")}
              onToggleBookmark={toggleBookmark}
              onFind={() => setFindOpen(!findOpen)}
              onDev={() => setDevOpen(!devOpen)}
              onPanic={() => { conPush("warn", "PANIC — disguise engaged (" + s.panicScreen + ")"); togglePanic(); }}
              onSettings={() => setSettingsOpen(true)}
            />
            {active.loading && <div className="h-[2px] progress-track flex-none" />}

            <BookmarkBar bookmarks={[...STATIC_BOOKMARKS, ...customMarks]} onNavigate={(u) => void navigateIn(active.id, u)} />

            <div className="relative flex-1 min-h-0">
              {tabs.map((t) => {
                const r = cur(t);
                const hiddenPane = t.id !== active.id;
                return (
                  <div key={t.id} id={"pane-" + t.id} className={hiddenPane ? "hidden" : "absolute inset-0 flex flex-col min-h-0"}>
                    {r.kind === "home" && <HomePage onNavigate={(u) => void navigateIn(t.id, u)} recents={recents} />}
                    {r.kind === "lessons" && <LessonsPage onLaunch={(g: GameDef) => void navigateIn(t.id, "scribe://play/" + g.id)} />}
                    {r.kind === "game" &&
                      (getGame(r.gameId) ? (
                        <GameStage game={getGame(r.gameId)!} onBack={() => void navigateIn(t.id, "scribe://lessons")} pushToast={pushToast} />
                      ) : (
                        <ErrorPanel
                          route={{ ...r, error: `Module “${r.gameId}” is not in the synced index` }}
                          onRetry={() => void navigateIn(t.id, "scribe://lessons")}
                          onSettings={() => setSettingsOpen(true)}
                        />
                      ))}
                    {r.kind === "web" && (
                      <div className="flex-1 min-h-0 relative bg-white">
                        {!r.error && (
                          <iframe
                            key={t.id + ":" + t.reload}
                            src={r.srcdoc !== null ? undefined : r.src ?? undefined}
                            srcDoc={r.srcdoc ?? undefined}
                            title={r.title}
                            className="w-full h-full border-0 bg-white"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                            allow="fullscreen; clipboard-write"
                            onLoad={(e) => frameLoad(t.id, e)}
                          />
                        )}
                        {r.error && <ErrorPanel route={r} onRetry={() => void navigateIn(t.id, r.display)} onSettings={() => setSettingsOpen(true)} />}
                        {t.loading && !r.error && (
                          <div className="absolute inset-0 z-10 grid place-items-center" style={{ background: "color-mix(in srgb, var(--bg0) 82%, transparent)", backdropFilter: "blur(6px)" }}>
                            <div className="panel px-5 h-12 flex items-center gap-3 anim-pop">
                              <IZap className="w-4 h-4 text-acc" />
                              <span className="font-mono text-[11.5px]">routing via {r.via} — <span className="text-mut">{r.display}</span></span>
                              <span className="w-24 h-[3px] rounded overflow-hidden bg-bg3 progress-track" />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
              <DevTools open={devOpen} onClose={() => setDevOpen(false)} />
            </div>
          </div>
        </div>

        <StatusStrip route={route} tabCount={tabs.length} />
      </div>

      <SettingsDrawer open={settingsOpen} onClose={() => setSettingsOpen(false)} pushToast={pushToast} />
      <FindOverlay
        open={findOpen}
        query={findQ}
        count={marksRef.current.length}
        pos={findPos}
        limited={findLimited}
        onQuery={setFindQ}
        onMove={moveFind}
        onClose={() => setFindOpen(false)}
      />
      <Toasts items={toasts} />
      {panic && <PanicOverlay kind={panic} />}
    </>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <Shell />
    </SettingsProvider>
  );
}
