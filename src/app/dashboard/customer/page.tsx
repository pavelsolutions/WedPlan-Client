import { Suspense } from "react";
import DashboardWelcome from "@/components/auth/dashboard-welcome";
import { requireDashboardRole } from "@/lib/dashboard-session";

export default function CustomerDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <CustomerDashboard />
    </Suspense>
  );
}

async function CustomerDashboard() {
  const user = await requireDashboardRole("customer");
  return <DashboardWelcome name={user.name} role="customer" />;
}

function DashboardFallback() {
  return (
    <main className="dashboard-welcome" aria-busy="true">
      <p className="eyebrow">Preparing your WedPlan space…</p>
    </main>
  );
}
