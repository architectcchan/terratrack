import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ManagerDashboard } from "@/components/dashboard/manager-dashboard";
import { RepDashboard } from "@/components/dashboard/rep-dashboard";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { firstName, role } = session.user;

  if (role === "admin" || role === "sales_manager") {
    return (
      <ManagerDashboard
        firstName={firstName}
        role={role}
      />
    );
  }

  return <RepDashboard firstName={firstName} role="sales_rep" />;
}
