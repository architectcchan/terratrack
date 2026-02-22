"use client";

import { cn } from "@/lib/utils";
import { useSidebar } from "@/components/layout/sidebar-context";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div
      className={cn(
        "flex flex-1 flex-col transition-all duration-300",
        collapsed ? "md:ml-[72px]" : "md:ml-[280px]",
      )}
    >
      {children}
    </div>
  );
}
