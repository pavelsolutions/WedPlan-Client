"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Crown,
  Infinity as InfinityIcon,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import {
  fetchVendorSubscription,
  type VendorSubscription,
} from "@/lib/vendor-dashboard-api";
import {
  VendorErrorState,
  VendorSkeletonCards,
} from "@/components/dashboard/vendor-dashboard-ui";

type SubscriptionState = {
  key: number;
  data: VendorSubscription | null;
  error?: string;
};

function PlanCard({
  premium,
  current,
}: {
  premium: boolean;
  current: boolean;
}) {
  return (
    <article
      className={`vendor-plan-card${premium ? " vendor-plan-card--premium" : ""}${current ? " vendor-plan-card--current" : ""}`}
    >
      <div className="vendor-plan-card__heading">
        <span className="vendor-plan-card__icon">
          {premium ? <Crown size={20} aria-hidden="true" /> : <Sparkles size={20} aria-hidden="true" />}
        </span>
        <div>
          <h3>{premium ? "Premium" : "Free"}</h3>
          <small>
            {current
              ? "Your current plan"
              : premium
                ? "For growing businesses"
                : "A simple way to get started"}
          </small>
        </div>
        {current ? <span className="vendor-plan-card__current">CURRENT</span> : null}
      </div>
      <p className="vendor-plan-card__limit">
        {premium ? (
          <><InfinityIcon size={20} aria-hidden="true" /> Unlimited active services</>
        ) : (
          <><BadgeCheck size={18} aria-hidden="true" /> Up to 3 active services</>
        )}
      </p>
      <ul>
        <li><ShieldCheck size={15} aria-hidden="true" /> Admin review for every listing</li>
        <li><BadgeCheck size={15} aria-hidden="true" /> Manage bookings and availability</li>
      </ul>
    </article>
  );
}

export default function VendorSubscription() {
  const [retryCount, setRetryCount] = useState(0);
  const [state, setState] = useState<SubscriptionState>({
    key: -1,
    data: null,
  });
  const isLoading = state.key !== retryCount;
  const data = isLoading ? null : state.data;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchVendorSubscription(controller.signal)
      .then((response) => {
        if (!controller.signal.aborted) {
          setState({ key: retryCount, data: response });
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: retryCount,
            data: null,
            error:
              requestError instanceof Error
                ? requestError.message
                : "Subscription details could not be loaded.",
          });
        }
      });
    return () => controller.abort();
  }, [retryCount]);

  return (
    <section className="vendor-subscription-page">
      <div className="vendor-page-intro">
        <div>
          <p className="eyebrow">GROW AT YOUR OWN PACE</p>
          <h2>Subscription</h2>
          <p>Your service limit is enforced by WedPlan when you create or activate listings.</p>
        </div>
      </div>

      {isLoading ? (
        <VendorSkeletonCards count={2} />
      ) : error ? (
        <VendorErrorState
          title="We couldn’t load your subscription."
          message={error}
          onRetry={() => setRetryCount((count) => count + 1)}
        />
      ) : data ? (
        <>
          {data.expired ? (
            <div className="vendor-subscription-notice" role="status">
              Your Premium period has ended. Your account is currently on the Free plan.
            </div>
          ) : null}
          <div className="vendor-subscription-current">
            <span className="vendor-subscription-current__icon">
              {data.plan === "premium" ? <Crown size={21} aria-hidden="true" /> : <Sparkles size={21} aria-hidden="true" />}
            </span>
            <div>
              <p className="eyebrow">CURRENT PLAN</p>
              <h3>{data.plan === "premium" ? "Premium" : "Free"}</h3>
              <p>
                {data.plan === "premium"
                  ? `${data.activeServices} active service${data.activeServices === 1 ? "" : "s"} · unlimited listings${data.expiresAt ? ` · renews or ends ${new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", year: "numeric" }).format(new Date(data.expiresAt))}` : ""}.`
                  : `${data.activeServices} of ${data.activeServiceLimit ?? 3} active service slots are in use.`}
              </p>
            </div>
          </div>
          <div className="vendor-plan-grid">
            <PlanCard premium={false} current={data.plan === "free"} />
            <PlanCard premium current={data.plan === "premium"} />
          </div>
          <div className="vendor-subscription-help" role="note">
            <ShieldCheck size={17} aria-hidden="true" />
            <p>
              Your plan and service allowance are verified by WedPlan. Changes take effect after a confirmed subscription update.
            </p>
          </div>
        </>
      ) : null}
      <Link className="vendor-back-link" href="/dashboard/vendor">
        <ArrowLeft size={14} aria-hidden="true" /> Back to overview
      </Link>
    </section>
  );
}
