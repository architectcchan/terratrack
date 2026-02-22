import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SessionProvider } from "@/components/layout/session-provider";
import { SidebarProvider } from "@/components/layout/sidebar-context";
import { Sidebar } from "@/components/layout/sidebar";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Topbar } from "@/components/layout/topbar";
import { MobileNav } from "@/components/layout/mobile-nav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const user = {
    firstName: session.user.firstName,
    lastName: session.user.lastName,
    email: session.user.email ?? "",
    role: session.user.role,
  };

  return (
    <SessionProvider>
      <SidebarProvider>
        <div className="flex h-screen overflow-hidden bg-[#F8FAFC]">
          <Sidebar user={user} />
          <DashboardShell>
            <Topbar user={user} />
            <main className="flex-1 overflow-y-auto p-4 pb-20 md:p-6 md:pb-6">
              {children}
            </main>
          </DashboardShell>
          <MobileNav />
        </div>
      </SidebarProvider>
    </SessionProvider>
  );
}
