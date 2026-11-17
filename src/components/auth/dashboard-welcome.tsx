import Link from "next/link";
import { ArrowRight, Heart, Sparkles } from "lucide-react";
import type { DashboardRole } from "@/lib/dashboard-session";
import { dashboardNavigation } from "@/lib/dashboard-navigation";

type DashboardWelcomeProps = {
  role: DashboardRole;
};

const welcomeCopy: Record<
  DashboardRole,
  { eyebrow: string; title: string; description: string; action: string; href: string }
> = {
  admin: {
    eyebrow: "PLATFORM OVERVIEW",
    title: "Keep every WedPlan detail in good hands.",
    description:
      "Manage members, review service listings, and keep an eye on platform activity from one workspace.",
    action: "Manage users",
    href: "/dashboard/admin/users",
  },
  vendor: {
    eyebrow: "YOUR VENDOR SPACE",
    title: "Let the right couples find your work.",
    description:
      "Showcase your services, keep your business profile current, and stay close to the requests coming your way.",
    action: "Add a service",
    href: "/dashboard/vendor/services/new",
  },
  customer: {
    eyebrow: "YOUR WEDPLAN",
    title: "Your day, your way.",
    description:
      "Explore trusted wedding professionals and keep the details that matter to your celebration in one place.",
    action: "Explore wedding services",
    href: "/services",
  },
};

export default function DashboardWelcome({ role }: DashboardWelcomeProps) {
  const copy = welcomeCopy[role];
  const quickLinks = dashboardNavigation[role].slice(1);

  return (
    <section className="dashboard-overview">
      <div className="dashboard-overview__hero">
        <div className="dashboard-overview__hero-copy">
          <span className="dashboard-overview__eyebrow">
            {role === "customer" ? (
              <Heart size={14} aria-hidden="true" />
            ) : (
              <Sparkles size={14} aria-hidden="true" />
            )}
            {copy.eyebrow}
          </span>
          <h2>{copy.title}</h2>
          <p>{copy.description}</p>
          <Link className="dashboard-overview__action" href={copy.href}>
            {copy.action}
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <div className="dashboard-overview__art" aria-hidden="true">
          <span className="dashboard-overview__art-ring" />
          <span className="dashboard-overview__art-center">
            <Heart size={42} strokeWidth={1.2} />
          </span>
          <span className="dashboard-overview__art-sparkle dashboard-overview__art-sparkle--one">
            ✦
          </span>
          <span className="dashboard-overview__art-sparkle dashboard-overview__art-sparkle--two">
            ✧
          </span>
        </div>
      </div>

      <div className="dashboard-overview__section-heading">
        <div>
          <p className="eyebrow">YOUR WORKSPACE</p>
          <h3>Quick access</h3>
        </div>
        <span>{quickLinks.length} sections</span>
      </div>

      <div className="dashboard-quick-links">
        {quickLinks.map((item) => (
          <Link
            className="dashboard-quick-link"
            href={item.href}
            key={item.href}
          >
            <span className="dashboard-quick-link__icon">
              <Heart size={17} aria-hidden="true" />
            </span>
            <span className="dashboard-quick-link__copy">
              <strong>{item.label}</strong>
              <small>{item.description}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
