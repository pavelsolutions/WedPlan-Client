"use client";

import { ArrowRight, MapPin, Tag, UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { BrowseService } from "@/lib/services-api";

type ServiceListingCardProps = {
  service: BrowseService;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export default function ServiceListingCard({
  service,
}: ServiceListingCardProps) {
  return (
    <article className="service-listing-card">
      <div
        className={`service-listing-card__image${service.image ? "" : " service-listing-card__image--empty"}`}
        role="img"
        aria-label={`${service.name} wedding service`}
        style={
          service.image
            ? { backgroundImage: `url("${service.image}")` }
            : undefined
        }
      >
        <span className="service-listing-card__category">{service.category}</span>
      </div>
      <div className="service-listing-card__body">
        <div className="service-listing-card__vendor">
          <UserRound size={15} aria-hidden="true" />
          <span>By {service.vendorName}</span>
        </div>
        <h2>{service.name}</h2>
        <p className="service-listing-card__description">
          {service.description || "A trusted wedding service for your special day."}
        </p>
        <div className="service-listing-card__details">
          <span>
            <MapPin size={15} aria-hidden="true" />
            {service.location}
          </span>
          <span>
            <Tag size={15} aria-hidden="true" />
            From <strong>{formatPrice(service.price)}</strong>
          </span>
        </div>
        <Dialog>
          <DialogTrigger className="service-listing-card__cta">
            View Details <ArrowRight size={16} aria-hidden="true" />
          </DialogTrigger>
          <DialogContent className="service-details-dialog">
            <DialogHeader>
              <p className="eyebrow">WedPlan vendor</p>
              <DialogTitle>{service.name}</DialogTitle>
              <DialogDescription>
                {service.category} · {service.location}
              </DialogDescription>
            </DialogHeader>
            {service.image ? (
              <div
                className="service-details-dialog__image"
                role="img"
                aria-label={`${service.name} wedding service`}
                style={{ backgroundImage: `url("${service.image}")` }}
              />
            ) : null}
            <p className="service-details-dialog__description">
              {service.description ||
                "Contact the vendor to learn more about this wedding service."}
            </p>
            <div className="service-details-dialog__meta">
              <span>
                <UserRound size={16} aria-hidden="true" />
                {service.vendorName}
              </span>
              <span>
                <MapPin size={16} aria-hidden="true" />
                {service.location}
              </span>
              <strong>From {formatPrice(service.price)}</strong>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </article>
  );
}
