import Link from "next/link";
import { ArrowUpRight, BadgeCheck, MapPin, Sparkles } from "lucide-react";
import type { BrowseService } from "@/lib/services-api";

type ServiceCardProps = {
  service: BrowseService;
};

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="service-card">
      <div
        className={`service-card__image${service.image ? "" : " service-card__image--empty"}`}
        role="img"
        aria-label={`${service.name}${service.image ? " service photo" : ", photo unavailable"}`}
        style={service.image ? { backgroundImage: `url("${service.image}")` } : undefined}
      >
        <span className="service-card__category">{service.category}</span>
        {service.image ? null : (
          <span className="service-card__image-fallback">
            <Sparkles size={20} aria-hidden="true" />
            A lovely day starts here
          </span>
        )}
        <span className="service-card__approved">
          <BadgeCheck size={14} aria-hidden="true" />
          Approved
        </span>
      </div>
      <div className="service-card__body">
        <p className="service-card__vendor">By {service.vendorName}</p>
        <h3>{service.name}</h3>
        <p className="service-card__description">{service.description}</p>
        <div className="service-card__meta">
          <span>
            <MapPin size={15} aria-hidden="true" />
            {service.location}
          </span>
          <span>
            From <strong>${service.price.toLocaleString()}</strong>
          </span>
        </div>
        <Link
          className="service-card__link"
          href={`/services/${encodeURIComponent(service.id)}`}
          aria-label={`View details for ${service.name}`}
        >
          View service details <ArrowUpRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
