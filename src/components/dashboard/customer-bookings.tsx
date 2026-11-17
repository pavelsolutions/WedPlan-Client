"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Eye,
  MapPin,
  RefreshCw,
  X,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import {
  cancelCustomerBooking,
  fetchCustomerBookings,
  type CustomerBooking,
  type CustomerBookingsResult,
} from "@/lib/customer-dashboard-api";

type BookingsState = {
  key: string;
  result: CustomerBookingsResult | null;
  error?: string;
};

function formatEventDate(value: string | null) {
  if (!value) return "Date not set";
  const datePart = value.slice(0, 10);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart);
  if (!match) return "Date not set";
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return Number.isNaN(date.getTime())
    ? "Date not set"
    : new Intl.DateTimeFormat("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function formatRequestDate(value: string | null) {
  if (!value) return "Date unavailable";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Date unavailable"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}

function getStatusTone(status: string) {
  return ["pending", "accepted", "rejected", "cancelled"].includes(status)
    ? status
    : "unknown";
}

function getStatusLabel(status: string) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function BookingDetails({ booking }: { booking: CustomerBooking }) {
  return (
    <DialogContent className="customer-booking-dialog">
      <DialogHeader>
        <p className="eyebrow">BOOKING REQUEST</p>
        <DialogTitle>
          {booking.service?.name ?? "Service listing unavailable"}
        </DialogTitle>
        <DialogDescription>
          Review your event details and the status of this request.
        </DialogDescription>
      </DialogHeader>
      <div className="customer-booking-dialog__details">
        <div>
          <CalendarDays size={17} aria-hidden="true" />
          <span>
            <small>Event date</small>
            <strong>{formatEventDate(booking.eventDate)}</strong>
          </span>
        </div>
        <div>
          <MapPin size={17} aria-hidden="true" />
          <span>
            <small>Event location</small>
            <strong>{booking.eventLocation || "Location not provided"}</strong>
          </span>
        </div>
        <div>
          <Building2 size={17} aria-hidden="true" />
          <span>
            <small>Vendor</small>
            <strong>{booking.vendor.name}</strong>
          </span>
        </div>
        <div>
          <CalendarDays size={17} aria-hidden="true" />
          <span>
            <small>Requested on</small>
            <strong>{formatRequestDate(booking.createdAt)}</strong>
          </span>
        </div>
        <div className="customer-booking-dialog__message">
          <small>Your message</small>
          <p>{booking.message || "No message was included with this request."}</p>
        </div>
      </div>
    </DialogContent>
  );
}

function BookingCard({
  booking,
  onCancelled,
}: {
  booking: CustomerBooking;
  onCancelled: (bookingId: string) => void;
}) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleCancel(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsCancelling(true);
    setCancelError(null);
    try {
      await cancelCustomerBooking(booking.id);
      onCancelled(booking.id);
      setCancelOpen(false);
      toast.add({
        type: "success",
        title: "Booking cancelled",
        description: "Your pending booking request has been cancelled.",
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "This booking could not be cancelled. Please try again.";
      setCancelError(message);
      toast.add({
        type: "error",
        title: "Couldn’t cancel booking",
        description: message,
      });
    } finally {
      setIsCancelling(false);
    }
  }

  const serviceName = booking.service?.name ?? "Service listing unavailable";
  const statusTone = getStatusTone(booking.status);
  const image = booking.service?.image;

  return (
    <article className="customer-booking-card">
      <div
        className={`customer-booking-card__image${image ? "" : " customer-booking-card__image--empty"}`}
        role="img"
        aria-label={`${serviceName} service`}
        style={image ? { backgroundImage: `url("${image}")` } : undefined}
      >
        {!image ? <CalendarDays size={25} aria-hidden="true" /> : null}
      </div>
      <div className="customer-booking-card__body">
        <div className="customer-booking-card__heading">
          <div className="customer-booking-card__title">
            <span className="customer-booking-card__category">
              {booking.service?.category || "Wedding service"}
            </span>
            <h2>{serviceName}</h2>
            <p>
              <Building2 size={14} aria-hidden="true" />
              {booking.vendor.name}
            </p>
          </div>
          <span className={`customer-booking-status customer-booking-status--${statusTone}`}>
            {getStatusLabel(booking.status)}
          </span>
        </div>

        <div className="customer-booking-card__facts">
          <span>
            <CalendarDays size={15} aria-hidden="true" />
            <strong>Event date</strong>
            {formatEventDate(booking.eventDate)}
          </span>
          <span>
            <MapPin size={15} aria-hidden="true" />
            <strong>Location</strong>
            {booking.eventLocation || "Not provided"}
          </span>
        </div>

        <div className="customer-booking-card__footer">
          <small>Requested {formatRequestDate(booking.createdAt)}</small>
          <div className="customer-booking-card__actions">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setDetailsOpen(true)}
            >
              <Eye size={14} aria-hidden="true" />
              View details
            </Button>
            {booking.status === "pending" ? (
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="customer-booking-card__cancel"
                onClick={() => {
                  setCancelError(null);
                  setCancelOpen(true);
                }}
              >
                <X size={14} aria-hidden="true" />
                Cancel
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <BookingDetails booking={booking} />
      </Dialog>
      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent className="customer-cancel-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel this booking request?</AlertDialogTitle>
            <AlertDialogDescription>
              This will cancel your pending request for {serviceName}. This
              action can’t be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {cancelError ? (
            <p className="customer-cancel-dialog__error" role="alert">
              {cancelError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep booking
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isCancelling}
              onClick={(event) => void handleCancel(event)}
            >
              {isCancelling ? "Cancelling…" : "Cancel request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

function BookingCardSkeleton() {
  return (
    <div className="customer-booking-skeleton" aria-hidden="true">
      <span />
      <div>
        <span />
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}

export default function CustomerBookings() {
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${retryCount}`;
  const [state, setState] = useState<BookingsState>({
    key: "",
    result: null,
  });
  const isLoading = state.key !== requestKey;
  const error = isLoading ? null : state.error;
  const result = isLoading ? null : state.result;

  useEffect(() => {
    const controller = new AbortController();
    void fetchCustomerBookings(page, 10, controller.signal)
      .then((response) =>
        setState({ key: requestKey, result: response }),
      )
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          key: requestKey,
          result: null,
          error:
            fetchError instanceof Error
              ? fetchError.message
              : "Your bookings could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [page, requestKey]);

  function markCancelled(bookingId: string) {
    setState((current) => {
      if (!current.result) return current;
      const booking = current.result.bookings.find(
        (item) => item.id === bookingId,
      );
      if (!booking || booking.status !== "pending") return current;

      return {
        ...current,
        result: {
          ...current.result,
          bookings: current.result.bookings.map((item) =>
            item.id === bookingId ? { ...item, status: "cancelled" } : item,
          ),
          statistics: {
            ...current.result.statistics,
            pendingBookings: Math.max(
              0,
              current.result.statistics.pendingBookings - 1,
            ),
          },
        },
      };
    });
  }

  const totalPages = result?.pagination.totalPages ?? 0;

  return (
    <section className="customer-bookings-page">
      <div className="customer-bookings-page__intro">
        <div>
          <p className="eyebrow">YOUR WEDPLAN</p>
          <h2>My bookings</h2>
          <p>Keep track of your requests and the vendors you’ve reached out to.</p>
        </div>
        <Link href="/services" className="customer-bookings-page__browse">
          Browse services <ArrowRight size={15} aria-hidden="true" />
        </Link>
      </div>

      {isLoading ? (
        <div className="customer-booking-list" aria-busy="true">
          <BookingCardSkeleton />
          <BookingCardSkeleton />
          <BookingCardSkeleton />
        </div>
      ) : error ? (
        <div className="customer-dashboard-message customer-dashboard-message--error" role="alert">
          <div>
            <strong>We couldn’t load your bookings.</strong>
            <p>{error}</p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => setRetryCount((count) => count + 1)}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </Button>
        </div>
      ) : result && result.bookings.length > 0 ? (
        <>
          <div className="customer-bookings-page__summary" role="status">
            Showing {result.bookings.length} of {result.pagination.total} booking
            {result.pagination.total === 1 ? "" : " requests"}
          </div>
          <div className="customer-booking-list">
            {result.bookings.map((booking) => (
              <BookingCard
                key={booking.id}
                booking={booking}
                onCancelled={markCancelled}
              />
            ))}
          </div>
          {totalPages > 1 ? (
            <nav className="customer-bookings-pagination" aria-label="Bookings pages">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                <ChevronLeft size={15} aria-hidden="true" />
                Previous
              </Button>
              <span>
                Page {result.pagination.page} of {totalPages}
              </span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!result.pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
                <ChevronRight size={15} aria-hidden="true" />
              </Button>
            </nav>
          ) : null}
        </>
      ) : (
        <div className="customer-bookings-empty" role="status">
          <span>
            <CalendarDays size={24} aria-hidden="true" />
          </span>
          <h3>No booking requests yet</h3>
          <p>
            When you reach out to a wedding professional, your request and its
            status will appear here.
          </p>
          <Link href="/services">
            Explore wedding services <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      )}
    </section>
  );
}
