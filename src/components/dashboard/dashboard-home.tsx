"use client";

import {
  Building2,
  Kanban,
  MapPin,
  FlaskConical,
  CheckSquare,
  Package,
  Route,
  Calendar,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const modules = [
  {
    title: "Accounts",
    description: "Manage dispensary accounts and contacts",
    icon: Building2,
    color: "bg-emerald-100 text-emerald-700",
  },
  {
    title: "Pipeline",
    description: "Track orders through every stage",
    icon: Kanban,
    color: "bg-blue-100 text-blue-700",
  },
  {
    title: "Visits",
    description: "Log store visits and check-ins",
    icon: MapPin,
    color: "bg-violet-100 text-violet-700",
  },
  {
    title: "Samples",
    description: "Track sample drops and feedback",
    icon: FlaskConical,
    color: "bg-pink-100 text-pink-700",
  },
  {
    title: "Tasks",
    description: "Follow-ups and to-do items",
    icon: CheckSquare,
    color: "bg-amber-100 text-amber-700",
  },
  {
    title: "Products",
    description: "Product catalog and inventory",
    icon: Package,
    color: "bg-orange-100 text-orange-700",
  },
  {
    title: "Routes",
    description: "Plan and optimize daily routes",
    icon: Route,
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    title: "Events",
    description: "Vendor days and popup events",
    icon: Calendar,
    color: "bg-rose-100 text-rose-700",
  },
];

interface DashboardHomeProps {
  firstName: string;
  role: "admin" | "sales_manager" | "sales_rep";
}

const roleLabels = {
  admin: "Admin",
  sales_manager: "Sales Manager",
  sales_rep: "Sales Rep",
};

export function DashboardHome({ firstName, role }: DashboardHomeProps) {
  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Welcome back, {firstName}!
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-[#1B4332]/10 text-[#1B4332]"
          >
            {roleLabels[role]}
          </Badge>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your TerraTrack overview
          </p>
        </div>
      </div>

      {/* Module cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {modules.map((mod) => {
          const Icon = mod.icon;
          return (
            <Card
              key={mod.title}
              className="transition-shadow hover:shadow-md"
            >
              <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${mod.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <CardTitle className="text-base">{mod.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>{mod.description}</CardDescription>
                <p className="mt-3 text-xs font-medium text-[#D4A843]">
                  Coming soon
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
