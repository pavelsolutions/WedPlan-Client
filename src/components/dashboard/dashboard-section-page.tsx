import Link from "next/link";
import { ArrowLeft, CircleDashed } from "lucide-react";
import { notFound } from "next/navigation";
import type { DashboardRole } from "@/lib/dashboard-session";
import { getDashboardNavItem } from "@/lib/dashboard-navigation";

type DashboardSectionPageProps = {
  role: DashboardRole;
  section: string;
};

export default function DashboardSectionPage({
  role,
  section,
}: DashboardSectionPageProps) {
  const item = getDashboardNavItem(role, section);

  if (!item || !section) notFound();

  return (
    <section className="dashboard-section-page">
      <div className="dashboard-section-page__intro">
        <p className="eyebrow">{role.toUpperCase()} WORKSPACE</p>
        <h2>{item.label}</h2>
        <p>{item.description}</p>
      </div>
      <div className="dashboard-section-empty" role="status">
        <span className="dashboard-section-empty__icon">
          <CircleDashed size={23} aria-hidden="true" />
        </span>
        <h3>This workspace is ready for its next step.</h3>
        <p>
          The {item.label.toLowerCase()} tools are not available yet. You can
          return to your overview while this section is being prepared.
        </p>
        <Link href={`/dashboard/${role}`}>
          <ArrowLeft size={15} aria-hidden="true" />
          Back to overview
        </Link>
      </div>
    </section>
  );
}
