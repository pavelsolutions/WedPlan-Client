"use client";

import { useEffect, useState } from "react";
import {
  Ban,
  Eye,
  Mail,
  Search,
  ShieldCheck,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  fetchAdminUser,
  fetchAdminUsers,
  setAdminUserBlocked,
  type AdminUser,
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

type UsersResult = Awaited<ReturnType<typeof fetchAdminUsers>>;
type UsersState = {
  key: string;
  result: UsersResult | null;
  error?: string;
};
type UserAction = { user: AdminUser; blocked: boolean };
type UserDetailState = {
  userId: string;
  user: AdminUser | null;
  error?: string;
};

function UserIdentity({ user }: { user: AdminUser }) {
  return (
    <span className="admin-identity">
      <Avatar className="admin-identity__avatar">
        {user.image ? <AvatarImage src={user.image} alt="" /> : null}
        <AvatarFallback>{user.name.slice(0, 1).toUpperCase() || "?"}</AvatarFallback>
      </Avatar>
      <span>
        <strong>{user.name}</strong>
        <small>{user.email}</small>
      </span>
    </span>
  );
}

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${page}:${role}:${search.trim()}:${retryCount}`;
  const [state, setState] = useState<UsersState>({ key: "", result: null });
  const [detailState, setDetailState] = useState<UserDetailState | null>(null);
  const [userAction, setUserAction] = useState<UserAction | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const isLoading = state.key !== requestKey;
  const result = isLoading ? null : state.result;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      void fetchAdminUsers(
        { page, limit: 100, search, role },
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
                : "User accounts could not be loaded.",
          });
        });
    }, search.trim() ? 250 : 0);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [page, role, search, requestKey]);

  useEffect(() => {
    const detailUserId = detailState?.userId;
    if (!detailUserId || detailState.user || detailState.error) return;
    const controller = new AbortController();
    void fetchAdminUser(detailUserId, controller.signal)
      .then((user) => {
        if (!controller.signal.aborted) {
          setDetailState({ userId: detailUserId, user });
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setDetailState({
            userId: detailUserId,
            user: null,
            error:
              requestError instanceof Error
                ? requestError.message
                : "User details could not be loaded.",
          });
        }
      });
    return () => controller.abort();
  }, [detailState]);

  async function confirmUserAction() {
    if (!userAction || isUpdating) return;
    setIsUpdating(true);
    try {
      const updatedUser = await setAdminUserBlocked(
        userAction.user.id,
        userAction.blocked,
      );
      setState((current) => ({
        ...current,
        result: current.result
          ? {
              ...current.result,
              users: current.result.users.map((user) =>
                user.id === updatedUser.id ? updatedUser : user,
              ),
            }
          : null,
      }));
      setDetailState((current) =>
        current?.user?.id === updatedUser.id
          ? { ...current, user: updatedUser }
          : current,
      );
      setUserAction(null);
      toast.add({
        type: "success",
        title: updatedUser.isBlocked ? "Account blocked" : "Account unblocked",
        description: updatedUser.isBlocked
          ? `${updatedUser.name} can no longer access protected features.`
          : `${updatedUser.name} can access protected features again.`,
      });
    } catch (requestError) {
      toast.add({
        type: "error",
        title: "Account access could not be changed",
        description:
          requestError instanceof Error ? requestError.message : "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <section className="admin-users-page">
      <AdminPageIntro
        title="Manage users"
        description="Find community members, review their account details, and manage platform access."
      />

      <div className="admin-filters admin-user-filters">
        <label className="admin-filter admin-filter--search">
          <span>Search users</span>
          <span className="admin-filter__control">
            <Search size={16} aria-hidden="true" />
            <Input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              maxLength={100}
              placeholder="Name or email address"
              aria-label="Search users by name or email"
            />
          </span>
        </label>
        <label className="admin-filter">
          <span>Account role</span>
          <select
            value={role}
            onChange={(event) => {
              setRole(event.target.value);
              setPage(1);
            }}
          >
            <option value="">All roles</option>
            <option value="customer">Customers</option>
            <option value="vendor">Vendors</option>
            <option value="admin">Admins</option>
          </select>
        </label>
      </div>

      {isLoading ? (
        <AdminTableSkeleton columns={5} />
      ) : error ? (
        <AdminFeedback
          title="We couldn’t load users."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : result && result.users.length > 0 ? (
        <>
          <div className="admin-table-summary">
            <span>
              Showing {result.users.length.toLocaleString()} of{" "}
              {result.pagination.total.toLocaleString()} accounts
            </span>
            <span>Only admins can change account access.</span>
          </div>
          <div className="admin-table-frame">
            <Table className="admin-data-table admin-users-table">
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Account status</TableHead>
                  <TableHead><span className="sr-only">Actions</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {result.users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell><UserIdentity user={user} /></TableCell>
                    <TableCell>
                      <span className="admin-role-badge">{user.role}</span>
                    </TableCell>
                    <TableCell>{formatAdminDate(user.createdAt)}</TableCell>
                    <TableCell>
                      <AdminStatusBadge status={user.isBlocked ? "blocked" : "active"} />
                    </TableCell>
                    <TableCell>
                      <div className="admin-row-actions">
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setDetailState({ userId: user.id, user: null })}
                        >
                          <Eye size={14} aria-hidden="true" />
                          Details
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          variant={user.isBlocked ? "outline" : "ghost"}
                          className={user.isBlocked ? "admin-unblock-button" : "admin-block-button"}
                          onClick={() =>
                            setUserAction({ user, blocked: !user.isBlocked })
                          }
                        >
                          {user.isBlocked ? (
                            <ShieldCheck size={14} aria-hidden="true" />
                          ) : (
                            <Ban size={14} aria-hidden="true" />
                          )}
                          {user.isBlocked ? "Unblock" : "Block"}
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
          title="No user accounts found"
          message={
            search || role
              ? "Try a different search or role filter."
              : "Registered customer and vendor accounts will appear here."
          }
        />
      )}

      <Dialog
        open={detailState !== null}
        onOpenChange={(open) => {
          if (!open) setDetailState(null);
        }}
      >
        <DialogContent className="admin-dialog">
          <DialogHeader>
            <p className="eyebrow">ACCOUNT DETAILS</p>
            <DialogTitle>
              {detailState?.user?.name ?? "User details"}
            </DialogTitle>
            <DialogDescription>
              Review this account’s profile and platform access.
            </DialogDescription>
          </DialogHeader>
          {detailState?.error ? (
            <p className="admin-inline-error" role="alert">{detailState.error}</p>
          ) : detailState?.user ? (
            <div className="admin-user-details">
              <UserIdentity user={detailState.user} />
              <div><span>Role</span><strong>{detailState.user.role}</strong></div>
              <div>
                <span>Access</span>
                <AdminStatusBadge status={detailState.user.isBlocked ? "blocked" : "active"} />
              </div>
              {detailState.user.businessName ? (
                <div><span>Business</span><strong>{detailState.user.businessName}</strong></div>
              ) : null}
              {detailState.user.subscriptionPlan ? (
                <div>
                  <span>Subscription</span>
                  <strong>
                    {detailState.user.subscriptionPlan}
                    {detailState.user.subscriptionExpiresAt
                      ? ` · through ${formatAdminDate(detailState.user.subscriptionExpiresAt)}`
                      : ""}
                  </strong>
                </div>
              ) : null}
              <div><span>Member since</span><strong>{formatAdminDate(detailState.user.createdAt)}</strong></div>
              <a href={`mailto:${detailState.user.email}`}>
                <Mail size={15} aria-hidden="true" /> Contact user
              </a>
            </div>
          ) : (
            <div className="admin-dialog-loading" aria-busy="true">
              <span /><span /><span /><span />
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={userAction !== null}
        onOpenChange={(open) => {
          if (!open && !isUpdating) setUserAction(null);
        }}
      >
        <AlertDialogContent className="admin-confirm-dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {userAction?.blocked ? "Block this account?" : "Restore account access?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {userAction?.blocked
                ? `${userAction.user.name} will be unable to use protected WedPlan features.`
                : `${userAction?.user.name} will regain access to protected WedPlan features.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={userAction?.blocked ? "destructive" : "default"}
              disabled={isUpdating}
              onClick={(event) => {
                event.preventDefault();
                void confirmUserAction();
              }}
            >
              {isUpdating
                ? "Updating…"
                : userAction?.blocked
                  ? "Block account"
                  : "Unblock account"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
}
