import type { DashboardRole } from "@/lib/dashboard-session";

export type DashboardIconName =
  | "overview"
  | "users"
  | "services"
  | "transactions"
  | "add"
  | "bookings"
  | "subscription"
  | "profile";

export type DashboardNavItem = {
  label: string;
  href: string;
  section: string;
  icon: DashboardIconName;
  description: string;
};

const dashboardRoots: Record<DashboardRole, string> = {
  admin: "/dashboard/admin",
  vendor: "/dashboard/vendor",
  customer: "/dashboard/customer",
};

export const dashboardNavigation: Record<DashboardRole, DashboardNavItem[]> = {
  admin: [
    {
      label: "Overview",
      href: dashboardRoots.admin,
      section: "",
      icon: "overview",
      description: "A clear view of your WedPlan platform.",
    },
    {
      label: "Manage Users",
      href: `${dashboardRoots.admin}/users`,
      section: "users",
      icon: "users",
      description: "Review and manage customer and vendor accounts.",
    },
    {
      label: "Manage Services",
      href: `${dashboardRoots.admin}/services`,
      section: "services",
      icon: "services",
      description: "Review wedding service listings across WedPlan.",
    },
    {
      label: "Transactions",
      href: `${dashboardRoots.admin}/transactions`,
      section: "transactions",
      icon: "transactions",
      description: "Keep track of platform transaction activity.",
    },
    {
      label: "Profile Settings",
      href: `${dashboardRoots.admin}/profile`,
      section: "profile",
      icon: "profile",
      description: "Manage your administrator account details.",
    },
  ],
  vendor: [
    {
      label: "Overview",
      href: dashboardRoots.vendor,
      section: "",
      icon: "overview",
      description: "A home for your wedding business on WedPlan.",
    },
    {
      label: "My Services",
      href: `${dashboardRoots.vendor}/services`,
      section: "services",
      icon: "services",
      description: "View and manage your wedding service listings.",
    },
    {
      label: "Add Service",
      href: `${dashboardRoots.vendor}/services/new`,
      section: "services/new",
      icon: "add",
      description: "Create a new listing for couples to discover.",
    },
    {
      label: "Booking Requests",
      href: `${dashboardRoots.vendor}/bookings`,
      section: "bookings",
      icon: "bookings",
      description: "Review new requests from couples.",
    },
    {
      label: "Subscription",
      href: `${dashboardRoots.vendor}/subscription`,
      section: "subscription",
      icon: "subscription",
      description: "Manage your WedPlan vendor subscription.",
    },
    {
      label: "Profile Settings",
      href: `${dashboardRoots.vendor}/profile`,
      section: "profile",
      icon: "profile",
      description: "Keep your business profile up to date.",
    },
  ],
  customer: [
    {
      label: "Overview",
      href: dashboardRoots.customer,
      section: "",
      icon: "overview",
      description: "Your wedding planning, all in one place.",
    },
    {
      label: "My Bookings",
      href: `${dashboardRoots.customer}/bookings`,
      section: "bookings",
      icon: "bookings",
      description: "Keep up with your vendor booking requests.",
    },
    {
      label: "Profile Settings",
      href: `${dashboardRoots.customer}/profile`,
      section: "profile",
      icon: "profile",
      description: "Manage your WedPlan account details.",
    },
  ],
};

export function getDashboardNavItem(
  role: DashboardRole,
  section: string,
): DashboardNavItem | undefined {
  return dashboardNavigation[role].find((item) => item.section === section);
}
