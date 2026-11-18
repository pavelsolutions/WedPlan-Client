"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowUpRight,
  BadgeDollarSign,
  BriefcaseBusiness,
  CalendarDays,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  CreditCard,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { toast } from "@/components/ui/toast";
import { signOut } from "@/lib/auth-client";
import {
  dashboardNavigation,
  type DashboardIconName,
} from "@/lib/dashboard-navigation";
import type { DashboardRole } from "@/lib/dashboard-session";

export type DashboardUser = {
  name: string;
  email: string;
  image: string | null;
};

type DashboardLayoutProps = {
  role: DashboardRole;
  user: DashboardUser;
  children: ReactNode;
};

const roleLabels: Record<DashboardRole, string> = {
  admin: "Administrator",
  vendor: "Wedding vendor",
  customer: "Couple account",
};

const dashboardIcons: Record<DashboardIconName, LucideIcon> = {
  overview: LayoutDashboard,
  users: UsersRound,
  services: BriefcaseBusiness,
  transactions: CreditCard,
  add: Plus,
  bookings: CalendarDays,
  subscription: BadgeDollarSign,
  profile: Settings,
};

function getActiveHref(role: DashboardRole, pathname: string) {
  const items = dashboardNavigation[role];
  return (
    [...items]
      .filter(
        (item) =>
          pathname === item.href || pathname.startsWith(`${item.href}/`),
      )
      .sort((first, second) => second.href.length - first.href.length)[0]
      ?.href ?? items[0].href
  );
}

function DashboardSidebar({
  role,
  activeHref,
  isCollapsed = false,
  onNavigate,
}: {
  role: DashboardRole;
  activeHref: string;
  isCollapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="dashboard-sidebar__inner">
      <Link
        className="dashboard-brand"
        href="/"
        aria-label="WedPlan home"
        onClick={onNavigate}
      >
        <span className="dashboard-brand__mark">
          <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
        </span>
        <span>
          wedplan<span>.</span>
        </span>
      </Link>

      <div
        className="dashboard-sidebar__workspace"
        title={isCollapsed ? roleLabels[role] : undefined}
      >
        <span className="dashboard-sidebar__workspace-icon">
          {role === "admin" ? (
            <ShieldCheck size={16} aria-hidden="true" />
          ) : role === "vendor" ? (
            <BriefcaseBusiness size={16} aria-hidden="true" />
          ) : (
            <Heart size={16} aria-hidden="true" />
          )}
        </span>
        <span>
          <strong>{roleLabels[role]}</strong>
          <small>WedPlan workspace</small>
        </span>
      </div>

      <nav className="dashboard-navigation" aria-label={`${roleLabels[role]} navigation`}>
        {!isCollapsed ? (
          <p className="dashboard-navigation__label">WORKSPACE</p>
        ) : null}
        {dashboardNavigation[role].map((item) => {
          const Icon = dashboardIcons[item.icon];
          const isActive = item.href === activeHref;

          return (
            <Link
              className={`dashboard-navigation__link${isActive ? " dashboard-navigation__link--active" : ""}`}
              href={item.href}
              key={item.href}
              aria-current={isActive ? "page" : undefined}
              aria-label={isCollapsed ? item.label : undefined}
              title={isCollapsed ? item.label : undefined}
              onClick={onNavigate}
            >
              <Icon size={17} strokeWidth={1.8} aria-hidden="true" />
              <span className={isCollapsed ? "sr-only" : undefined}>{item.label}</span>
              {isActive ? <span className="dashboard-navigation__indicator" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="dashboard-sidebar__footer">
        <div className="dashboard-sidebar__note">
          <span>
            <Heart size={14} aria-hidden="true" />
          </span>
          <p>Made for all the little details that make a wedding yours.</p>
        </div>
        <Link
          href="/services"
          aria-label="Explore services"
          title={isCollapsed ? "Explore services" : undefined}
          onClick={onNavigate}
        >
          <span className={isCollapsed ? "sr-only" : undefined}>Explore services</span>
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function DashboardProfileMenu({
  role,
  user,
}: {
  role: DashboardRole;
  user: DashboardUser;
}) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const profileHref = dashboardNavigation[role].find(
    (item) => item.icon === "profile",
  )?.href;

  async function handleSignOut() {
    if (isSigningOut) return;

    setIsSigningOut(true);
    try {
      const result = await signOut();
      if (result.error) {
        toast.add({
          type: "error",
          title: "Sign out failed",
          description: result.error.message || "Please try again.",
        });
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.add({
        type: "error",
        title: "Sign out failed",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="dashboard-profile-trigger"
        aria-label="Open profile menu"
      >
        <Avatar className="dashboard-profile-trigger__avatar">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{user.name.slice(0, 1).toUpperCase()}</AvatarFallback>
        </Avatar>
        <span className="dashboard-profile-trigger__name">
          <strong>{user.name}</strong>
          <small>{roleLabels[role]}</small>
        </span>
        <ChevronDown size={15} aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="dashboard-profile-menu"
      >
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            <span className="dashboard-profile-menu__name">{user.name}</span>
            <span className="dashboard-profile-menu__email">{user.email}</span>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        {profileHref ? (
          <DropdownMenuItem onClick={() => router.push(profileHref)}>
            <CircleUserRound size={16} aria-hidden="true" />
            Profile settings
          </DropdownMenuItem>
        ) : null}
        <DropdownMenuItem
          variant="destructive"
          disabled={isSigningOut}
          onClick={() => void handleSignOut()}
        >
          <LogOut size={16} aria-hidden="true" />
          {isSigningOut ? "Signing out…" : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function DashboardLayout({
  role,
  user,
  children,
}: DashboardLayoutProps) {
  const pathname = usePathname();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const activeHref = getActiveHref(role, pathname);
  const activeItem = dashboardNavigation[role].find(
    (item) => item.href === activeHref,
  );

  return (
    <div className={`dashboard-shell${sidebarCollapsed ? " dashboard-shell--collapsed" : ""}`}>
      <aside className="dashboard-sidebar">
        <DashboardSidebar
          role={role}
          activeHref={activeHref}
          isCollapsed={sidebarCollapsed}
        />
      </aside>

      <div className="dashboard-main">
        <header className="dashboard-header">
          <div className="dashboard-header__heading">
            <Sheet
              open={mobileNavigationOpen}
              onOpenChange={setMobileNavigationOpen}
            >
              <SheetTrigger
                className="dashboard-mobile-menu"
                aria-label="Open dashboard navigation"
              >
                <Menu size={20} aria-hidden="true" />
              </SheetTrigger>
              <SheetContent
                side="left"
                className="dashboard-mobile-sheet"
                showCloseButton
              >
                <SheetTitle className="sr-only">WedPlan dashboard navigation</SheetTitle>
                <DashboardSidebar
                  role={role}
                  activeHref={activeHref}
                  onNavigate={() => setMobileNavigationOpen(false)}
                />
              </SheetContent>
            </Sheet>
            <button
              className="dashboard-sidebar-toggle"
              type="button"
              aria-label={
                sidebarCollapsed
                  ? "Expand dashboard navigation"
                  : "Collapse dashboard navigation"
              }
              aria-pressed={sidebarCollapsed}
              onClick={() => setSidebarCollapsed((collapsed) => !collapsed)}
            >
              {sidebarCollapsed ? (
                <ChevronRight size={19} aria-hidden="true" />
              ) : (
                <ChevronLeft size={19} aria-hidden="true" />
              )}
            </button>
            <div>
              <p className="dashboard-header__eyebrow">{roleLabels[role]}</p>
              <h1>{activeItem?.label ?? "Dashboard"}</h1>
              <p className="dashboard-header__description">
                {activeItem?.description}
              </p>
            </div>
          </div>

          <div className="dashboard-header__account">
            <span className="dashboard-header__welcome">Welcome back</span>
            <DashboardProfileMenu role={role} user={user} />
          </div>
        </header>

        <main className="dashboard-content">{children}</main>
      </div>
    </div>
  );
}
