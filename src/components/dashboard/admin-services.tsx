"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Eye,
  MapPin,
  Pause,
  Play,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { weddingCategories } from "@/lib/homepage-data";
import {
  deleteAdminService,
  fetchAdminServices,
  updateAdminServiceAvailability,
  updateAdminServiceStatus,
  type AdminService,
} from "@/lib/admin-dashboard-api";
import { toast } from "@/components/ui/toast";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminPageIntro,
  AdminPagination,
  AdminStatusBadge,
  AdminTableSkeleton,
  formatAdminDate,
} from "@/components/dashboard/admin-dashboard-ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ServicesResult = Awaited<ReturnType<typeof fetchAdminServices>>;
type ServicesState = {
  key: string;
  result: ServicesResult | null;
  error?: string;
};
type ServiceAction =
  | { type: "status"; service: AdminService; status: "pending" | "approved" | "rejected" }
  | { type: "availability"; service: AdminService; isActive: boolean }
  | { type: "delete"; service: AdminService };

function formatPrice(value: number | null) {
  return value === null
    ? "—"
    : new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        maximumFractionDigits: 0,
      }).format(value);
}

function ServiceIdentity({ service }: { service: AdminService }) {
  return (
    <span className="admin-identity">
      <span
        className={`admin-service-thumb${service.image ? "" : " admin-service-thumb--empty"}`}
        role="img"
        aria-label={`${service.serviceName} image`}
        style={service.image ? { backgroundImage: `url("${service.image}")` } : undefined}
      />
      <span>
        <strong>{service.serviceName}</strong>
        <small><MapPin size={12} aria-hidden="true" /> {service.location || "Location not provided"}</small>
      </span>
    </span>
  );
}

export default function AdminServices() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState("");
  const [availability, setAvailability] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${search.trim()}:${category}:${status}:${availability}:${retryCount}`;
  const [state, setState] = useState<ServicesState>({
    key: "",
    result: null,
  });
  const [selectedService, setSelectedService] = useState<AdminService | null>(null);
  const [serviceAction, setServiceAction] = useState<ServiceAction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const isLoading = state.key !== requestKey;
  const result = isLoading ? null : state.result;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchAdminServices(
        { page, limit: 10, search, category, status, availability },
        controller.signal,
      )
        .then((response) => {
          if (!controller.signal.aborted) {
            setState({ key: requestKey, result: response });
          }
        })
        .catch((requestError: unknown) => {
          if (controller.signal.aborted) return;
          setState({
            key: requestKey,
            result: null,
            error:
              requestError instanceof Error
                ? requestError.message
                : "Service listings could not be loaded.",
          });
        });
    }, search.trim() ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, search, category, status, availability, requestKey]);

  async function confirmAction() {
    if (!serviceAction || isUpdating) return;
    setIsUpdating(true);
    try {
      if (serviceAction.type === "delete") {
        await deleteAdminService(serviceAction.service.id);
        setState((current) => {
          if (!current.result) return current;
          const services = current.result.services.filter(
            (service) => service.id !== serviceAction.service.id,
          );
          const total = Math.max(0, current.result.pagination.total - 1);
          const totalPages = Math.ceil(total / current.result.pagination.limit);
          return {
            ...current,
            result: {
              ...current.result,
              services,
              pagination: {
                ...current.result.pagination,
                total,
                totalPages,
                hasNextPage: page < totalPages,
              },
            },
          };
        });
        if (result?.services.length === 1 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
        toast.add({
          type: "success",
          title: "Service removed",
          description: "The listing was removed from public and admin service views.",
        });
      } else {
        const updated = serviceAction.type === "status"
          ? await updateAdminServiceStatus(
              serviceAction.service.id,
              serviceAction.status,
            )
          : await updateAdminServiceAvailability(
              serviceAction.service.id,
              serviceAction.isActive,
            );
        const noLongerMatches =
          (status !== "" && updated.status !== status) ||
          (availability !== "" &&
            updated.isActive !== (availability === "active"));
        setState((current) => {
          if (!current.result) return current;
          if (noLongerMatches) {
            const services = current.result.services.filter(
              (service) => service.id !== updated.id,
            );
            const total = Math.max(0, current.result.pagination.total - 1);
            const totalPages = Math.ceil(total / current.result.pagination.limit);
            return {
              ...current,
              result: {
                ...current.result,
                services,
                pagination: {
                  ...current.result.pagination,
                  total,
                  totalPages,
                  hasNextPage: page < totalPages,
                },
              },
            };
          }
          return {
            ...current,
            result: {
              ...current.result,
              services: current.result.services.map((service) =>
                service.id === updated.id ? updated : service,
              ),
            },
          };
        });
        if (noLongerMatches && result?.services.length === 1 && page > 1) {
          setPage((current) => Math.max(1, current - 1));
        }
        setSelectedService((current) =>
          current?.id === updated.id ? updated : current,
        );
        toast.add({
          type: "success",
          title: serviceAction.type === "status" ? "Service status updated" : "Availability updated",
          description:
            serviceAction.type === "status"
              ? `${updated.serviceName} is now ${updated.status}.`
              : `${updated.serviceName} is ${updated.isActive ? "available" : "paused"}.`,
        });
      }
      setServiceAction(null);
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Service could not be updated",
        description:
          requestError instanceof Error ? requestError.message : "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  function resetFilters() {
    setSearch("");
    setCategory("");
    setStatus("");
    setAvailability("");
    setPage(1);
  }

  const actionTitle = serviceAction?.type === "delete"
    ? "Remove this service?"
    : serviceAction?.type === "status"
      ? `Change status to ${serviceAction.status}?`
      : serviceAction?.isActive
        ? "Make this service available?"
        : "Pause this service?";
  const actionDescription = serviceAction?.type === "delete"
    ? "The listing will be hidden from the platform. Existing bookings will be preserved."
    : serviceAction?.type === "status"
      ? `${serviceAction.service.serviceName} will be marked ${serviceAction.status}.`
      : `${serviceAction?.service.serviceName} will be ${serviceAction?.isActive ? "available to couples" : "hidden from public service listings"}.`;

  return (
    <section className="admin-services-page">
      <AdminPageIntro
        title="Manage services"
        description="Review submissions, moderate service status, and keep public listings appropriate and available."
      />

      <div className="admin-filters admin-service-filters">
        <label className="admin-filter admin-filter--search">
          <span>Search services</span>
          <span className="admin-filter__control">
            <Search size={16} aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              maxLength={100}
              placeholder="Name or location"
              aria-label="Search services by name or location"
            />
          </span>
        </label>
        <label className="admin-filter">
          <span>Category</span>
          <select
            value={category}
            onChange={(event) => {
              setCategory(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All categories</option>
            {weddingCategories.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
        <label className="admin-filter">
          <span>Review status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </label>
        <label className="admin-filter">
          <span>Availability</span>
          <select
            value={availability}
            onChange={(event) => {
              setAvailability(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All listings</option>
            <option value="active">Available</option>
            <option value="paused">Paused</option>
          </select>
        </label>
        {(search || category || status || availability) ? (
          <Button type="button" variant="ghost" size="sm" onClick={resetFilters}>
            <X size={14} aria-hidden="true" /> Clear filters
          </Button>
        ) : null}
      </div>

      {isLoading ? (
        <AdminTableSkeleton columns={7} />
      ) : error ? (
        <AdminFeedback
          title="We couldn’t load service listings."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : result && result.services.length > 0 ? (
        <>
          <div className="admin-table-summary">
            <span>{result.pagination.total.toLocaleString()} listings</span>
            <span>Approval and availability control public visibility.</span>
          </div>
          <div className="admin-table-frame">
            <Table className="admin-data-table admin-services-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Service</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Review</TableHead>
                  <TableHead>Availability</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.services.map((service) => (
                  <TableRow key={service.id}>
                    <TableCell><ServiceIdentity service={service} /></TableCell>
                    <TableCell>
                      <span className="admin-vendor-cell">
                        <Avatar className="admin-vendor-cell__avatar">
                          {service.vendor?.image ? <AvatarImage src={service.vendor.image} alt="" /> : null}
                          <AvatarFallback>{service.vendor?.name.slice(0, 1).toUpperCase() ?? "V"}</AvatarFallback>
                        </Avatar>
                        <span>
                          <strong>{service.vendor?.name ?? "Vendor unavailable"}</strong>
                          <small>{service.vendor?.email ?? "—"}</small>
                        </span>
                      </span>
                    </TableCell>
                    <TableCell>{service.category}</TableCell>
                    <TableCell>{formatPrice(service.price)}</TableCell>
                    <TableCell><AdminStatusBadge status={service.status} /></TableCell>
                    <TableCell>
                      <AdminStatusBadge status={service.isActive ? "active" : "paused"} />
                    </TableCell>
                    <TableCell>
                      <div className="admin-service-actions">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedService(service)}
                        >
                          <Eye size={14} aria-hidden="true" /> Review
                        </Button>
                        {service.status !== "approved" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="admin-approve-button"
                            onClick={() => setServiceAction({ type: "status", service, status: "approved" })}
                          >
                            <Check size={14} aria-hidden="true" /> Approve
                          </Button>
                        ) : null}
                        {service.status !== "rejected" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="admin-reject-button"
                            onClick={() => setServiceAction({ type: "status", service, status: "rejected" })}
                          >
                            <X size={14} aria-hidden="true" /> Reject
                          </Button>
                        ) : null}
                        {service.status !== "pending" ? (
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            onClick={() => setServiceAction({ type: "status", service, status: "pending" })}
                          >
                            Mark pending
                          </Button>
                        ) : null}
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          onClick={() => setServiceAction({
                            type: "availability",
                            service,
                            isActive: !service.isActive,
                          })}
                        >
                          {service.isActive ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
                          {service.isActive ? "Pause" : "Activate"}
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant="ghost"
                          className="admin-delete-button"
                          onClick={() => setServiceAction({ type: "delete", service })}
                        >
                          <Trash2 size={14} aria-hidden="true" /> Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <AdminPagination
            pagination={result.pagination}
            onPageChange={setPage}
          />
        </>
      ) : (
        <AdminEmptyState
          title="No services match these filters"
          message={
            search || category || status || availability
              ? "Try changing or clearing the service filters."
              : "Vendor submissions and their review status will appear here."
          }
        />
      )}

      <Dialog
        open={selectedService !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedService(null);
        }}
      >
        <DialogContent className="admin-dialog admin-service-dialog">
          <DialogHeader>
            <p className="eyebrow">SERVICE REVIEW</p>
            <DialogTitle>{selectedService?.serviceName ?? "Service details"}</DialogTitle>
            <DialogDescription>
              Review the submitted listing and its current moderation state.
            </DialogDescription>
          </DialogHeader>
          {selectedService ? (
            <div className="admin-service-details">
              {selectedService.image ? (
                <div
                  className="admin-service-details__image"
                  role="img"
                  aria-label={selectedService.serviceName}
                  style={{ backgroundImage: `url("${selectedService.image}")` }}
                />
              ) : (
                <div className="admin-service-details__image-empty">
                  <Eye size={24} aria-hidden="true" />
                </div>
              )}
              <div className="admin-service-details__meta">
                <AdminStatusBadge status={selectedService.status} />
                <AdminStatusBadge status={selectedService.isActive ? "active" : "paused"} />
                <span>{selectedService.category}</span>
                <strong>{formatPrice(selectedService.price)}</strong>
              </div>
              <p>{selectedService.description || "No service description was provided."}</p>
              <div>
                <span>Vendor</span>
                <strong>{selectedService.vendor?.name ?? "Vendor unavailable"}</strong>
                <small>{selectedService.vendor?.email ?? "—"}</small>
              </div>
              <div>
                <span>Location</span>
                <strong>{selectedService.location || "Not provided"}</strong>
              </div>
              <div>
                <span>Submitted</span>
                <strong>{formatAdminDate(selectedService.createdAt)}</strong>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={serviceAction !== null}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setServiceAction(null);
        }}
      >
        <AlertDialogContent className="admin-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>{actionTitle}</AlertDialogTitle>
            <AlertDialogDescription>{actionDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={serviceAction?.type === "delete" || (serviceAction?.type === "status" && serviceAction.status === "rejected") ? "destructive" : "default"}
              disabled={isUpdating}
              onClick={(event) => {
                event.preventDefault();
                void confirmAction();
              }}
            >
              {isUpdating ? "Updating…" : serviceAction?.type === "delete" ? "Remove listing" : "Confirm change"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
