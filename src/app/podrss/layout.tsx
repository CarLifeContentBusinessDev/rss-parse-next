import "@/app/podrss/podrss.css";
import { PodRssLayout } from "@/app/podrss/_lib/layouts/PodRssLayout";
import type { ReactNode } from "react";

export default function Layout({ children }: { children: ReactNode }) {
  return <PodRssLayout>{children}</PodRssLayout>;
}

