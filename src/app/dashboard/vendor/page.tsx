import { Suspense } from "react";
import DashboardWelcome from "@/components/auth/dashboard-welcome";
import { requireDashboardRole } from "@/lib/dashboard-session";

export default function VendorDashboardPage() {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <VendorDashboard />
    </Suspense>
  );
}

async function VendorDashboard() {
  const user = await requireDashboardRole("vendor");
  return <DashboardWelcome name={user.name} role="vendor" />;
}

function DashboardFallback() {
  return (
    <main className="dashboard-welcome" aria-busy="true">
      <p className="eyebrow">Preparing your WedPlan space…</p>
    </main>
  );
}
