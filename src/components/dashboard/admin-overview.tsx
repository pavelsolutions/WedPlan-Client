"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  CreditCard,
  Heart,
  ShieldCheck,
  Sparkles,
  UsersRound,
  UserRound,
} from "lucide-react";
import {
  fetchAdminOverview,
  type AdminOverviewStatistics,
} from "@/lib/admin-dashboard-api";
import { AdminFeedback } from "@/components/dashboard/admin-dashboard-ui";

type OverviewState = {
  key: number;
  statistics: AdminOverviewStatistics | null;
  error?: string;
};

const statisticCards = [
  { key: "totalUsers", label: "Registered users", icon: UsersRound, tone: "rose" },
  { key: "totalVendors", label: "Vendors", icon: BriefcaseBusiness, tone: "sage" },
  { key: "totalCustomers", label: "Customers", icon: Heart, tone: "amber" },
  { key: "totalServices", label: "Services", icon: Sparkles, tone: "slate" },
  { key: "pendingServices", label: "Pending services", icon: ShieldCheck, tone: "rose" },
  { key: "totalTransactions", label: "Transactions", icon: CreditCard, tone: "sage" },
] as const;

const adminSections = [
  {
    href: "/dashboard/admin/users",
    title: "Manage users",
    description: "Search accounts, review details, and manage access.",
    icon: UserRound,
  },
  {
    href: "/dashboard/admin/services",
    title: "Review services",
    description: "Moderate new listings and maintain availability.",
    icon: BriefcaseBusiness,
  },
  {
    href: "/dashboard/admin/transactions",
    title: "View transactions",
    description: "Check subscription payment activity and status.",
    icon: CreditCard,
  },
];

export default function AdminOverview() {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<OverviewState>({
    key: -1,
    statistics: null,
  });
  const isLoading = state.key !== retryCount;
  const statistics = isLoading ? null : state.statistics;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchAdminOverview(controller.signal)
      .then((result) => {
        if (!controller.signal.aborted) {
          setState({ key: retryCount, statistics: result });
        }
      })
      .catch((requestError: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key: retryCount,
          statistics: null,
          error:
            requestError instanceof Error
              ? requestError.message
              : "Platform statistics could not be loaded.",
        });
      });
    return () => controller.abort();
  }, [retryCount]);

  return (
    <section className="admin-overview">
      <div className="admin-overview__hero">
        <div>
          <span className="admin-overview__eyebrow">
            <ShieldCheck size={14} aria-hidden="true" />
            PLATFORM OVERVIEW
          </span>
          <h2>Every detail, in good hands.</h2>
          <p>
            Keep the WedPlan community thriving with a clear view of its people,
            services, and subscription activity.
          </p>
        </div>
        <div className="admin-overview__hero-art" aria-hidden="true">
          <span><Heart size={30} strokeWidth={1.4} /></span>
        </div>
      </div>

      <div className="admin-overview__section-heading">
        <div>
          <p className="eyebrow">THE WEDPLAN COMMUNITY</p>
          <h3>Platform at a glance</h3>
        </div>
        <span>Live platform totals</span>
      </div>

      {error ? (
        <AdminFeedback
          title="We couldn’t load the platform overview."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : (
        <div className="admin-stat-grid" aria-busy={isLoading}>
          {statisticCards.map(({ key, label, icon: Icon, tone }) => (
            <article
              className={`admin-stat-card admin-stat-card--${tone}`}
              key={key}
            >
              <span className="admin-stat-card__icon">
                <Icon size={17} aria-hidden="true" />
              </span>
              <strong className="admin-stat-card__value">
                {isLoading ? (
                  <span className="admin-stat-card__skeleton" />
                ) : (
                  statistics?.[key].toLocaleString() ?? "—"
                )}
              </strong>
              <span className="admin-stat-card__label">{label}</span>
            </article>
          ))}
        </div>
      )}

      <div className="admin-overview__section-heading">
        <div>
          <p className="eyebrow">ADMIN WORKSPACE</p>
          <h3>Go to a section</h3>
        </div>
      </div>
      <div className="admin-section-links">
        {adminSections.map(({ href, title, description, icon: Icon }) => (
          <Link className="admin-section-link" href={href} key={href}>
            <span className="admin-section-link__icon">
              <Icon size={18} aria-hidden="true" />
            </span>
            <span>
              <strong>{title}</strong>
              <small>{description}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
