import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const dashboardRoles = ["admin", "vendor", "customer"] as const;
export type DashboardRole = (typeof dashboardRoles)[number];

function isDashboardRole(value: string): value is DashboardRole {
  return dashboardRoles.some((role) => role === value);
}

export async function requireDashboardRole(role: DashboardRole) {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect(`/signin?callbackURL=${encodeURIComponent(`/dashboard/${role}`)}`);
  }

  if (session.user.role !== role) {
    if (isDashboardRole(session.user.role)) {
      redirect(`/dashboard/${session.user.role}`);
    }

    redirect("/");
  }

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image,
    role,
  };
}
