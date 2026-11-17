"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import {
  AlertCircle,
  ArrowLeft,
  BadgeCheck,
  ChevronLeft,
  ChevronRight,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import ServiceBookingDialog from "@/components/services/service-booking-dialog";
import {
  fetchServiceDetails,
  type ServiceDetails,
} from "@/lib/services-api";

type ServiceViewer = {
  id: string;
  role: string;
};

type ServiceDetailPageProps = {
  id: string;
  viewer: ServiceViewer;
};

type DetailState = {
  key: string;
  service: ServiceDetails | null;
  error?: string;
};

function formatPrice(price: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

function ServiceDetailsSkeleton() {
  return (
    <main className="service-detail-page">
      <div className="page-container">
        <div className="service-detail-skeleton__back" />
        <div className="service-detail-skeleton">
          <div className="service-detail-skeleton__gallery" />
          <div className="service-detail-skeleton__content">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </main>
  );
}

export { ServiceDetailsSkeleton };

export default function ServiceDetailPage({
  id,
  viewer,
}: ServiceDetailPageProps) {
  const router = useRouter();
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${id}:${retryCount}`;
  const [detailState, setDetailState] = useState<DetailState>({
    key: "",
    service: null,
  });
  const reduceMotion = useReducedMotion();
  const isLoading = detailState.key !== requestKey;
  const service = isLoading ? null : detailState.service;
  const error = isLoading ? null : detailState.error;
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    void fetchServiceDetails(id, controller.signal)
      .then((result) => {
        setActiveImageIndex(0);
        setDetailState({ key: requestKey, service: result });
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setDetailState({
          key: requestKey,
          service: null,
          error:
            fetchError instanceof Error
              ? fetchError.message
              : "Service details could not be loaded.",
        });
      });

    return () => controller.abort();
  }, [id, requestKey]);

  if (isLoading) return <ServiceDetailsSkeleton />;

  if (error) {
    return (
      <main className="service-detail-page">
        <section className="page-container service-detail-state" role="alert">
          <AlertCircle size={26} aria-hidden="true" />
          <h1>We couldn’t load this service</h1>
          <p>{error}</p>
          <Button type="button" onClick={() => setRetryCount((count) => count + 1)}>
            <RefreshCw size={15} aria-hidden="true" />
            Try again
          </Button>
        </section>
      </main>
    );
  }

  if (!service) {
    return (
      <main className="service-detail-page">
        <section className="page-container service-detail-state" role="status">
          <AlertCircle size={26} aria-hidden="true" />
          <h1>Service not found</h1>
          <p>
            This listing may have been removed or is no longer approved and
            available.
          </p>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/services")}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Browse services
          </Button>
        </section>
      </main>
    );
  }

  const activeImage = service.images[activeImageIndex] ?? service.image;
  const isOwnService =
    viewer.role === "vendor" &&
    service.vendorId !== null &&
    viewer.id === service.vendorId;
  const vendorName =
    service.vendor?.businessName ??
    service.vendor?.name ??
    service.vendorName;

  return (
    <main className="service-detail-page">
      <div className="page-container">
        <nav className="service-detail-breadcrumbs" aria-label="Breadcrumb">
          <Link href="/services">Wedding services</Link>
          <span aria-hidden="true">/</span>
          <span>{service.category}</span>
        </nav>

        <div className="service-detail-layout">
          <motion.section
            className="service-detail-gallery"
            aria-label="Service images"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, ease: "easeOut" }}
          >
            <div className="service-detail-gallery__frame">
              <motion.div
                key={activeImage ?? "no-image"}
                className={`service-detail-gallery__main${activeImage ? "" : " service-detail-gallery__main--empty"}`}
                role="img"
                aria-label={`${service.name} photo ${activeImageIndex + 1}`}
                initial={reduceMotion ? false : { opacity: 0.65, scale: 1.015 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: reduceMotion ? 0 : 0.35 }}
                style={
                  activeImage
                    ? { backgroundImage: `url("${activeImage}")` }
                    : undefined
                }
              >
                {!activeImage ? (
                  <span className="service-detail-gallery__fallback">
                    <Sparkles size={24} aria-hidden="true" />
                    A beautiful day starts here
                  </span>
                ) : null}
                <span className="service-detail-gallery__approved">
                  <BadgeCheck size={15} aria-hidden="true" />
                  WedPlan approved
                </span>
                {service.images.length > 1 ? (
                  <>
                    <button
                      className="service-detail-gallery__arrow service-detail-gallery__arrow--previous"
                      type="button"
                      aria-label="Show previous image"
                      onClick={() =>
                        setActiveImageIndex(
                          (index) =>
                            (index - 1 + service.images.length) %
                            service.images.length,
                        )
                      }
                    >
                      <ChevronLeft size={20} aria-hidden="true" />
                    </button>
                    <button
                      className="service-detail-gallery__arrow service-detail-gallery__arrow--next"
                      type="button"
                      aria-label="Show next image"
                      onClick={() =>
                        setActiveImageIndex(
                          (index) => (index + 1) % service.images.length,
                        )
                      }
                    >
                      <ChevronRight size={20} aria-hidden="true" />
                    </button>
                    <span className="service-detail-gallery__count">
                      {activeImageIndex + 1} <span aria-hidden="true">/</span>{" "}
                      {service.images.length}
                    </span>
                  </>
                ) : null}
              </motion.div>
            </div>
            {service.images.length > 1 ? (
              <div
                className="service-detail-gallery__thumbnails"
                aria-label="Choose a service photo"
              >
                {service.images.map((image, index) => (
                  <button
                    className={`service-detail-gallery__thumbnail${index === activeImageIndex ? " service-detail-gallery__thumbnail--active" : ""}`}
                    type="button"
                    key={image}
                    aria-label={`Show service image ${index + 1}`}
                    aria-pressed={index === activeImageIndex}
                    onClick={() => setActiveImageIndex(index)}
                    style={{ backgroundImage: `url("${image}")` }}
                  />
                ))}
              </div>
            ) : null}
          </motion.section>

          <motion.section
            className="service-detail-info"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: reduceMotion ? 0 : 0.4,
              delay: reduceMotion ? 0 : 0.08,
              ease: "easeOut",
            }}
          >
            <div className="service-detail-info__topline">
              <span className="service-detail-category">{service.category}</span>
              <span className="service-detail-verified">
                <ShieldCheck size={15} aria-hidden="true" />
                Verified listing
              </span>
            </div>
            <h1>{service.name}</h1>
            <p className="service-detail-description">{service.description}</p>

            <div className="service-detail-facts">
              <div>
                <MapPin size={18} aria-hidden="true" />
                <span>
                  <small>Based in</small>
                  <strong>{service.location}</strong>
                </span>
              </div>
            </div>

            <section className="service-detail-vendor" aria-label="Vendor information">
              <div
                className={`service-detail-vendor__avatar${service.vendor?.image ? " service-detail-vendor__avatar--image" : ""}`}
                role="img"
                aria-label={`${vendorName} profile`}
                style={
                  service.vendor?.image
                    ? { backgroundImage: `url("${service.vendor.image}")` }
                    : undefined
                }
              >
                {service.vendor?.image ? null : vendorName.slice(0, 1).toUpperCase()}
              </div>
              <div className="service-detail-vendor__copy">
                <span>Offered by</span>
                <strong>{vendorName}</strong>
                <small>
                  <BadgeCheck size={13} aria-hidden="true" />
                  WedPlan vendor
                </small>
              </div>
            </section>

            <section className="service-detail-booking" aria-label="Booking">
              <div className="service-detail-booking__price">
                <span>Starting price</span>
                <strong>{formatPrice(service.price)}</strong>
                <small>Final details can be discussed with the vendor.</small>
              </div>
              {viewer.role === "customer" ? (
                <ServiceBookingDialog service={service} />
              ) : (
                <p className="service-detail-booking__notice" role="status">
                  {viewer.role === "admin"
                    ? "Admin accounts cannot submit customer bookings."
                    : isOwnService
                      ? "You can’t book your own service."
                      : "Only customer accounts can submit booking requests."}
                </p>
              )}
              <div className="service-detail-booking__reassurance">
                <ShieldCheck size={15} aria-hidden="true" />
                <span>Your request is sent securely through WedPlan.</span>
              </div>
            </section>
          </motion.section>
        </div>
      </div>
    </main>
  );
}
