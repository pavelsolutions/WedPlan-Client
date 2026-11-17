import type { ReactNode } from "react";
import RoleDashboardLayout from "@/components/dashboard/role-dashboard-layout";

export default function CustomerLayout({ children }: { children: ReactNode }) {
  return <RoleDashboardLayout role="customer">{children}</RoleDashboardLayout>;
}
