"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Crown,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  fetchVendorOverview,
  type VendorOverview,
} from "@/lib/vendor-dashboard-api";
import { VendorErrorState } from "@/components/dashboard/vendor-dashboard-ui";

type OverviewState = {
  key: number;
  data: VendorOverview | null;
  error?: string;
};

const statisticCards = [
  { key: "totalServices", label: "Total Services", icon: BriefcaseBusiness, tone: "rose" },
  { key: "activeServices", label: "Active Services", icon: BadgeCheck, tone: "sage" },
  { key: "pendingBookingRequests", label: "Pending Booking Requests", icon: CalendarClock, tone: "amber" },
  { key: "acceptedBookings", label: "Accepted Bookings", icon: CheckCircle2, tone: "slate" },
] as const;

export default function VendorOverview() {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<OverviewState>({
    key: -1,
    data: null,
  });
  const isLoading = state.key !== retryCount;
  const data = isLoading ? null : state.data;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchVendorOverview(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setState({ key: retryCount, data: response });
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: retryCount,
            data: null,
            error:
              requestError instanceof Error
                ? requestError.message
                : "Your vendor overview could not be loaded.",
          });
        }
      });
    return () => controller.abort();
  }, [retryCount]);

  const plan = data?.subscription;
  const stats = data?.statistics;

  return (
    <div className="vendor-overview">
      <section className="vendor-overview__welcome">
        <span className="vendor-overview__welcome-icon">
          <Sparkles size={20} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">YOUR WEDPLAN STUDIO</p>
          <h2>Build a business couples remember.</h2>
          <p>Keep your listings polished and make every new booking request count.</p>
        </div>
        <Link className="vendor-overview__add-service" href="/dashboard/vendor/services/new">
          <Plus size={15} aria-hidden="true" />
          Add a service
        </Link>
        <span className="vendor-overview__welcome-art" aria-hidden="true" />
      </section>

      {error ? (
        <VendorErrorState
          title="We couldn’t load your overview."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : null}

      <section
        className="vendor-overview__stats"
        aria-label="Vendor dashboard statistics"
        aria-busy={isLoading}
      >
        {statisticCards.map((card) => {
          const Icon = card.icon;
          return (
            <article
              className={`vendor-stat-card vendor-stat-card--${card.tone}`}
              key={card.key}
            >
              <span className="vendor-stat-card__icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <strong className="vendor-stat-card__value">
                {isLoading ? <span className="vendor-stat-skeleton" /> : stats?.[card.key] ?? "—"}
              </strong>
              <span className="vendor-stat-card__label">{card.label}</span>
            </article>
          );
        })}
      </section>

      <section className="vendor-plan-banner">
        <span className="vendor-plan-banner__icon">
          <Crown size={22} aria-hidden="true" />
        </span>
        <div>
          <p className="eyebrow">YOUR CURRENT PLAN</p>
          <h2>
            {isLoading
              ? "Checking your plan…"
              : error
                ? "Plan unavailable"
                : `${plan?.plan === "premium" ? "Premium" : "Free"} plan`}
          </h2>
          <p>
            {isLoading || error
              ? "Your listing allowance will appear when account data is available."
              : plan?.activeServiceLimit === null
                ? "You can keep as many active services as your business needs."
                : `${stats?.activeServices ?? 0} of ${plan?.activeServiceLimit ?? 3} active services used.`}
          </p>
        </div>
        <Link href="/dashboard/vendor/subscription">
          Manage subscription <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </section>

      <section className="vendor-overview__next">
        <div className="vendor-overview__section-heading">
          <div>
            <p className="eyebrow">YOUR BUSINESS, AT A GLANCE</p>
            <h2>Make room for what’s next</h2>
          </div>
        </div>
        <div className="vendor-overview__quick-links">
          <Link href="/dashboard/vendor/services">
            <span><BriefcaseBusiness size={17} aria-hidden="true" /></span>
            <div><strong>Manage your listings</strong><small>Update details and availability</small></div>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
          <Link href="/dashboard/vendor/bookings">
            <span><CalendarClock size={17} aria-hidden="true" /></span>
            <div><strong>Review booking requests</strong><small>Respond to couples planning their day</small></div>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </section>
    </div>
  );
}
