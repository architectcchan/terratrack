"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Building2,
  Kanban,
  Plus,
  MoreHorizontal,
  CheckSquare,
  Settings,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

const moreNavItems = [
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
  // Hidden for now — add back later:
  // { label: "Samples", href: "/dashboard/samples", icon: FlaskConical },
  // { label: "Products", href: "/dashboard/products", icon: Package },
  // { label: "Routes", href: "/dashboard/routes", icon: Route },
  // { label: "Events", href: "/dashboard/events", icon: Calendar },
  // { label: "Reports", href: "/dashboard/reports", icon: BarChart3 },
  // { label: "Team", href: "/dashboard/team", icon: Users },
];

export function MobileNav() {
  const pathname = usePathname();
  const [sheetOpen, setSheetOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white md:hidden">
        <div className="flex h-16 items-center justify-around px-2">
          {/* Dashboard */}
          <Link
            href="/dashboard"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1",
              isActive("/dashboard") && pathname === "/dashboard"
                ? "text-[#1B4332]"
                : "text-gray-400",
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Accounts */}
          <Link
            href="/dashboard/accounts"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1",
              isActive("/dashboard/accounts")
                ? "text-[#1B4332]"
                : "text-gray-400",
            )}
          >
            <Building2 className="h-5 w-5" />
            <span className="text-[10px] font-medium">Accounts</span>
          </Link>

          {/* Log Visit FAB */}
          <Link
            href="/dashboard/visits"
            className="flex flex-col items-center gap-0.5"
          >
            <div className="-mt-5 flex h-12 w-12 items-center justify-center rounded-full bg-[#D4A843] shadow-lg shadow-[#D4A843]/30 transition-transform active:scale-95">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <span className="text-[10px] font-medium text-[#D4A843]">
              Visit
            </span>
          </Link>

          {/* Pipeline */}
          <Link
            href="/dashboard/pipeline"
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1",
              isActive("/dashboard/pipeline")
                ? "text-[#1B4332]"
                : "text-gray-400",
            )}
          >
            <Kanban className="h-5 w-5" />
            <span className="text-[10px] font-medium">Pipeline</span>
          </Link>

          {/* More */}
          <button
            onClick={() => setSheetOpen(true)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1",
              sheetOpen ? "text-[#1B4332]" : "text-gray-400",
            )}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      {/* More sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl pb-8">
          <SheetHeader>
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <nav className="grid grid-cols-3 gap-2 px-4 pb-4">
            {moreNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSheetOpen(false)}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl px-2 py-3 text-center transition-colors",
                    isActive(item.href)
                      ? "bg-[#1B4332]/10 text-[#1B4332]"
                      : "text-gray-600 hover:bg-gray-50",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-xs font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>
          <div className="border-t px-4 pt-4">
            <button
              onClick={() => {
                setSheetOpen(false);
                signOut({ callbackUrl: "/login" });
              }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
