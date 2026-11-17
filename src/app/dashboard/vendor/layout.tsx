import type { ReactNode } from "react";
import RoleDashboardLayout from "@/components/dashboard/role-dashboard-layout";

export default function VendorLayout({ children }: { children: ReactNode }) {
  return <RoleDashboardLayout role="vendor">{children}</RoleDashboardLayout>;
}
