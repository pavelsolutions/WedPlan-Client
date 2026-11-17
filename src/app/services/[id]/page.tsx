import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import SiteFooter from "@/components/home/site-footer";
import SiteNavbar from "@/components/home/site-navbar";
import ServiceDetailPage, {
  ServiceDetailsSkeleton,
} from "@/components/services/service-detail-page";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Wedding Service Details | WedPlan",
  description:
    "Explore wedding service details and send a booking request to an approved WedPlan vendor.",
};

export default function ServiceDetailsRoute({
  params,
}: PageProps<"/services/[id]">) {
  return (
    <>
      <SiteNavbar />
      <Suspense fallback={<ServiceDetailsSkeleton />}>
        <ServiceDetailsContent params={params} />
      </Suspense>
      <SiteFooter />
    </>
  );
}

async function ServiceDetailsContent({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    const callbackURL = `/services/${encodeURIComponent(id)}`;
    redirect(`/signin?callbackURL=${encodeURIComponent(callbackURL)}`);
  }

  return (
    <ServiceDetailPage
      id={id}
      viewer={{
        id: session.user.id,
        role: session.user.role,
      }}
    />
  );
}
