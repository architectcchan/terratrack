"use client";

import Link from "next/link";
import {
  MapPin,
  CheckSquare,
  DollarSign,
  FlaskConical,
  Building2,
  ArrowRight,
  Kanban,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface RepDashboardProps {
  firstName: string;
  role: "sales_rep";
}

const quickLinks = [
  {
    title: "Log a Visit",
    description: "Check in at a store and record your visit notes",
    href: "/dashboard/visits",
    icon: MapPin,
    color: "bg-violet-100 text-violet-700",
    cta: "Log Visit",
  },
  {
    title: "My Tasks",
    description: "View and complete your open follow-ups",
    href: "/dashboard/tasks",
    icon: CheckSquare,
    color: "bg-amber-100 text-amber-700",
    cta: "View Tasks",
  },
  {
    title: "My Pipeline",
    description: "Track your active orders through every stage",
    href: "/dashboard/pipeline",
    icon: Kanban,
    color: "bg-blue-100 text-blue-700",
    cta: "View Pipeline",
  },
  {
    title: "Samples",
    description: "Track sample drops and follow up on feedback",
    href: "/dashboard/samples",
    icon: FlaskConical,
    color: "bg-pink-100 text-pink-700",
    cta: "View Samples",
  },
  {
    title: "Accounts",
    description: "Browse your assigned dispensary accounts",
    href: "/dashboard/accounts",
    icon: Building2,
    color: "bg-emerald-100 text-emerald-700",
    cta: "View Accounts",
  },
  {
    title: "Revenue",
    description: "See your paid orders and monthly performance",
    href: "/dashboard/pipeline?stage=paid",
    icon: DollarSign,
    color: "bg-green-100 text-green-700",
    cta: "View Revenue",
  },
];

export function RepDashboard({ firstName }: RepDashboardProps) {
  const dayOfWeek = new Date().toLocaleDateString("en-US", { weekday: "long" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
          Good {getGreeting()}, {firstName}!
        </h2>
        <div className="mt-1 flex items-center gap-2">
          <Badge variant="secondary" className="bg-[#1B4332]/10 text-[#1B4332]">
            Sales Rep
          </Badge>
          <p className="text-sm text-muted-foreground">
            {dayOfWeek} — let&apos;s have a great day in the field
          </p>
        </div>
      </div>

      {/* Quick action banner */}
      <Card className="border-[#1B4332]/20 bg-gradient-to-r from-[#1B4332] to-[#2d6a4f] text-white">
        <CardContent className="flex items-center justify-between p-5">
          <div>
            <p className="font-semibold">Ready to hit the road?</p>
            <p className="mt-0.5 text-sm text-white/75">
              Plan today&apos;s route and optimize your stops
            </p>
          </div>
          <Button
            asChild
            size="sm"
            className="shrink-0 bg-[#D4A843] text-[#1B4332] hover:bg-[#D4A843]/90 font-semibold"
          >
            <Link href="/dashboard/routes">
              Plan Route <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Quick Links Grid */}
      <div>
        <h3 className="mb-3 text-sm font-semibold text-gray-700">Quick Access</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {quickLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Card
                key={item.title}
                className="transition-shadow hover:shadow-md"
              >
                <CardHeader className="flex flex-row items-center gap-3 space-y-0 pb-2">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <CardTitle className="text-sm font-semibold">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {item.description}
                  </p>
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-7 px-0 text-xs font-semibold text-[#1B4332] hover:text-[#1B4332]/80"
                  >
                    <Link href={item.href}>
                      {item.cta} <ArrowRight className="ml-1 h-3 w-3" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "afternoon";
  return "evening";
}
