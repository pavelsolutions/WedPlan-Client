"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Eye,
  MapPin,
  Pencil,
  Plus,
  Power,
  Trash2,
} from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import {
  deleteVendorService,
  fetchVendorServices,
  setVendorServiceAvailability,
  type VendorService,
  type VendorServicePage,
} from "@/lib/vendor-dashboard-api";
import {
  formatVendorDate,
  VendorEmptyState,
  VendorErrorState,
  VendorSkeletonCards,
  VendorStatusBadge,
} from "@/components/dashboard/vendor-dashboard-ui";

type ServicesState = {
  key: string;
  data: VendorServicePage | null;
  error?: string;
};

function VendorServiceCard({
  service,
  onChange,
  onDelete,
}: {
  service: VendorService;
  onChange: (service: VendorService) => void;
  onDelete: (serviceId: string) => void;
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isBusy, setIsBusy] = useState(false);

  async function toggleAvailability() {
    setIsBusy(true);
    try {
      const updated = await setVendorServiceAvailability(service.id, !service.isActive);
      onChange(updated);
      toast.add({
        type: "success",
        title: updated.isActive ? "Service activated" : "Service paused",
        description: updated.isActive
          ? "Your listing is active. It will be public after approval."
          : "Your listing is no longer available to couples.",
      });
    } catch (error) {
      toast.add({
        type: "error",
        title: "Availability wasn’t updated",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  async function confirmDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setIsBusy(true);
    try {
      await deleteVendorService(service.id);
      onDelete(service.id);
      setDeleteOpen(false);
      toast.add({
        type: "success",
        title: "Service removed",
        description: "The listing has been removed from your services.",
      });
    } catch (error) {
      toast.add({
        type: "error",
        title: "Service couldn’t be removed",
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <article className="vendor-service-card">
      {service.images[0] ? (
        <div
          className="vendor-service-card__image"
          role="img"
          aria-label={service.serviceName}
          style={{ backgroundImage: `url("${service.images[0]}")` }}
        />
      ) : (
        <div className="vendor-service-card__image vendor-service-card__image--empty">
          <BriefcaseBusiness size={26} aria-hidden="true" />
        </div>
      )}
      <div className="vendor-service-card__body">
        <div className="vendor-service-card__heading">
          <div>
            <span className="vendor-service-card__category">{service.category}</span>
            <h3>{service.serviceName}</h3>
          </div>
          <VendorStatusBadge status={service.status} />
        </div>
        <p className="vendor-service-card__description">{service.description}</p>
        <div className="vendor-service-card__meta">
          <span><MapPin size={14} aria-hidden="true" />{service.location}</span>
          <strong>{new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(service.price)}</strong>
        </div>
        <div className="vendor-service-card__status">
          <span className={service.isActive ? "vendor-availability vendor-availability--active" : "vendor-availability"}>
            <i aria-hidden="true" />
            {service.isActive ? "Available" : "Paused"}
          </span>
          <small>Added {formatVendorDate(service.createdAt)}</small>
        </div>
        <div className="vendor-service-card__actions">
          <Link
            className="vendor-service-card__edit"
            href={`/dashboard/vendor/services/${encodeURIComponent(service.id)}/edit`}
          >
            <Pencil size={14} aria-hidden="true" /> Edit
          </Link>
          {service.status === "approved" && service.isActive ? (
            <Link
              className="vendor-service-card__public"
              href={`/services/${encodeURIComponent(service.id)}`}
            >
              <Eye size={14} aria-hidden="true" /> View listing
            </Link>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isBusy}
            onClick={() => void toggleAvailability()}
          >
            <Power size={14} aria-hidden="true" />
            {service.isActive ? "Pause" : "Activate"}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="vendor-service-card__delete"
            disabled={isBusy}
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={14} aria-hidden="true" />
            Delete
          </Button>
        </div>
      </div>
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent className="vendor-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this service?</AlertDialogTitle>
            <AlertDialogDescription>
              “{service.serviceName}” will be removed from your listings. Existing booking history will be kept.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBusy}>Keep service</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isBusy}
              onClick={(event) => void confirmDelete(event)}
            >
              {isBusy ? "Removing…" : "Remove service"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </article>
  );
}

export default function VendorServices() {
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${retryCount}`;
  const [state, setState] = useState<ServicesState>({
    key: "",
    data: null,
  });
  const isLoading = state.key !== requestKey;
  const data = isLoading ? null : state.data;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchVendorServices(page, 12, controller.signal)
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
                : "Your services could not be loaded.",
          });
        }
      });
    return () => controller.abort();
  }, [page, requestKey]);

  function updateService(updated: VendorService) {
    setState((current) => ({
      ...current,
      data: current.data
        ? {
            ...current.data,
            activeServices: Math.max(
              0,
              current.data.activeServices +
                Number(updated.isActive) -
                Number(
                  current.data.services.find(
                    (service) => service.id === updated.id,
                  )?.isActive ?? false,
                ),
            ),
            services: current.data.services.map((service) =>
              service.id === updated.id ? updated : service,
            ),
          }
        : current.data,
    }));
  }

  function removeService(serviceId: string) {
    setState((current) => {
      if (!current.data) return current;
      const services = current.data.services.filter(
        (service) => service.id !== serviceId,
      );
      return {
        ...current,
        data: {
          ...current.data,
          services,
          activeServices: Math.max(
            0,
            current.data.activeServices -
              Number(
                current.data.services.find((service) => service.id === serviceId)
                  ?.isActive ?? false,
              ),
          ),
          pagination: {
            ...current.data.pagination,
            total: Math.max(0, current.data.pagination.total - 1),
          },
        },
      };
    });
  }

  const pagination = data?.pagination;
  const plan = data?.subscription;
  const activeCount = data?.activeServices ?? 0;
  const isAtLimit =
    plan?.plan === "free" &&
    activeCount >= (plan.activeServiceLimit ?? 3);

  return (
    <section className="vendor-services-page">
      <div className="vendor-page-intro">
        <div>
          <p className="eyebrow">YOUR WEDPLAN BUSINESS</p>
          <h2>My services</h2>
          <p>Manage your listings, availability, and approval status in one place.</p>
        </div>
        <Link className="vendor-primary-link" href="/dashboard/vendor/services/new">
          <Plus size={16} aria-hidden="true" /> Add service
        </Link>
      </div>

      {plan?.plan === "free" ? (
        <div className={`vendor-services-limit${isAtLimit ? " vendor-services-limit--full" : ""}`}>
          <span>
            {activeCount} active services on Free plan
            {plan.activeServiceLimit === null ? "" : ` · ${plan.activeServiceLimit} maximum`}
          </span>
          {isAtLimit ? (
            <Link href="/dashboard/vendor/subscription">
              Review plans <ArrowRight size={14} aria-hidden="true" />
            </Link>
          ) : null}
        </div>
      ) : null}

      {isLoading ? (
        <VendorSkeletonCards />
      ) : error ? (
        <VendorErrorState
          title="We couldn’t load your services."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : !data?.services.length ? (
        <VendorEmptyState
          title="Your first listing starts here"
          message="Add the service you provide so couples can discover your business after it has been approved."
          action="Create a service"
          href="/dashboard/vendor/services/new"
        />
      ) : (
        <>
          <div className="vendor-service-list">
            {data.services.map((service) => (
              <VendorServiceCard
                key={service.id}
                service={service}
                onChange={updateService}
                onDelete={removeService}
              />
            ))}
          </div>
          {pagination && pagination.totalPages > 1 ? (
            <nav className="vendor-pagination" aria-label="Service pages">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
              >
                Previous
              </Button>
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!pagination.hasNextPage}
                onClick={() => setPage((current) => current + 1)}
              >
                Next
              </Button>
            </nav>
          ) : null}
        </>
      )}
    </section>
  );
}
