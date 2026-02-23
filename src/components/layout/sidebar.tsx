"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { useSidebar } from "@/components/layout/sidebar-context";
import {
  LayoutDashboard,
  Building2,
  Kanban,
  MapPin,
  CheckSquare,
  Settings,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Accounts", href: "/dashboard/accounts", icon: Building2 },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: Kanban },
  { label: "Visits", href: "/dashboard/visits", icon: MapPin },
  { label: "Tasks", href: "/dashboard/tasks", icon: CheckSquare },
  // Hidden for now — add back later:
  // { label: "Samples", href: "/dashboard/samples", icon: FlaskConical },
  // { label: "Products", href: "/dashboard/products", icon: Package },
  // { label: "Routes", href: "/dashboard/routes", icon: Route },
  // { label: "Events", href: "/dashboard/events", icon: Calendar },
];

// const secondaryNavItems: NavItem[] = [
//   { label: "Reports", href: "/dashboard/reports", icon: BarChart3, adminOnly: true },
//   { label: "Team", href: "/dashboard/team", icon: Users, adminOnly: true },
// ];

const bottomNavItems: NavItem[] = [
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

interface SidebarProps {
  user: {
    firstName: string;
    lastName: string;
    email: string;
    role: "admin" | "sales_manager" | "sales_rep";
  };
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const { collapsed, toggle } = useSidebar();

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const roleLabel =
    user.role === "admin"
      ? "Admin"
      : user.role === "sales_manager"
        ? "Manager"
        : "Sales Rep";

  const initials = `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();

  function handleLogout() {
    signOut({ callbackUrl: "/login" });
  }

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-screen flex-col bg-[#1B4332] transition-all duration-300 md:flex",
          collapsed ? "w-[72px]" : "w-[280px]",
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-white/10 px-4",
            collapsed ? "justify-center" : "justify-between",
          )}
        >
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-1">
              <span className="text-xl font-bold text-white">
                Terra<span className="text-[#D4A843]">Track</span>
              </span>
            </Link>
          )}
          <button
            onClick={toggle}
            className="rounded-md p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {collapsed ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="space-y-1">
            {mainNavItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </ul>

          {/* Separator + secondary (Reports, Team — hidden for now) */}
          {/* {isManagerOrAdmin && (
            <>
              <div className="my-3 border-t border-white/10" />
              <ul className="space-y-1">
                {secondaryNavItems.map((item) => (
                  <NavLink
                    key={item.href}
                    item={item}
                    active={isActive(item.href)}
                    collapsed={collapsed}
                  />
                ))}
              </ul>
            </>
          )} */}

          <div className="my-3 border-t border-white/10" />
          <ul className="space-y-1">
            {bottomNavItems.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isActive(item.href)}
                collapsed={collapsed}
              />
            ))}
          </ul>
        </nav>

        {/* User section */}
        <div className="shrink-0 border-t border-white/10 p-3">
          <div
            className={cn(
              "flex items-center gap-3",
              collapsed && "justify-center",
            )}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#D4A843] text-sm font-semibold text-[#1B4332]">
              {initials}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-white/50">{roleLabel}</p>
              </div>
            )}
            {!collapsed && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={handleLogout}
                    className="rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <LogOut className="h-4 w-4" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top">
                  <p>Log out</p>
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={handleLogout}
                  className="mt-2 flex w-full items-center justify-center rounded-md p-1.5 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Log out</p>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavLink({
  item,
  active,
  collapsed,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
}) {
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        active
          ? "bg-[#D4A843] text-white"
          : "text-white/70 hover:bg-white/10 hover:text-white",
        collapsed && "justify-center px-2",
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      {!collapsed && <span>{item.label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <li>
        <Tooltip>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            <p>{item.label}</p>
          </TooltipContent>
        </Tooltip>
      </li>
    );
  }

  return <li>{link}</li>;
}
