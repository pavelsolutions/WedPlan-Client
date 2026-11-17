"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import {
  AlertCircle,
  ArrowDownWideNarrow,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { weddingCategories } from "@/lib/homepage-data";
import { fetchServices, type BrowseService } from "@/lib/services-api";
import ServiceListingCard from "./service-listing-card";

const pageSize = 9;
const sortOptions = ["price_asc", "price_desc"] as const;
type SortOption = (typeof sortOptions)[number];

function getValidSort(value: string | null): SortOption | "" {
  return sortOptions.includes(value as SortOption) ? (value as SortOption) : "";
}

export function ServicesGridSkeleton() {
  return (
    <div
      className="services-grid"
      aria-label="Loading wedding services"
      aria-busy="true"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <div className="service-listing-skeleton" key={index}>
          <div className="service-listing-skeleton__image" />
          <div className="service-listing-skeleton__body">
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ServicesBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paramsKey = searchParams.toString();
  const requestParams = useMemo(
    () => new URLSearchParams(paramsKey),
    [paramsKey],
  );
  const categoryValue = requestParams.get("category") ?? "";
  const category = weddingCategories.includes(
    categoryValue as (typeof weddingCategories)[number],
  )
    ? categoryValue
    : "";
  const sort = getValidSort(requestParams.get("sort"));
  const page = Math.max(1, Number(requestParams.get("page")) || 1);
  const searchValue = requestParams.get("search") ?? "";
  const locationValue = requestParams.get("location") ?? "";
  const [retryCount, setRetryCount] = useState(0);
  const requestKey = `${paramsKey}:${retryCount}`;
  const [resultState, setResultState] = useState<{
    key: string;
    services: BrowseService[];
    total?: number;
    totalPages?: number;
    hasNextPage: boolean;
    error?: string;
  }>({
    key: "",
    services: [],
    hasNextPage: false,
  });
  const isLoading = resultState.key !== requestKey;
  const services = isLoading ? [] : resultState.services;
  const total = isLoading ? undefined : resultState.total;
  const totalPages = isLoading ? undefined : resultState.totalPages;
  const hasNextPage = !isLoading && resultState.hasNextPage;
  const error = isLoading ? null : resultState.error;

  const updateQuery = useCallback(
    (changes: Record<string, string>, resetPage = true) => {
      const nextParams = new URLSearchParams(paramsKey);
      for (const [key, value] of Object.entries(changes)) {
        if (value) nextParams.set(key, value);
        else nextParams.delete(key);
      }
      if (resetPage) nextParams.delete("page");
      const query = nextParams.toString();
      router.replace(query ? `/services?${query}` : "/services", {
        scroll: false,
      });
    },
    [paramsKey, router],
  );

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    updateQuery({
      search: String(formData.get("search") ?? "").trim(),
      location: String(formData.get("location") ?? "").trim(),
    });
  }

  function clearFilters() {
    router.replace("/services", { scroll: false });
  }

  useEffect(() => {
    const controller = new AbortController();

    void fetchServices(requestParams, controller.signal, pageSize)
      .then((result) => {
        setResultState({
          key: requestKey,
          services: result.services,
          total: result.total,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
        });
      })
      .catch((fetchError: unknown) => {
        if (controller.signal.aborted) return;
        setResultState({
          key: requestKey,
          services: [],
          hasNextPage: false,
          error:
            fetchError instanceof Error
              ? fetchError.message
              : "Services couldn’t be loaded. Please try again.",
        });
      });

    return () => controller.abort();
  }, [requestKey, requestParams]);

  function goToPage(nextPage: number) {
    const nextParams = new URLSearchParams(paramsKey);
    nextParams.set("page", String(nextPage));
    router.replace(`/services?${nextParams.toString()}`, { scroll: false });
  }

  const hasFilters =
    Boolean(searchValue || category || locationValue || sort);
  const resultSummary =
    total === undefined
      ? `${services.length} ${services.length === 1 ? "service" : "services"} on this page`
      : `${total.toLocaleString()} ${total === 1 ? "service" : "services"} found`;

  return (
    <main className="services-page">
      <section className="services-hero">
        <div className="page-container services-hero__content">
          <p className="eyebrow">The people behind your day</p>
          <h1>Find the right team for your <em>“I do.”</em></h1>
          <p className="services-hero__description">
            Browse trusted wedding professionals, compare what matters, and
            discover the people who make your celebration feel like you.
          </p>
          <div className="services-hero__note">
            <span aria-hidden="true">✦</span>
            Every listing is approved and currently available
          </div>
        </div>
      </section>

      <section className="page-container services-content" aria-labelledby="services-heading">
        <div className="services-content__heading">
          <div>
            <p className="eyebrow">Make it yours</p>
            <h2 id="services-heading">Browse wedding services</h2>
          </div>
          <p className="services-content__count" aria-live="polite">
            {!isLoading && !error ? resultSummary : "Find your perfect fit"}
          </p>
        </div>

        <form
          className="services-filters"
          key={`${searchValue}\u0000${locationValue}`}
          onSubmit={handleSearch}
        >
          <label className="services-filter services-filter--search">
            <span>Search by name</span>
            <span className="services-filter__input">
              <Search size={17} aria-hidden="true" />
              <input
                name="search"
                type="search"
                defaultValue={searchValue}
                placeholder="Photographer, venue, florist…"
              />
            </span>
          </label>
          <label className="services-filter">
            <span>Category</span>
            <span className="services-filter__select">
              <SlidersHorizontal size={16} aria-hidden="true" />
              <select
                name="category"
                value={category}
                onChange={(event) =>
                  updateQuery({ category: event.currentTarget.value })
                }
              >
                <option value="">All categories</option>
                {weddingCategories.map((item) => (
                  <option value={item} key={item}>
                    {item}
                  </option>
                ))}
              </select>
            </span>
          </label>
          <label className="services-filter">
            <span>Location</span>
            <span className="services-filter__input">
              <MapPin size={16} aria-hidden="true" />
              <input
                name="location"
                type="search"
                defaultValue={locationValue}
                placeholder="City or region"
              />
            </span>
          </label>
          <label className="services-filter">
            <span>Sort by price</span>
            <span className="services-filter__select">
              <ArrowDownWideNarrow size={16} aria-hidden="true" />
              <select
                name="sort"
                value={sort}
                onChange={(event) => updateQuery({ sort: event.currentTarget.value })}
              >
                <option value="">Recommended</option>
                <option value="price_asc">Low to high</option>
                <option value="price_desc">High to low</option>
              </select>
            </span>
          </label>
          <Button className="services-filters__submit" type="submit">
            <Search size={16} aria-hidden="true" />
            Search
          </Button>
          {hasFilters ? (
            <button
              className="services-filters__clear"
              type="button"
              onClick={clearFilters}
            >
              <X size={15} aria-hidden="true" /> Clear filters
            </button>
          ) : null}
        </form>

        {isLoading ? (
          <ServicesGridSkeleton />
        ) : error ? (
          <div className="services-state services-state--error" role="alert">
            <span className="services-state__icon">
              <AlertCircle size={23} aria-hidden="true" />
            </span>
            <h2>We couldn’t load services</h2>
            <p>{error}</p>
            <Button
              type="button"
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </Button>
          </div>
        ) : services.length === 0 ? (
          <div className="services-state" role="status">
            <span className="services-state__icon">
              <Search size={22} aria-hidden="true" />
            </span>
            <h2>{hasFilters ? "No services match just yet" : "No services to show yet"}</h2>
            <p>
              {hasFilters
                ? "Try a different search or clear some filters to see more wedding professionals."
                : "Approved and available wedding services will appear here as vendors join WedPlan."}
            </p>
            {hasFilters ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </div>
        ) : (
          <>
            <div className="services-grid" aria-live="polite">
              {services.map((service) => (
                <ServiceListingCard key={service.id} service={service} />
              ))}
            </div>
            <nav className="services-pagination" aria-label="Services pages">
              <Button
                type="button"
                variant="outline"
                className="services-pagination__button"
                disabled={page <= 1}
                onClick={() => goToPage(page - 1)}
              >
                <ChevronLeft size={16} aria-hidden="true" />
                Previous
              </Button>
              <span aria-current="page">
                Page {page}
                {totalPages ? ` of ${totalPages}` : ""}
              </span>
              <Button
                type="button"
                variant="outline"
                className="services-pagination__button"
                disabled={!hasNextPage}
                onClick={() => goToPage(page + 1)}
              >
                Next
                <ChevronRight size={16} aria-hidden="true" />
              </Button>
            </nav>
          </>
        )}
      </section>
    </main>
  );
}
