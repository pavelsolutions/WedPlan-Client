import { weddingCategories, type WeddingCategory } from "@/lib/homepage-data";

export type VendorService = {
  id: string;
  serviceName: string;
  category: WeddingCategory;
  description: string;
  price: number;
  location: string;
  images: string[];
  status: "pending" | "approved" | "rejected" | string;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
};

export type VendorServiceInput = Pick<
  VendorService,
  "serviceName" | "category" | "description" | "price" | "location" | "images"
>;

export type VendorBooking = {
  id: string;
  status: "pending" | "accepted" | "rejected" | "cancelled" | string;
  eventDate: string | null;
  eventLocation: string;
  message: string;
  createdAt: string | null;
  service: { id: string; name: string; image: string | null } | null;
  customer: {
    id: string | null;
    name: string;
    email: string | null;
    image: string | null;
  };
};

export type VendorPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type VendorOverview = {
  statistics: {
    totalServices: number;
    activeServices: number;
    pendingBookingRequests: number;
    acceptedBookings: number;
  };
  subscription: {
    plan: "free" | "premium";
    expiresAt: string | null;
    expired: boolean;
    activeServiceLimit: number | null;
  };
};

export type VendorSubscription = VendorOverview["subscription"] & {
  activeServices: number;
};

export type VendorProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  businessName: string | null;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: string | null;
};

export type VendorServicePage = {
  services: VendorService[];
  activeServices: number;
  pagination: VendorPagination;
  subscription: VendorOverview["subscription"];
};

export type VendorBookingPage = {
  bookings: VendorBooking[];
  pagination: VendorPagination;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readUrl(value: unknown): string | null {
  const text = readString(value);
  if (!text?.trim()) return null;
  try {
    const url = new URL(text);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function readNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function readCount(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function readDate(value: unknown): string | null {
  if (typeof value === "string") return value;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString();
  }
  return null;
}

async function requestJson(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
    ...init,
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "The vendor API returned an invalid response."
        : `The vendor API returned HTTP ${response.status}.`,
    );
  }
  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `The vendor API returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

function getData(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("The vendor API returned incomplete data.");
  }
  return payload.data;
}

function readPagination(value: unknown): VendorPagination {
  if (!isRecord(value)) {
    throw new Error("The vendor API returned invalid pagination.");
  }
  const page = readCount(value.page);
  const limit = readCount(value.limit);
  const total = readCount(value.total);
  const totalPages = readCount(value.totalPages);
  if (
    page === null ||
    limit === null ||
    total === null ||
    totalPages === null ||
    typeof value.hasNextPage !== "boolean"
  ) {
    throw new Error("The vendor API returned invalid pagination.");
  }
  return { page, limit, total, totalPages, hasNextPage: value.hasNextPage };
}

function readSubscription(value: unknown): VendorOverview["subscription"] {
  if (!isRecord(value)) {
    throw new Error("The subscription API returned invalid plan data.");
  }
  const plan = readString(value.plan)?.toLowerCase();
  if (
    (plan !== "free" && plan !== "premium") ||
    typeof value.expired !== "boolean"
  ) {
    throw new Error("The subscription API returned invalid plan data.");
  }
  const limit =
    value.activeServiceLimit === null
      ? null
      : readCount(value.activeServiceLimit);
  if (value.activeServiceLimit !== null && limit === null) {
    throw new Error("The subscription API returned invalid plan limits.");
  }
  return {
    plan,
    expiresAt: readDate(value.expiresAt),
    expired: value.expired,
    activeServiceLimit: limit,
  };
}

function normalizeVendorService(value: unknown): VendorService {
  if (!isRecord(value)) {
    throw new Error("The services API returned an invalid service.");
  }
  const id = readString(value.id);
  const serviceName = readString(value.serviceName);
  const category = readString(value.category);
  const price = readNumber(value.price);
  const location = readString(value.location);
  if (
    !id ||
    !serviceName ||
    !weddingCategories.includes(category as WeddingCategory) ||
    price === null ||
    !location ||
    typeof value.isActive !== "boolean"
  ) {
    throw new Error("The services API returned an invalid service.");
  }
  return {
    id,
    serviceName,
    category: category as WeddingCategory,
    description: readString(value.description) ?? "",
    price,
    location,
    images: Array.isArray(value.images)
      ? value.images.map(readUrl).filter((image): image is string => image !== null)
      : [],
    status: readString(value.status) ?? "pending",
    isActive: value.isActive,
    createdAt: readDate(value.createdAt),
    updatedAt: readDate(value.updatedAt),
  };
}

function normalizeVendorBooking(value: unknown): VendorBooking {
  if (!isRecord(value)) {
    throw new Error("The bookings API returned an invalid booking.");
  }
  const id = readString(value.id);
  const status = readString(value.status);
  if (!id || !status) {
    throw new Error("The bookings API returned an invalid booking.");
  }
  let service: VendorBooking["service"] = null;
  if (isRecord(value.service)) {
    const id = readString(value.service.id);
    const name = readString(value.service.name);
    if (!id || !name) {
      throw new Error("The bookings API returned invalid service details.");
    }
    service = { id, name, image: readUrl(value.service.image) };
  }
  const customer = isRecord(value.customer) ? value.customer : {};
  return {
    id,
    status: status.toLowerCase(),
    eventDate: readDate(value.eventDate),
    eventLocation: readString(value.eventLocation) ?? "",
    message: readString(value.message) ?? "",
    createdAt: readDate(value.createdAt),
    service,
    customer: {
      id: readString(customer.id),
      name: readString(customer.name) ?? "WedPlan customer",
      email: readString(customer.email),
      image: readUrl(customer.image),
    },
  };
}

function normalizeVendorProfile(value: unknown): VendorProfile {
  if (!isRecord(value)) {
    throw new Error("The profile API returned invalid profile data.");
  }
  const id = readString(value.id);
  const name = readString(value.name);
  const email = readString(value.email);
  if (!id || !name || !email) {
    throw new Error("The profile API returned incomplete profile data.");
  }
  return {
    id,
    name,
    email,
    image: readUrl(value.image),
    businessName: readString(value.businessName),
    subscriptionPlan: readString(value.subscriptionPlan),
    subscriptionExpiresAt: readDate(value.subscriptionExpiresAt),
  };
}

export async function fetchVendorOverview(
  signal?: AbortSignal,
): Promise<VendorOverview> {
  const data = getData(
    await requestJson("/api/vendor/overview", { signal }),
  );
  if (!isRecord(data.statistics)) {
    throw new Error("The overview API returned invalid statistics.");
  }
  const keys = [
    "totalServices",
    "activeServices",
    "pendingBookingRequests",
    "acceptedBookings",
  ] as const;
  const statistics: VendorOverview["statistics"] = {
    totalServices: 0,
    activeServices: 0,
    pendingBookingRequests: 0,
    acceptedBookings: 0,
  };
  for (const key of keys) {
    const count = readCount(data.statistics[key]);
    if (count === null) {
      throw new Error("The overview API returned invalid statistics.");
    }
    statistics[key] = count;
  }
  return { statistics, subscription: readSubscription(data.subscription) };
}

export async function fetchVendorSubscription(
  signal?: AbortSignal,
): Promise<VendorSubscription> {
  const data = getData(
    await requestJson("/api/vendor/subscription", { signal }),
  );
  const subscription = readSubscription(data);
  const activeServices = readCount(data.activeServices);
  if (activeServices === null) {
    throw new Error("The subscription API returned invalid service counts.");
  }
  return { ...subscription, activeServices };
}

export async function fetchVendorServices(
  page = 1,
  limit = 12,
  signal?: AbortSignal,
): Promise<VendorServicePage> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const data = getData(
    await requestJson(`/api/vendor/services?${query}`, { signal }),
  );
  if (!Array.isArray(data.services)) {
    throw new Error("The services API did not return a service list.");
  }
  const activeServices = readCount(data.activeServices);
  if (activeServices === null) {
    throw new Error("The services API returned an invalid active service count.");
  }
  return {
    services: data.services.map(normalizeVendorService),
    activeServices,
    pagination: readPagination(data.pagination),
    subscription: readSubscription(data.subscription),
  };
}

export async function saveVendorService(
  input: VendorServiceInput,
  serviceId?: string,
): Promise<VendorService> {
  const payload = await requestJson(
    serviceId
      ? `/api/vendor/services/${encodeURIComponent(serviceId)}`
      : "/api/vendor/services",
    {
      method: serviceId ? "PATCH" : "POST",
      body: JSON.stringify(input),
    },
  );
  return normalizeVendorService(getData(payload).service);
}

export async function fetchVendorService(
  serviceId: string,
  signal?: AbortSignal,
): Promise<VendorService> {
  const payload = await requestJson(
    `/api/vendor/services/${encodeURIComponent(serviceId)}`,
    { signal },
  );
  return normalizeVendorService(getData(payload).service);
}

export async function setVendorServiceAvailability(
  serviceId: string,
  isActive: boolean,
): Promise<VendorService> {
  const payload = await requestJson(
    `/api/vendor/services/${encodeURIComponent(serviceId)}`,
    {
      method: "PATCH",
      body: JSON.stringify({ isActive }),
    },
  );
  return normalizeVendorService(getData(payload).service);
}

export async function deleteVendorService(serviceId: string): Promise<void> {
  await requestJson(
    `/api/vendor/services/${encodeURIComponent(serviceId)}`,
    { method: "DELETE" },
  );
}

export async function fetchVendorBookings(
  page = 1,
  limit = 10,
  signal?: AbortSignal,
): Promise<VendorBookingPage> {
  const query = new URLSearchParams({ page: String(page), limit: String(limit) });
  const data = getData(
    await requestJson(`/api/vendor/bookings?${query}`, { signal }),
  );
  if (!Array.isArray(data.bookings)) {
    throw new Error("The bookings API did not return a booking list.");
  }
  return {
    bookings: data.bookings.map(normalizeVendorBooking),
    pagination: readPagination(data.pagination),
  };
}

export async function updateVendorBookingStatus(
  bookingId: string,
  status: "accepted" | "rejected",
): Promise<void> {
  const payload = await requestJson(
    `/api/vendor/bookings/${encodeURIComponent(bookingId)}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
  const booking = getData(payload).booking;
  if (!isRecord(booking) || booking.status !== status) {
    throw new Error("The bookings API returned an invalid status update.");
  }
}

export async function fetchVendorProfile(
  signal?: AbortSignal,
): Promise<VendorProfile> {
  return normalizeVendorProfile(
    getData(await requestJson("/api/vendor/profile", { signal })),
  );
}

export async function updateVendorProfile(input: {
  name: string;
  businessName: string | null;
  image: string | null;
}): Promise<VendorProfile> {
  return normalizeVendorProfile(
    getData(
      await requestJson("/api/vendor/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    ),
  );
}

export async function uploadVendorServiceImage(
  file: File,
  signal?: AbortSignal,
): Promise<string> {
  const formData = new FormData();
  formData.append("image", file);
  const response = await fetch("/api/upload/profile-image", {
    method: "POST",
    body: formData,
    signal,
  });
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The image upload service returned an invalid response.");
  }
  const url = isRecord(payload) ? readUrl(payload.url) : null;
  if (!response.ok || !url) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "The service image could not be uploaded.";
    throw new Error(message);
  }
  return url;
}
