"use client";

import type { ReactNode } from "react";
import { Toaster } from "react-hot-toast";
import { Header } from "@/app/podrss/_lib/widgets/Header";
import { Sidebar } from "@/app/podrss/_lib/widgets/Sidebar";

interface PodRssLayoutProps {
  children: ReactNode;
}

export const PodRssLayout = ({ children }: PodRssLayoutProps) => (
  <div className="podrss-root flex h-screen flex-col">
    <Toaster
      position="top-right"
      toastOptions={{
        style: {
          fontSize: "14px",
        },
      }}
    />
    <Header />
    <div className="flex flex-1 overflow-hidden">
      <Sidebar />
      <main className="scrollbar scrollbar-thumb-slate-600 scrollbar-track-slate-900/70 flex-1 overflow-auto bg-black/10 p-10">
        {children}
      </main>
    </div>
  </div>
);


