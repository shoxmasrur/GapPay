import type { SVGProps } from "react";

// Yengil ikonlar to'plami (tashqi kutubxonasiz — TZ: < 300 KB birinchi yuklanish).
const paths = {
  home: "M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5",
  circles: "M12 4.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm0 0v3m0 9v3m7.5-7.5h-3m-9 0h-3",
  history: "M4 12a8 8 0 1 0 2.35-5.65L4 8.5M4 4v4.5h4.5M12 8v4l3 2",
  user: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7.5 8a7.5 7.5 0 0 1 15 0",
  plus: "M12 5v14M5 12h14",
  key: "M15.5 8.5a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0ZM12 12v8m0-3h3m-3-2.5h2",
  back: "M15 5l-7 7 7 7",
  chevron: "M9 5l7 7-7 7",
  check: "M5 12.5l4.5 4.5L19 7.5",
  x: "M6 6l12 12M18 6 6 18",
  copy: "M8 8V5.5A1.5 1.5 0 0 1 9.5 4h9A1.5 1.5 0 0 1 20 5.5v9a1.5 1.5 0 0 1-1.5 1.5H16M4 9.5A1.5 1.5 0 0 1 5.5 8h9A1.5 1.5 0 0 1 16 9.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 4 18.5v-9Z",
  share: "M12 4v11m0-11L8 8m4-4 4 4M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13",
  dice: "M5.5 4h13A1.5 1.5 0 0 1 20 5.5v13a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-13A1.5 1.5 0 0 1 5.5 4Zm3 4h.01M15.5 8h.01M12 12h.01M8.5 16h.01M15.5 16h.01",
  cash: "M3 7.5h18v9H3v-9Zm9 6.5a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM6 10.5v3m12-3v3",
  wallet: "M4 7.5V17a2 2 0 0 0 2 2h13v-4m0-4V7H6a2 2 0 0 1 0-4h11v4M16 13h5v2h-5a1 1 0 0 1 0-2Z",
  calendar: "M5.5 5.5h13A1.5 1.5 0 0 1 20 7v11.5a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5V7a1.5 1.5 0 0 1 1.5-1.5ZM4 10h16M8.5 3.5v4m7-4v4",
  shield: "M12 3.5 19 6v5.5c0 4.2-2.9 7.6-7 9-4.1-1.4-7-4.8-7-9V6l7-2.5Zm-3 8.5 2 2 4-4",
  bell: "M6 16.5V11a6 6 0 1 1 12 0v5.5l1.5 2h-15l1.5-2Zm4 3.5a2 2 0 0 0 4 0",
  device: "M8 3.5h8A1.5 1.5 0 0 1 17.5 5v14a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 19V5A1.5 1.5 0 0 1 8 3.5Zm3 14h2",
  logout: "M14.5 8V5.5A1.5 1.5 0 0 0 13 4H5.5A1.5 1.5 0 0 0 4 5.5v13A1.5 1.5 0 0 0 5.5 20H13a1.5 1.5 0 0 0 1.5-1.5V16M10 12h10m0 0-3-3m3 3-3 3",
  edit: "M4 20h4L19 9l-4-4L4 16v4Zm9-13 4 4",
  arrowUp: "M12 19V5m0 0-6 6m6-6 6 6",
  arrowDown: "M12 5v14m0 0-6-6m6 6 6-6",
  info: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-5v-4.5m0-3h.01",
  alert: "M12 4 2.5 20h19L12 4Zm0 6v4.5m0 2.5h.01",
  users: "M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm-6.5 9a6.5 6.5 0 0 1 13 0M16 4.3a3.5 3.5 0 0 1 0 6.4M21.5 20a6.5 6.5 0 0 0-3.5-5.8",
  refresh: "M20 12a8 8 0 1 1-2.35-5.65L20 8.5M20 4v4.5h-4.5",
} as const;

export type IconName = keyof typeof paths;

export function Icon({ name, className = "size-5", ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props}>
      <path d={paths[name]} />
    </svg>
  );
}
