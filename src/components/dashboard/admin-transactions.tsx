"use client";

import { useEffect, useState } from "react";
import { CircleDollarSign, LockKeyhole, ReceiptText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  fetchAdminTransactions,
  type AdminTransaction,
} from "@/lib/admin-dashboard-api";
import {
  AdminEmptyState,
  AdminFeedback,
  AdminPageIntro,
  AdminPagination,
  AdminStatusBadge,
  AdminTableSkeleton,
  formatAdminAmount,
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

type TransactionsResult = Awaited<ReturnType<typeof fetchAdminTransactions>>;
type TransactionsState = {
  key: string;
  result: TransactionsResult | null;
  error?: string;
};

function TransactionVendor({ transaction }: { transaction: AdminTransaction }) {
  const vendor = transaction.vendor;
  return (
    <span className="admin-identity">
      <Avatar className="admin-identity__avatar">
        {vendor?.image ? <AvatarImage src={vendor.image} alt="" /> : null}
        <AvatarFallback>{vendor?.name.slice(0, 1).toUpperCase() ?? "?"}</AvatarFallback>
      </Avatar>
      <span>
        <strong>{vendor?.name ?? "Vendor unavailable"}</strong>
        <small>{vendor?.email ?? "Vendor account not found"}</small>
      </span>
    </span>
  );
}

export default function AdminTransactions() {
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${status}:${retryCount}`;
  const [state, setState] = useState<TransactionsState>({
    key: "",
    result: null,
  });
  const isLoading = state.key !== requestKey;
  const result = isLoading ? null : state.result;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchAdminTransactions(page, 15, status, controller.signal)
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
              : "Transactions could not be loaded.",
        });
      });
    return () => controller.abort();
  }, [page, status, requestKey]);

  return (
    <section className="admin-transactions-page">
      <AdminPageIntro
        title="Transactions"
        description="Review subscription payment activity recorded by WedPlan’s payment processing."
      />

      <div className="admin-readonly-note" role="note">
        <span><LockKeyhole size={17} aria-hidden="true" /></span>
        <div>
          <strong>Payment records are read-only</strong>
          <p>Payment outcomes are set by verified payment processing. Administrators can’t mark a failed payment as successful.</p>
        </div>
        <ReceiptText size={20} aria-hidden="true" />
      </div>

      <div className="admin-transaction-toolbar">
        <div>
          <p className="eyebrow">SUBSCRIPTION ACTIVITY</p>
          <h3>Payment history</h3>
        </div>
        <label className="admin-filter">
          <span>Payment status</span>
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All statuses</option>
            <option value="paid">Paid</option>
            <option value="failed">Failed</option>
            <option value="refunded">Refunded</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <AdminTableSkeleton columns={5} />
      ) : error ? (
        <AdminFeedback
          title="We couldn’t load transactions."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : result && result.transactions.length > 0 ? (
        <>
          <div className="admin-table-summary">
            <span>{result.pagination.total.toLocaleString()} transactions</span>
            <span>Payment outcomes from verified processing</span>
          </div>
          <div className="admin-table-frame">
            <Table className="admin-data-table admin-transactions-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Subscription plan</TableHead>
                  <TableHead>Payment amount</TableHead>
                  <TableHead>Payment status</TableHead>
                  <TableHead>Transaction date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell><TransactionVendor transaction={transaction} /></TableCell>
                    <TableCell>
                      <span className="admin-plan-cell">
                        <CircleDollarSign size={16} aria-hidden="true" />
                        {transaction.plan}
                      </span>
                    </TableCell>
                    <TableCell className="admin-amount-cell">
                      {formatAdminAmount(transaction.amount, transaction.currency)}
                    </TableCell>
                    <TableCell>
                      <AdminStatusBadge status={transaction.status} />
                    </TableCell>
                    <TableCell>{formatAdminDate(transaction.createdAt)}</TableCell>
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
          title="No transactions found"
          message={
            status
              ? `There are no ${status} subscription transactions to show.`
              : "Verified vendor subscription payments will appear here."
          }
        />
      )}
    </section>
  );
}
