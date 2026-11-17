import { Suspense, type ReactNode } from "react";
import DashboardLayout, {
  type DashboardUser,
} from "@/components/dashboard/dashboard-layout";
import {
  requireDashboardRole,
  type DashboardRole,
} from "@/lib/dashboard-session";

type RoleDashboardLayoutProps = {
  role: DashboardRole;
  children: ReactNode;
};

export default function RoleDashboardLayout({
  role,
  children,
}: RoleDashboardLayoutProps) {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <AuthenticatedDashboard role={role}>{children}</AuthenticatedDashboard>
    </Suspense>
  );
}

async function AuthenticatedDashboard({
  role,
  children,
}: RoleDashboardLayoutProps) {
  const user = await requireDashboardRole(role);
  const dashboardUser: DashboardUser = {
    name: user.name,
    email: user.email,
    image: user.image ?? null,
  };

  return (
    <DashboardLayout role={role} user={dashboardUser}>
      {children}
    </DashboardLayout>
  );
}

function DashboardLoading() {
  return (
    <div className="dashboard-loading" aria-busy="true">
      <div className="dashboard-loading__sidebar" />
      <div className="dashboard-loading__main">
        <div className="dashboard-loading__header" />
        <div className="dashboard-loading__content" />
      </div>
      <span className="sr-only">Preparing your WedPlan dashboard…</span>
    </div>
  );
}
