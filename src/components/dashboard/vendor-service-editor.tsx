"use client";

import { useEffect, useState } from "react";
import {
  fetchVendorService,
  type VendorService,
} from "@/lib/vendor-dashboard-api";
import VendorServiceForm from "@/components/dashboard/vendor-service-form";
import {
  VendorErrorState,
  VendorSkeletonCards,
} from "@/components/dashboard/vendor-dashboard-ui";

export default function VendorServiceEditor({
  serviceId,
}: {
  serviceId: string;
}) {
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${serviceId}:${retryCount}`;
  const [state, setState] = useState<{
    key: string;
    service: VendorService | null;
    error?: string;
  }>({ key: "", service: null });
  const isLoading = state.key !== requestKey;
  const service = isLoading ? null : state.service;
  const error = isLoading ? null : state.error;

  useEffect(() => {
    const controller = new AbortController();
    void fetchVendorService(serviceId, controller.signal)
      .then((loadedService) => {
        if (!controller.signal.aborted) {
          setState({ key: requestKey, service: loadedService });
        }
      })
      .catch((requestError: unknown) => {
        if (!controller.signal.aborted) {
          setState({
            key: requestKey,
            service: null,
            error:
              requestError instanceof Error
                ? requestError.message
                : "The service could not be loaded.",
          });
        }
      });
    return () => controller.abort();
  }, [requestKey, serviceId]);

  if (isLoading) return <VendorSkeletonCards count={1} />;
  if (error) {
    return (
      <VendorErrorState
        title="We couldn’t load this service."
        message={error}
        onRetry={() => setRetryCount((count) => count + 1)}
      />
    );
  }
  if (!service) return null;
  return <VendorServiceForm key={service.id} service={service} />;
}
