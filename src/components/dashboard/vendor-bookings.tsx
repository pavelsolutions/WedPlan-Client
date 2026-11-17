"use client";

import { useEffect, useState } from "react";
import {
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  fetchVendorBookings,
  updateVendorBookingStatus,
  type VendorBookingPage,
} from "@/lib/vendor-dashboard-api";
import {
  formatVendorDate,
  formatVendorEventDate,
  VendorEmptyState,
  VendorErrorState,
  VendorSkeletonCards,
  VendorStatusBadge,
} from "@/components/dashboard/vendor-dashboard-ui";

type BookingsState = {
  key: string;
  data: VendorBookingPage | null;
  error?: string;
};

export default function VendorBookings() {
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${retryCount}`;
  const [state, setState] = useState<BookingsState>({
    key: "",
    data: null,
  });
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const isLoading = state.key !== requestKey;
  const data = isLoading ? null : state.data;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchVendorBookings(page, 10, controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setState({ key: requestKey, data: response });
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            data: null,
            error:
              requestError instanceof Error
                ? requestError.message
                : "Booking requests could not be loaded.",
          });
        }
      });
    return () => controller.abort();
  }, [page, requestKey]);

  async function respond(bookingId: string, status: "accepted" | "rejected") {
    setUpdatingId(bookingId);
    try {
      await updateVendorBookingStatus(bookingId, status);
      setState((current) => ({
        ...current,
        data: current.data
          ? {
              ...current.data,
              bookings: current.data.bookings.map((booking) =>
                booking.id === bookingId ? { ...booking, status } : booking,
              ),
            }
          : current.data,
      }));
      toast.add({
        type: "success",
        title: status === "accepted" ? "Booking accepted" : "Request declined",
        description:
          status === "accepted"
            ? "The couple’s booking request is now accepted."
            : "The booking request has been declined.",
      });
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Booking response wasn’t saved",
        description:
          requestError instanceof Error
            ? requestError.message
            : "Please try again.",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  const pagination = data?.pagination;

  return (
    <section className="vendor-bookings-page">
      <div className="vendor-page-intro">
        <div>
          <p className="eyebrow">COUPLES ARE REACHING OUT</p>
          <h2>Booking requests</h2>
          <p>Review event details and respond to requests for your services.</p>
        </div>
      </div>

      {isLoading ? (
        <VendorSkeletonCards />
      ) : error ? (
        <VendorErrorState
          title="We couldn’t load booking requests."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : !data?.bookings.length ? (
        <VendorEmptyState
          title="No booking requests yet"
          message="When a couple requests one of your services, their event details and message will appear here."
        />
      ) : (
        <>
          <div className="vendor-bookings-summary" role="status">
            {pagination?.total} booking request{pagination?.total === 1 ? "" : "s"}
          </div>
          <div className="vendor-booking-list">
            {data.bookings.map((booking) => (
              <article className="vendor-booking-card" key={booking.id}>
                <div className="vendor-booking-card__top">
                  <Avatar className="vendor-booking-card__avatar">
                    {booking.customer.image ? (
                      <AvatarImage src={booking.customer.image} alt="" />
                    ) : null}
                    <AvatarFallback>
                      {booking.customer.name.slice(0, 1).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="vendor-booking-card__customer">
                    <strong>{booking.customer.name}</strong>
                    <small>{booking.customer.email ?? "WedPlan customer"}</small>
                  </div>
                  <VendorStatusBadge status={booking.status} />
                </div>
                <div className="vendor-booking-card__service">
                  {booking.service?.image ? (
                    <span
                      className="vendor-booking-card__image"
                      role="img"
                      aria-label={booking.service.name}
                      style={{ backgroundImage: `url("${booking.service.image}")` }}
                    />
                  ) : (
                    <span className="vendor-booking-card__image vendor-booking-card__image--empty">
                      <Building2 size={17} aria-hidden="true" />
                    </span>
                  )}
                  <span>
                    <small>Requested service</small>
                    <strong>{booking.service?.name ?? "Service listing unavailable"}</strong>
                  </span>
                </div>
                <div className="vendor-booking-card__details">
                  <span><CalendarDays size={15} aria-hidden="true" /><small>Event date</small><strong>{formatVendorEventDate(booking.eventDate)}</strong></span>
                  <span><MapPin size={15} aria-hidden="true" /><small>Event location</small><strong>{booking.eventLocation || "Not provided"}</strong></span>
                </div>
                {booking.message ? (
                  <div className="vendor-booking-card__message">
                    <MessageCircle size={15} aria-hidden="true" />
                    <p>{booking.message}</p>
                  </div>
                ) : null}
                <div className="vendor-booking-card__footer">
                  <small>Requested {formatVendorDate(booking.createdAt)}</small>
                  {booking.status === "pending" ? (
                    <div className="vendor-booking-card__actions">
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={updatingId !== null}
                        onClick={() => void respond(booking.id, "rejected")}
                      >
                        <X size={14} aria-hidden="true" />
                        Decline
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={updatingId !== null}
                        onClick={() => void respond(booking.id, "accepted")}
                      >
                        <Check size={14} aria-hidden="true" />
                        {updatingId === booking.id ? "Saving…" : "Accept request"}
                      </Button>
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
          {pagination && pagination.totalPages > 1 ? (
            <nav className="vendor-pagination" aria-label="Booking request pages">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={14} aria-hidden="true" /> Previous
              </Button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next <ChevronRight size={14} aria-hidden="true" />
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
