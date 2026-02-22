"use client";

import Link from "next/link";
import { Building2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AccountsEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-white py-16">
      <div className="mb-4 flex size-16 items-center justify-center rounded-full bg-[#F8FAFC]">
        <Building2 className="size-8 text-muted-foreground" />
      </div>
      <h3 className="mb-1 text-lg font-semibold text-foreground">
        No dispensary accounts yet
      </h3>
      <p className="mb-6 max-w-sm text-center text-sm text-muted-foreground">
        Add your first account to start tracking your sales pipeline
      </p>
      <Button
        asChild
        className="gap-2 bg-[#D4A843] text-white hover:bg-[#C49933]"
      >
        <Link href="/dashboard/accounts/new">
          <Plus className="size-4" />
          Add Account
        </Link>
      </Button>
    </div>
  );
}
