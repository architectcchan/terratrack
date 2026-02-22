"use client";

import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Search, LogOut, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationBell } from "@/components/layout/notification-panel";

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/accounts": "Accounts",
  "/dashboard/pipeline": "Pipeline",
  "/dashboard/visits": "Visits",
  "/dashboard/samples": "Samples",
  "/dashboard/tasks": "Tasks",
  "/dashboard/products": "Products",
  "/dashboard/routes": "Routes",
  "/dashboard/events": "Events",
  "/dashboard/reports": "Reports",
  "/dashboard/team": "Team",
  "/dashboard/settings": "Settings",
};

interface TopbarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();

  const pageTitle =
    Object.entries(pageTitles).find(([path]) =>
      pathname === path || (path !== "/dashboard" && pathname.startsWith(path))
    )?.[1] ?? "Dashboard";

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-4 border-b bg-white px-4 md:px-6">
      {/* Page title */}
      <h1 className="text-lg font-semibold text-gray-900 md:text-xl">
        {pageTitle}
      </h1>

      {/* Search */}
      <div className="mx-auto hidden w-full max-w-md md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search accounts, contacts, orders..."
            className="h-9 pl-9 pr-12 text-sm"
            readOnly
          />
          <kbd className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-400">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <NotificationBell />

        {/* User dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex h-9 w-9 items-center justify-center rounded-full bg-[#1B4332] text-xs font-semibold text-white transition-opacity hover:opacity-90">
              {initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {user.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                Profile
              </a>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <a href="/dashboard/settings" className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </a>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="cursor-pointer text-red-600 focus:text-red-600"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
