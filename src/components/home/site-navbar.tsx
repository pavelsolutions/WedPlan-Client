"use client";

import { useState } from "react";
import {
  ArrowRight,
  ChevronDown,
  Heart,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/toast";
import { signOut, useSession } from "@/lib/auth-client";

const navigationLinks = [
  { label: "Home", href: "/" },
  { label: "Browse Services", href: "/services" },
];

export default function SiteNavbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const user = session?.user;
  const userName = user?.name?.trim() || "WedPlan member";
  const dashboardHref =
    user?.role === "admin"
      ? "/dashboard/admin"
      : user?.role === "vendor"
        ? "/dashboard/vendor"
        : user?.role === "customer"
          ? "/dashboard/customer"
          : "/";
  const profileSettingsHref =
    user?.role === "admin"
      ? "/dashboard/admin/profile"
      : user?.role === "vendor"
        ? "/dashboard/vendor/profile"
        : user?.role === "customer"
          ? "/dashboard/customer/profile"
          : null;

  function closeMenu() {
    setMenuOpen(false);
  }

  async function handleSignOut() {
    setIsSigningOut(true);

    try {
      const result = await signOut();
      if (result.error) {
        toast.add({
          type: "error",
          title: "Couldn’t sign out",
          description: result.error.message || "Please try again.",
        });
        return;
      }

      closeMenu();
      toast.add({
        type: "success",
        title: "Signed out",
        description: "You’ve been signed out of WedPlan.",
      });
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.add({
        type: "error",
        title: "Couldn’t sign out",
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="brand" href="/" aria-label="WedPlan home" onClick={closeMenu}>
          <span className="brand__mark">
            <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>wedplan<span className="brand__period">.</span></span>
        </Link>
        <button
          className="mobile-menu-toggle"
          type="button"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X size={21} aria-hidden="true" />
          ) : (
            <Menu size={21} aria-hidden="true" />
          )}
        </button>
        <nav
          id="primary-navigation"
          className={`site-nav${menuOpen ? " site-nav--open" : ""}`}
          aria-label="Main navigation"
        >
          {navigationLinks.map((link) => (
            <Link key={link.href} href={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ))}
          {isPending ? (
            <span className="site-nav__session-loading" role="status">
              Checking account…
            </span>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="site-profile-trigger"
                aria-label={`Open profile menu for ${userName}`}
              >
                <Avatar className="site-profile-trigger__avatar" aria-hidden="true">
                  {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                  <AvatarFallback>
                    {userName.slice(0, 1).toUpperCase() || <UserRound size={15} />}
                  </AvatarFallback>
                </Avatar>
                <span className="site-profile-trigger__name">{userName}</span>
                <ChevronDown
                  className="site-profile-trigger__chevron"
                  size={14}
                  aria-hidden="true"
                />
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={9}
                className="site-profile-menu"
              >
                <div className="site-profile-menu__user">
                  <Avatar className="site-profile-menu__avatar" aria-hidden="true">
                    {user.image ? <AvatarImage src={user.image} alt="" /> : null}
                    <AvatarFallback>
                      {userName.slice(0, 1).toUpperCase() || <UserRound size={16} />}
                    </AvatarFallback>
                  </Avatar>
                  <span className="site-profile-menu__details">
                    <strong>{userName}</strong>
                    <small>{user.email}</small>
                  </span>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  render={<Link href={dashboardHref} onClick={closeMenu} />}
                >
                  <LayoutDashboard aria-hidden="true" />
                  Dashboard
                </DropdownMenuItem>
                {profileSettingsHref ? (
                  <DropdownMenuItem
                    render={
                      <Link href={profileSettingsHref} onClick={closeMenu} />
                    }
                  >
                    <Settings2 aria-hidden="true" />
                    Profile Settings
                  </DropdownMenuItem>
                ) : null}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant="destructive"
                  disabled={isSigningOut}
                  onClick={handleSignOut}
                >
                  <LogOut aria-hidden="true" />
                  {isSigningOut ? "Signing out…" : "Logout"}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                className="site-nav__login"
                href="/signin"
                onClick={closeMenu}
              >
                Sign In
              </Link>
              <Link
                className="site-nav__cta"
                href="/signup"
                onClick={closeMenu}
              >
                Sign Up <ArrowRight size={15} aria-hidden="true" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
