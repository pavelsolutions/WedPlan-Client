import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Inbox,
  RefreshCw,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { AdminPagination } from "@/lib/admin-dashboard-api";

export function AdminPageIntro({
  eyebrow = "PLATFORM ADMINISTRATION",
  title,
  description,
  children,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="admin-page-intro">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
      {children ? <div className="admin-page-intro__actions">{children}</div> : null}
    </div>
  );
}

export function AdminStatusBadge({ status }: { status: string }) {
  const normalized = status.trim().toLowerCase();
  const tone = [
    "pending",
    "approved",
    "rejected",
    "paid",
    "failed",
    "refunded",
    "blocked",
    "active",
  ].includes(normalized)
    ? normalized
    : "unknown";
  const label = normalized
    ? normalized.charAt(0).toUpperCase() + normalized.slice(1)
    : "Unknown";
  return (
    <span className={`admin-status-badge admin-status-badge--${tone}`}>
      <i aria-hidden="true" />
      {label}
    </span>
  );
}

export function AdminFeedback({
  title,
  message,
  onRetry,
}: {
  title: string;
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="admin-feedback admin-feedback--error" role="alert">
      <AlertCircle size={18} aria-hidden="true" />
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

export function AdminEmptyState({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <div className="admin-empty-state" role="status">
      <span>
        <Inbox size={20} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{message}</p>
    </div>
  );
}

export function AdminPagination({
  pagination,
  onPageChange,
}: {
  pagination: AdminPagination;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
    <nav className="admin-pagination" aria-label="Admin data pages">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={pagination.page <= 1}
        onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
      >
        <ChevronLeft size={15} aria-hidden="true" />
        Previous
      </Button>
      <span>
        Page {pagination.page} of {pagination.totalPages}
      </span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={!pagination.hasNextPage}
        onClick={() => onPageChange(pagination.page + 1)}
      >
        Next
        <ChevronRight size={15} aria-hidden="true" />
      </Button>
    </nav>
  );
}

export function AdminTableSkeleton({
  columns,
  rows = 5,
}: {
  columns: number;
  rows?: number;
}) {
  return (
    <div className="admin-table-skeleton" aria-busy="true">
      {Array.from({ length: rows }, (_, row) => (
        <div
          className="admin-table-skeleton__row"
          key={row}
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(100px, 1fr))` }}
        >
          {Array.from({ length: columns }, (_, column) => (
            <span key={column} />
          ))}
        </div>
      ))}
      <span className="sr-only">Loading admin data…</span>
    </div>
  );
}

export function formatAdminDate(value: string | null) {
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

export function formatAdminAmount(amount: number | null, currency: string) {
  if (amount === null) return "—";
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
    }).format(amount / 100);
  } catch {
    return `${currency} ${(amount / 100).toFixed(2)}`;
  }
}
