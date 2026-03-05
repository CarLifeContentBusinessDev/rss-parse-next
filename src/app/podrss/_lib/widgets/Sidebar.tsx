"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const PODRSS_ROUTES = {
  root: "/podrss",
  excelChannel: "/podrss/excel-channel",
  excelAppleId: "/podrss/excel-apple-id",
  manualChannel: "/podrss/manual-channel",
  manualAppleId: "/podrss/manual-apple-id",
  topPodcast: "/podrss/top-podcast",
} as const;

const PODRSS_NAV_ITEMS = [
  {
    id: "excel-channel",
    icon: "1",
    label: "엑셀 채널명",
    sub: "Apple ID + RSS 반환",
    path: PODRSS_ROUTES.excelChannel,
  },
  {
    id: "excel-apple-id",
    icon: "2",
    label: "엑셀 Apple ID",
    sub: "RSS 반환",
    path: PODRSS_ROUTES.excelAppleId,
  },
  {
    id: "manual-channel",
    icon: "3",
    label: "수동 채널명",
    sub: "Apple ID + RSS 반환",
    path: PODRSS_ROUTES.manualChannel,
  },
  {
    id: "manual-apple-id",
    icon: "4",
    label: "수동 Apple ID",
    sub: "RSS 반환",
    path: PODRSS_ROUTES.manualAppleId,
  },
  {
    id: "top-podcast",
    icon: "5",
    label: "Top Podcast",
    sub: "Apple ID + RSS 반환",
    path: PODRSS_ROUTES.topPodcast,
  },
] as const;

export const Sidebar = () => {
  const pathname = usePathname();

  return (
    <aside className="bg-surface-soft/85 flex w-60 shrink-0 flex-col border-r border-white/10 backdrop-blur">
      <nav className="flex flex-1 flex-col gap-5 p-2">
        {PODRSS_NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.path ||
            (item.path === PODRSS_ROUTES.excelChannel && pathname === PODRSS_ROUTES.root);

          return (
            <Link
              key={item.id}
              href={item.path}
              className={`w-full cursor-pointer rounded-lg border-l-2 no-underline transition-all duration-150 ${
                isActive
                  ? "border-key-color bg-surface"
                  : "border-transparent hover:bg-slate-700/50"
              } flex items-center gap-2.5`}
            >
              <span className="pl-2 text-base">{item.icon}</span>
              <div className="flex h-15 flex-col justify-center">
                <div
                  className={`text-m font-semibold ${
                    isActive ? "text-key-color" : "text-slate-300"
                  }`}
                >
                  {item.label}
                </div>
                <div className="mt-px text-sm text-slate-400">{item.sub}</div>
              </div>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
