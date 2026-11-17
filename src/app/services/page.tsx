import type { Metadata } from "next";
import { Suspense } from "react";
import SiteFooter from "@/components/home/site-footer";
import SiteNavbar from "@/components/home/site-navbar";
import ServicesBrowser, {
  ServicesGridSkeleton,
} from "@/components/services/services-browser";

export const metadata: Metadata = {
  title: "Browse Wedding Services | WedPlan",
  description:
    "Find approved wedding photographers, venues, florists, caterers, makeup artists, and fashion professionals on WedPlan.",
};

export default function ServicesPage() {
  return (
    <>
      <SiteNavbar />
      <Suspense
        fallback={
          <main className="services-page">
            <section className="page-container services-content">
              <ServicesGridSkeleton />
            </section>
          </main>
        }
      >
        <ServicesBrowser />
      </Suspense>
      <SiteFooter />
    </>
  );
}
