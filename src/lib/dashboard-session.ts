import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export async function requireDashboardRole(role: "customer" | "vendor") {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    redirect("/signin");
  }

  if (session.user.role !== role) {
    if (session.user.role === "customer" || session.user.role === "vendor") {
      redirect(`/dashboard/${session.user.role}`);
    }

    redirect("/");
  }

  return { name: session.user.name };
}
