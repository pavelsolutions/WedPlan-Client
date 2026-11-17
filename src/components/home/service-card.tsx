import { ArrowUpRight, MapPin, Star } from "lucide-react";
import type { WeddingService } from "@/lib/homepage-data";

type ServiceCardProps = {
  service: WeddingService;
};

export default function ServiceCard({ service }: ServiceCardProps) {
  return (
    <article className="service-card">
      <div
        className="service-card__image"
        role="img"
        aria-label={service.imageAlt}
        style={{ backgroundImage: `url("${service.image}")` }}
      >
        <span className="service-card__category">{service.category}</span>
        <span className="service-card__rating">
          <Star size={14} fill="currentColor" aria-hidden="true" />
          {service.rating.toFixed(1)}
          <span>({service.reviewCount})</span>
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
            From <strong>${service.startingPrice.toLocaleString()}</strong>
          </span>
        </div>
        <a
          className="service-card__link"
          href="#how-it-works"
          aria-label={`Learn how to plan with ${service.name}`}
        >
          Find your perfect fit <ArrowUpRight size={16} aria-hidden="true" />
        </a>
      </div>
    </article>
  );
}
