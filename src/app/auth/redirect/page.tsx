import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default function AuthRedirectPage() {
  return (
    <Suspense fallback={null}>
      <ResolveAuthRedirect />
    </Suspense>
  );
}

async function ResolveAuthRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    return redirect("/signin");
  }

  if (
    session.user.role === "admin" ||
    session.user.role === "customer" ||
    session.user.role === "vendor"
  ) {
    return redirect(`/dashboard/${session.user.role}`);
  }

  return redirect("/");
}
