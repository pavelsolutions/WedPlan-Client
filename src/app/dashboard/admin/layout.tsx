import type { ReactNode } from "react";
import RoleDashboardLayout from "@/components/dashboard/role-dashboard-layout";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <RoleDashboardLayout role="admin">{children}</RoleDashboardLayout>;
}
