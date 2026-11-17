import { weddingCategories, type WeddingCategory } from "@/lib/homepage-data";

export type BrowseService = {
  id: string;
  name: string;
  category: WeddingCategory;
  description: string;
  image: string | null;
  location: string;
  price: number;
  vendorName: string;
  approvalStatus: "approved";
  isActive: true;
};

export type ServiceVendor = {
  name: string | null;
  businessName: string | null;
  image: string | null;
};

export type ServiceDetails = BrowseService & {
  images: string[];
  vendorId: string | null;
  vendor: ServiceVendor | null;
};

export type ServicePageResult = {
  services: BrowseService[];
  page: number;
  total?: number;
  totalPages?: number;
  hasNextPage: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function readHttpUrl(value: unknown): string | null {
  const text = readString(value);
  if (!text) return null;

  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function normalizeService(value: unknown): BrowseService | null {
  if (!isRecord(value)) return null;

  const id = readString(value.id) ?? readString(value._id);
  const name = readString(value.serviceName) ?? readString(value.name);
  const category = readString(value.category);
  const description = readString(value.description) ?? "";
  const location = readString(value.location);
  const price = readNumber(value.price) ?? readNumber(value.startingPrice);
  const approvalStatus =
    readString(value.status) ?? readString(value.approvalStatus);

  if (
    !id ||
    !name ||
    !location ||
    price === null ||
    !weddingCategories.includes(category as WeddingCategory) ||
    approvalStatus?.toLowerCase() !== "approved" ||
    value.isActive !== true
  ) {
    return null;
  }

  const images = Array.isArray(value.images) ? value.images : [];
  const image =
    readHttpUrl(images[0]) ??
    readHttpUrl(value.image) ??
    readHttpUrl(value.imageUrl);
  const vendor = isRecord(value.vendor)
    ? value.vendor
    : isRecord(value.vendorId)
      ? value.vendorId
      : null;
  const vendorName =
    (vendor &&
      (readString(vendor.businessName) ??
        readString(vendor.name) ??
        readString(vendor.vendorName))) ||
    readString(value.vendorName) ||
    "Wedding vendor";

  return {
    id,
    name,
    category: category as WeddingCategory,
    description,
    image,
    location,
    price,
    vendorName,
    approvalStatus: "approved",
    isActive: true,
  };
}

function getArray(value: unknown): unknown[] | null {
  if (Array.isArray(value)) return value;
  if (!isRecord(value)) return null;

  if (Array.isArray(value.services)) return value.services;
  if (Array.isArray(value.data)) return value.data;
  if (isRecord(value.data)) {
    if (Array.isArray(value.data.services)) return value.data.services;
    if (Array.isArray(value.data.items)) return value.data.items;
  }

  return null;
}

function getRecord(
  value: unknown,
  key: string,
): Record<string, unknown> | null {
  return isRecord(value) && isRecord(value[key]) ? value[key] : null;
}

function getNumericField(
  sources: Array<Record<string, unknown> | null>,
  keys: string[],
): number | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      const value = readNumber(source[key]);
      if (value !== null) return value;
    }
  }
  return undefined;
}

function getBooleanField(
  sources: Array<Record<string, unknown> | null>,
  keys: string[],
): boolean | undefined {
  for (const source of sources) {
    if (!source) continue;
    for (const key of keys) {
      if (typeof source[key] === "boolean") return source[key];
    }
  }
  return undefined;
}

function getServicesEndpoint() {
  const configuredUrl =
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:5000/api/services"
      : "");
  if (!configuredUrl) {
    throw new Error(
      "The services API is not configured. Set NEXT_PUBLIC_API_URL to your backend base URL.",
    );
  }

  let endpoint: URL;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    throw new Error(
      "NEXT_PUBLIC_API_URL must be a valid absolute backend URL.",
    );
  }

  const path = endpoint.pathname.replace(/\/+$/, "");
  if (/\/api\/services$/i.test(path)) {
    endpoint.pathname = path;
  } else if (/\/api$/i.test(path)) {
    endpoint.pathname = `${path}/services`;
  } else {
    endpoint.pathname = `${path}/api/services`;
  }
  endpoint.search = "";
  endpoint.hash = "";
  return endpoint;
}

export async function fetchServiceDetails(
  id: string,
  signal: AbortSignal,
): Promise<ServiceDetails | null> {
  const response = await fetch(`/api/services/${encodeURIComponent(id)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (response.status === 404) return null;
    throw new Error("The service details API returned an invalid response.");
  }

  if (response.status === 404) return null;
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `The service details API returned HTTP ${response.status}.`;
    throw new Error(message);
  }

  const data = isRecord(payload) ? payload.data : null;
  const rawService =
    isRecord(data) && isRecord(data.service)
      ? data.service
      : isRecord(data)
        ? data
        : null;
  if (!rawService) {
    throw new Error("The service details API returned an invalid service.");
  }

  const normalized = normalizeService(rawService);
  if (!normalized) return null;

  const rawImages = Array.isArray(rawService.images)
    ? rawService.images
    : [];
  const images = [
    ...new Set(
      rawImages
        .map(readHttpUrl)
        .filter((image): image is string => image !== null),
    ),
  ];
  if (images.length === 0 && normalized.image) images.push(normalized.image);

  const rawVendor = isRecord(rawService.vendor) ? rawService.vendor : null;
  const vendor = rawVendor
    ? {
        name: readString(rawVendor.name),
        businessName: readString(rawVendor.businessName),
        image: readHttpUrl(rawVendor.image),
      }
    : null;
  const rawVendorId = rawService.vendorId;
  const vendorId =
    readString(rawVendorId) ??
    (isRecord(rawVendorId)
      ? readString(rawVendorId._id) ?? readString(rawVendorId.$oid)
      : null);

  return {
    ...normalized,
    images,
    vendorId,
    vendor,
  };
}

export async function fetchServices(
  filters: URLSearchParams,
  signal: AbortSignal,
  limit: number,
): Promise<ServicePageResult> {
  const endpoint = getServicesEndpoint();
  const requestedPage = Math.max(1, Number(filters.get("page")) || 1);
  const query = new URLSearchParams();

  for (const key of ["search", "category", "location", "sort"] as const) {
    const value = filters.get(key)?.trim();
    if (value) query.set(key, value);
  }
  query.set("page", String(requestedPage));
  query.set("limit", String(limit));
  endpoint.search = query.toString();

  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    if (!response.ok) {
      throw new Error(`The services API returned HTTP ${response.status}.`);
    }
    throw new Error("The services API returned an invalid response.");
  }

  if (!response.ok) {
    const error =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : isRecord(payload) && typeof payload.message === "string"
          ? payload.message
          : `The services API returned HTTP ${response.status}.`;
    throw new Error(error);
  }

  const items = getArray(payload);
  if (!items) {
    throw new Error("The services API response did not contain a service list.");
  }

  const services = items
    .map(normalizeService)
    .filter((service): service is BrowseService => service !== null);
  const data = getRecord(payload, "data");
  const pagination =
    getRecord(payload, "pagination") ??
    getRecord(payload, "meta") ??
    getRecord(data, "pagination") ??
    getRecord(data, "meta");
  const sources = [pagination, data, isRecord(payload) ? payload : null];
  const total = getNumericField(sources, [
    "total",
    "totalCount",
    "totalDocs",
    "count",
  ]);
  const totalPages =
    getNumericField(sources, ["totalPages", "pages", "pageCount"]) ??
    (total === undefined ? undefined : Math.ceil(total / limit));
  const hasNextPage =
    getBooleanField(sources, ["hasNextPage", "hasNext"]) ??
    (totalPages !== undefined
      ? requestedPage < totalPages
      : items.length >= limit);

  return {
    services,
    page: requestedPage,
    total,
    totalPages,
    hasNextPage,
  };
}
