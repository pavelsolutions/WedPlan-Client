"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, LogOut, Sparkles } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

type DashboardWelcomeProps = {
  name: string;
  role: "customer" | "vendor";
};

export default function DashboardWelcome({
  name,
  role,
}: DashboardWelcomeProps) {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isVendor = role === "vendor";

  async function handleSignOut() {
    setIsSigningOut(true);
    setError(null);
    try {
      const result = await signOut();
      if (result.error) {
        setError(result.error.message || "We couldn’t sign you out.");
        return;
      }

      router.replace("/");
      router.refresh();
    } catch (signOutError) {
      setError(
        signOutError instanceof Error
          ? signOutError.message
          : "We couldn’t sign you out. Please try again.",
      );
    } finally {
      setIsSigningOut(false);
    }
  }

  return (
    <main className="dashboard-welcome">
      <header className="dashboard-welcome__header">
        <Link className="brand" href="/" aria-label="WedPlan home">
          <span className="brand__mark">
            <Heart size={19} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <span>wedplan<span className="brand__period">.</span></span>
        </Link>
        <div className="dashboard-welcome__account">
          <span>{name}</span>
          <Button
            variant="outline"
            className="dashboard-welcome__signout"
            type="button"
            disabled={isSigningOut}
            onClick={handleSignOut}
          >
            <LogOut size={15} aria-hidden="true" />
            {isSigningOut ? "Signing out…" : "Sign out"}
          </Button>
        </div>
      </header>

      <section className="dashboard-welcome__content">
        <span className="dashboard-welcome__icon">
          {isVendor ? (
            <Sparkles size={25} aria-hidden="true" />
          ) : (
            <Heart size={25} aria-hidden="true" />
          )}
        </span>
        <p className="eyebrow">{isVendor ? "VENDOR SPACE" : "YOUR WEDPLAN"}</p>
        <h1>
          {isVendor ? "Welcome to your vendor space." : "Your day, your way."}
        </h1>
        <p>
          {isVendor
            ? `Welcome, ${name}. Your WedPlan vendor account is ready. Service management is coming soon.`
            : `Welcome, ${name}. Start exploring the people and details that will make your wedding feel like you.`}
        </p>
        {error ? (
          <p className="auth-notice auth-notice--error" role="alert">
            {error}
          </p>
        ) : null}
        <Link className="button button--primary" href="/#categories">
          Explore wedding services <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </section>
    </main>
  );
}
