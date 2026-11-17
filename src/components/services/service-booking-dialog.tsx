"use client";

import { useState, type FormEvent } from "react";
import { CalendarDays, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import type { ServiceDetails } from "@/lib/services-api";

type ServiceBookingDialogProps = {
  service: ServiceDetails;
};

function getToday() {
  const today = new Date();
  today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  return today.toISOString().slice(0, 10);
}

export default function ServiceBookingDialog({
  service,
}: ServiceBookingDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          eventDate: formData.get("eventDate"),
          eventLocation: formData.get("eventLocation"),
          message: formData.get("message"),
        }),
      });

      let result: unknown;
      try {
        result = await response.json();
      } catch {
        throw new Error("The booking service returned an invalid response.");
      }

      if (!response.ok) {
        const message =
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "string"
            ? result.error
            : "Your booking request could not be sent. Please try again.";
        throw new Error(message);
      }

      form.reset();
      setIsOpen(false);
      toast.add({
        type: "success",
        title: "Request sent",
        description: `Your request for ${service.name} has been sent to the vendor.`,
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Your booking request could not be sent. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) setError(null);
      }}
    >
      <DialogTrigger className="service-booking-trigger">
        <CalendarDays size={17} aria-hidden="true" />
        Book This Service
      </DialogTrigger>
      <DialogContent className="service-booking-dialog">
        <DialogHeader>
          <p className="eyebrow">Start planning</p>
          <DialogTitle>Request {service.name}</DialogTitle>
          <DialogDescription>
            Tell the vendor a little about your date and celebration.
          </DialogDescription>
        </DialogHeader>
        <form className="service-booking-form" onSubmit={handleSubmit}>
          <label htmlFor="booking-event-date">Event date</label>
          <input
            id="booking-event-date"
            name="eventDate"
            type="date"
            min={getToday()}
            required
          />

          <label htmlFor="booking-event-location">Event location</label>
          <span className="service-booking-form__location">
            <MapPin size={16} aria-hidden="true" />
            <input
              id="booking-event-location"
              name="eventLocation"
              type="text"
              maxLength={200}
              placeholder="City, venue, or region"
              required
            />
          </span>

          <label htmlFor="booking-message">Message to the vendor</label>
          <textarea
            id="booking-message"
            name="message"
            maxLength={1000}
            rows={4}
            placeholder="Share any details that will help the vendor understand your plans."
          />

          {error ? (
            <p className="service-booking-form__error" role="alert">
              {error}
            </p>
          ) : null}
          <Button
            className="service-booking-form__submit"
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending request…" : "Send Booking Request"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
