import Link from "next/link";
import { AlertCircle, ArrowRight, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function VendorStatusBadge({ status }: { status: string }) {
  const tone = ["pending", "approved", "rejected"].includes(status.toLowerCase())
    ? status.toLowerCase()
    : "unknown";
  const label =
    tone === "approved"
      ? "Approved"
      : tone === "pending"
        ? "Pending review"
        : tone === "rejected"
          ? "Rejected"
          : status;
  return (
    <span className={`vendor-status-badge vendor-status-badge--${tone}`}>
      {label}
    </span>
  );
}

export function VendorErrorState({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="vendor-dashboard-feedback vendor-dashboard-feedback--error" role="alert">
      <span className="vendor-dashboard-feedback__icon">
        <AlertCircle size={18} aria-hidden="true" />
      </span>
      <div>
        <strong>{title}</strong>
        <p>{message}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw size={14} aria-hidden="true" />
        Try again
      </Button>
    </div>
  );
}

export function VendorEmptyState({
  title,
  message,
  action,
  href,
}: {
  title: string;
  message: string;
  action?: string;
  href?: string;
}) {
  return (
    <div className="vendor-dashboard-empty" role="status">
      <span>
        <BriefcaseBusiness size={23} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
      {action && href ? (
        <Link href={href}>
          {action} <ArrowRight size={14} aria-hidden="true" />
        </Link>
      ) : null}
    </div>
  );
}

export function VendorSkeletonCards({ count = 3 }: { count?: number }) {
  return (
    <div className="vendor-skeleton-list" aria-busy="true">
      {Array.from({ length: count }, (_, index) => (
        <div className="vendor-skeleton-card" key={index}>
          <span />
          <div>
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

export function formatVendorDate(value: string | null) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      }).format(date);
}
