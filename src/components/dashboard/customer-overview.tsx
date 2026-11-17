"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  RefreshCw,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import DashboardWelcome from "@/components/auth/dashboard-welcome";
import {
  fetchCustomerBookings,
  type CustomerBookingsResult,
} from "@/lib/customer-dashboard-api";

type OverviewState = {
  key: number;
  result: CustomerBookingsResult | null;
  error: string | null;
};

const statisticCards = [
  {
    key: "totalBookingRequests",
    label: "Total Booking Requests",
    icon: CalendarDays,
    tone: "rose",
  },
  {
    key: "pendingBookings",
    label: "Pending Bookings",
    icon: Clock3,
    tone: "amber",
  },
  {
    key: "acceptedBookings",
    label: "Accepted Bookings",
    icon: CheckCircle2,
    tone: "sage",
  },
  {
    key: "rejectedBookings",
    label: "Rejected Bookings",
    icon: XCircle,
    tone: "slate",
  },
] as const;

function formatShortDate(value: string | null) {
  if (!value) return "Date not set";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Date not set";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export default function CustomerOverview() {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<OverviewState>({
    key: -1,
    result: null,
    error: null,
  });
  const isLoading = state.key !== retryCount;
  const result = isLoading ? null : state.result;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();

    void fetchCustomerBookings(1, 3, controller.signal)
      .then((result) => setState({ key: retryCount, result, error: null }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key: retryCount,
          result: null,
          error:
            error instanceof Error
              ? error.message
              : "Booking statistics could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [retryCount]);

  const statistics = result?.statistics;

  return (
    <div className="customer-dashboard-overview">
      <section
        className="customer-booking-stats"
        aria-label="Booking statistics"
        aria-busy={isLoading}
      >
        {statisticCards.map((card) => {
          const Icon = card.icon;
          const value = statistics?.[card.key];

          return (
            <article
              className={`customer-booking-stat customer-booking-stat--${card.tone}`}
              key={card.key}
            >
              <span className="customer-booking-stat__icon">
                <Icon size={18} aria-hidden="true" />
              </span>
              <span className="customer-booking-stat__value">
                {isLoading ? <span className="customer-booking-stat__skeleton" /> : value ?? "—"}
              </span>
              <span className="customer-booking-stat__label">{card.label}</span>
            </article>
          );
        })}
      </section>

      {error ? (
        <div className="customer-dashboard-message customer-dashboard-message--error" role="alert">
          <div>
            <strong>We couldn’t load your booking overview.</strong>
            <p>{error}</p>
          </div>
          <Button
            variant="outline"
            type="button"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : null}

      {!isLoading && !error && result?.pagination.total === 0 ? (
        <div className="customer-dashboard-empty" role="status">
          <span>
            <CalendarDays size={21} aria-hidden="true" />
          </span>
          <div>
            <strong>Your wedding story starts with a first request.</strong>
            <p>Explore approved services and reach out to a vendor when you’re ready.</p>
          </div>
          <Link href="/services">
            Browse services <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      ) : null}

      {!isLoading && !error && result && result.pagination.total > 0 ? (
        <section className="customer-recent-bookings" aria-labelledby="recent-bookings-title">
          <div className="customer-recent-bookings__heading">
            <div>
              <p className="eyebrow">KEEP IN THE LOOP</p>
              <h2 id="recent-bookings-title">Recent requests</h2>
            </div>
            <Link href="/dashboard/customer/bookings">
              All bookings <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="customer-recent-bookings__list">
            {result.bookings.map((booking) => (
              <article className="customer-recent-booking" key={booking.id}>
                <span className={`customer-booking-status customer-booking-status--${booking.status}`}>
                  {booking.status}
                </span>
                <strong>{booking.service?.name ?? "Service listing unavailable"}</strong>
                <span>{booking.vendor.name}</span>
                <small>Event {formatShortDate(booking.eventDate)}</small>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      <DashboardWelcome role="customer" />
    </div>
  );
}
