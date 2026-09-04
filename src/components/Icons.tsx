import type { ReactNode } from "react";

type P = { className?: string };

const mk = (node: ReactNode) =>
  function Icon({ className = "w-4 h-4" }: P) {
    return (
      <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {node}
      </svg>
    );
  };

export const IBack = mk(<><path d="M19 12H5" /><path d="M11 18l-6-6 6-6" /></>);
export const IForward = mk(<><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></>);
export const IRefresh = mk(<><path d="M21 12a9 9 0 1 1-2.6-6.3" /><path d="M21 3v6h-6" /></>);
export const IHome = mk(<><path d="M3 10.5L12 3l9 7.5" /><path d="M5 9.5V21h5v-6h4v6h5V9.5" /></>);
export const IStar = mk(<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8L12 3z" />);
export const IStarFill = mk(<path d="M12 3l2.7 5.6 6.1.8-4.5 4.3 1.1 6.1L12 17l-5.4 2.8 1.1-6.1L3.2 9.4l6.1-.8L12 3z" fill="currentColor" />);
export const ISearch = mk(<><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></>);
export const IX = mk(<><path d="M18 6L6 18" /><path d="M6 6l12 12" /></>);
export const IPlus = mk(<><path d="M12 5v14" /><path d="M5 12h14" /></>);
export const IGear = mk(<><circle cx="12" cy="12" r="3.2" /><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1 1.55V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.1-1.55 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.82-2.83l.06-.06a1.7 1.7 0 0 0 .33-1.87 1.7 1.7 0 0 0-1.55-1H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.55-1.1 1.7 1.7 0 0 0-.33-1.88l-.06-.06a2 2 0 1 1 2.82-2.82l.06.06a1.7 1.7 0 0 0 1.88.33h.09a1.7 1.7 0 0 0 1-1.55V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1 1.55 1.7 1.7 0 0 0 1.88-.33l.06-.06a2 2 0 1 1 2.83 2.82l-.06.06a1.7 1.7 0 0 0-.34 1.88v.09a1.7 1.7 0 0 0 1.55 1H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51 1z" /></>);
export const IBug = mk(<><rect x="8" y="6" width="8" height="13" rx="4" /><path d="M12 6V4M8.5 8L5 6M15.5 8L19 6M8 13H4M20 13h-4M8.5 17.5L5 20M15.5 17.5L19 20M12 9v7" /></>);
export const IFind = mk(<><rect x="3" y="4" width="18" height="16" rx="2" /><circle cx="10.5" cy="11" r="2.6" /><path d="M12.5 13l3 3M16 8h3M16 11h2" /></>);
export const IShield = mk(<><path d="M12 3l7 3v5c0 4.5-3 8.5-7 10-4-1.5-7-5.5-7-10V6l7-3z" /><path d="M12 8v4M12 15.5v.5" /></>);
export const IGlobe = mk(<><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.7 3.8 9S14.5 18.4 12 21c-2.5-2.6-3.8-5.7-3.8-9S9.5 5.6 12 3z" /></>);
export const ILock = mk(<><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></>);
export const ITerm = mk(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M7 9l3 3-3 3M12.5 15H17" /></>);
export const IBook = mk(<><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15.5H6.5A2.5 2.5 0 0 0 4 21V5.5z" /><path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" /></>);
export const IClock = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>);
export const IChevD = mk(<path d="M6 9l6 6 6-6" />);
export const IChevR = mk(<path d="M9 6l6 6-6 6" />);
export const ICheck = mk(<path d="M4 12.5l5 5L20 6.5" />);
export const IPlay = mk(<path d="M7 4.5l13 7.5-13 7.5v-15z" />);
export const IExt = mk(<><path d="M14 4h6v6" /><path d="M20 4L10 14" /><path d="M19 13.5V20H4V5h6.5" /></>);
export const IGame = mk(<><path d="M6.5 7h11a4.5 4.5 0 0 1 4.4 5.4l-.8 4a2.8 2.8 0 0 1-4.9 1.2L14.5 16h-5l-1.7 1.6a2.8 2.8 0 0 1-4.9-1.2l-.8-4A4.5 4.5 0 0 1 6.5 7z" /><path d="M8 10.5v3M6.5 12h3M15.5 10.7h.01M17.5 13h.01" /></>);
export const ICpu = mk(<><rect x="6" y="6" width="12" height="12" rx="1.5" /><rect x="10" y="10" width="4" height="4" /><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M6 2.8v0M6 2v2.5M18 2v2.5M6 19.5V22M18 19.5V22M2 6h2.5M19.5 6H22M2 18h2.5M19.5 18H22" /></>);
export const ILayers = mk(<><path d="M12 3l9 5-9 5-9-5 9-5z" /><path d="M3 13l9 5 9-5M3 17.5l9 5 9-5" opacity="0.6" /></>);
export const IPanel = mk(<><rect x="3" y="4" width="18" height="16" rx="2" /><path d="M9.5 4v16" /></>);
export const ITrash = mk(<><path d="M4 7h16M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13" /><path d="M10 11v5M14 11v5" /></>);
export const IInfo = mk(<><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 7.5v.5" /></>);
export const IPalette = mk(<><path d="M12 3a9 9 0 1 0 0 18c1.4 0 2-.9 2-1.8 0-.8-.5-1.2-.5-2 0-1.1.9-2 2-2h2A4.5 4.5 0 0 0 22 10.5C21.5 6 17.2 3 12 3z" /><circle cx="7.5" cy="11" r="1" /><circle cx="10.5" cy="7" r="1" /><circle cx="15" cy="7.5" r="1" /></>);
export const IType = mk(<><path d="M5 7V4.5h14V7M12 4.5v15M9 19.5h6" /></>);
export const IBell = mk(<><path d="M18 9a6 6 0 1 0-12 0c0 6-2.5 7-2.5 7h17S18 15 18 9z" /><path d="M10 20a2.2 2.2 0 0 0 4 0" /></>);
export const IGrid = mk(<><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></>);
export const IList = mk(<><path d="M9 6h11M9 12h11M9 18h11" /><path d="M4.5 6h.01M4.5 12h.01M4.5 18h.01" strokeWidth="2.6" /></>);
export const IWide = mk(<><rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M12 5v14" /></>);
export const IFlask = mk(<><path d="M10 3v6L4.6 18a2.4 2.4 0 0 0 2.1 3.5h10.6a2.4 2.4 0 0 0 2.1-3.5L14 9V3" /><path d="M8.5 3h7M7.5 15h9" /></>);
export const IPen = mk(<><path d="M12 3.5l6.5 6.5-8.5 11L4 22.5l1.5-6.5 8-10.5z" /><path d="M10 6l5.5 5.5" /></>);
export const IEye = mk(<><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>);
export const IEyeOff = mk(<><path d="M4 4l16 16" /><path d="M10 5.8A9.8 9.8 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.8 3.6M6.6 6.6A16 16 0 0 0 2.5 12S6 18.5 12 18.5a9.6 9.6 0 0 0 4-1" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>);
export const IWifi = mk(<><path d="M3 9.5a13.5 13.5 0 0 1 18 0M6.5 13a8.5 8.5 0 0 1 11 0M10 16.5a4 4 0 0 1 4 0" /><path d="M12 20h.01" strokeWidth="2.6" /></>);
export const IZap = mk(<path d="M13 2L4.5 13.5H11L10 22l8.5-11.5H13L13 2z" />);
export const IArrowUpR = mk(<><path d="M7 17L17 7" /><path d="M8.5 7H17v8.5" /></>);
export const IHash = mk(<><path d="M9 3L7 21M17 3l-2 18M4 8h17M3 16h17" /></>);
export const ICmd = mk(<path d="M9 9V6a3 3 0 1 0-3 3h3zm0 0v6m0-6h6m-6 6v3a3 3 0 1 1-3-3h3zm6-6h3a3 3 0 1 0-3-3v3zm0 6v3a3 3 0 1 0 3-3h-3zm0 0H9" />);
export const INews = mk(<><path d="M4 5h13v15H6a2 2 0 0 1-2-2V5z" /><path d="M17 8h3v10a2 2 0 0 1-2 2h-1" /><path d="M7 9h7M7 12.5h7M7 16h4" /></>);
