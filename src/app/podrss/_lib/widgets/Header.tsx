import { Rss } from "lucide-react";

export const Header = () => {
  return (
    <header className="bg-surface/95 border-b border-white/10 text-slate-100 h-20 flex items-center pl-6 backdrop-blur">
      <div
        className="flex items-center text-3xl font-bold"
        style={{ fontFamily: "'Oxanium', sans-serif" }}
      >
        <Rss className="inline-block mr-2" />
        PodRSS
      </div>
    </header>
  );
};


