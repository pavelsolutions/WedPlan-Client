import { weddingCategories, type WeddingCategory } from "@/lib/homepage-data";

export type AdminPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
};

export type AdminOverviewStatistics = {
  totalUsers: number;
  totalVendors: number;
  totalCustomers: number;
  totalServices: number;
  pendingServices: number;
  totalTransactions: number;
};

export type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "vendor" | "customer" | "unknown";
  isBlocked: boolean;
  image: string | null;
  businessName: string | null;
  subscriptionPlan: string | null;
  subscriptionExpiresAt: string | null;
  createdAt: string | null;
};

export type AdminServiceStatus = "pending" | "approved" | "rejected" | string;

export type AdminService = {
  id: string;
  serviceName: string;
  category: string;
  description: string;
  price: number | null;
  location: string;
  image: string | null;
  status: AdminServiceStatus;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
  vendor: {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
  } | null;
};

export type AdminTransaction = {
  id: string;
  plan: string;
  amount: number | null;
  currency: string;
  status: string;
  createdAt: string | null;
  vendor: {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
  } | null;
};

export type AdminUserFilters = {
  search: string;
  role: string;
  page: number;
  limit: number;
};

export type AdminServiceFilters = {
  search: string;
  category: string;
  status: string;
  availability: string;
  page: number;
  limit: number;
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

async function requestJson(url: string, init?: RequestInit): Promise<unknown> {
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
        ? "The admin API returned an invalid response."
        : `The admin API returned HTTP ${response.status}.`,
    );
  }
  if (!response.ok) {
    throw new Error(
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `The admin API returned HTTP ${response.status}.`,
    );
  }
  return payload;
}

function getData(payload: unknown): Record<string, unknown> {
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("The admin API returned incomplete data.");
  }
  return payload.data;
}

function readPagination(value: unknown): AdminPagination {
  if (!isRecord(value)) {
    throw new Error("The admin API returned invalid pagination.");
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
    throw new Error("The admin API returned invalid pagination.");
  }
  return { page, limit, total, totalPages, hasNextPage: value.hasNextPage };
}

function normalizeAdminUser(value: unknown): AdminUser {
  if (!isRecord(value)) {
    throw new Error("The users API returned an invalid user.");
  }
  const id = readString(value.id);
  const name = readString(value.name)?.trim() || "Unnamed account";
  const email = readString(value.email)?.trim() || "No email address";
  const role = readString(value.role)?.toLowerCase();
  if (
    !id ||
    typeof value.isBlocked !== "boolean"
  ) {
    throw new Error("The users API returned incomplete user data.");
  }
  return {
    id,
    name,
    email,
    role:
      role === "admin" || role === "vendor" || role === "customer"
        ? role
        : "unknown",
    isBlocked: value.isBlocked,
    image: readUrl(value.image),
    businessName: readString(value.businessName),
    subscriptionPlan: readString(value.subscriptionPlan),
    subscriptionExpiresAt: readDate(value.subscriptionExpiresAt),
    createdAt: readDate(value.createdAt),
  };
}

function normalizeVendor(value: unknown): AdminService["vendor"] {
  if (!isRecord(value)) return null;
  const id = readString(value.id);
  const name = readString(value.name);
  if (!id || !name) return null;
  return {
    id,
    name,
    email: readString(value.email),
    image: readUrl(value.image),
  };
}

function normalizeAdminService(value: unknown): AdminService {
  if (!isRecord(value)) {
    throw new Error("The services API returned an invalid service.");
  }
  const id = readString(value.id);
  const serviceName = readString(value.serviceName);
  const status = readString(value.status);
  if (
    !id ||
    !serviceName ||
    !status ||
    typeof value.isActive !== "boolean"
  ) {
    throw new Error("The services API returned incomplete service data.");
  }
  const price =
    typeof value.price === "number" && Number.isFinite(value.price)
      ? value.price
      : null;
  return {
    id,
    serviceName,
    category: readString(value.category) ?? "Uncategorized",
    description: readString(value.description) ?? "",
    price,
    location: readString(value.location) ?? "",
    image: readUrl(value.image),
    status: status.toLowerCase(),
    isActive: value.isActive,
    createdAt: readDate(value.createdAt),
    updatedAt: readDate(value.updatedAt),
    vendor: normalizeVendor(value.vendor),
  };
}

function normalizeAdminTransaction(value: unknown): AdminTransaction {
  if (!isRecord(value)) {
    throw new Error("The transactions API returned an invalid transaction.");
  }
  const id = readString(value.id);
  const plan = readString(value.plan);
  const status = readString(value.status);
  if (!id || !plan || !status) {
    throw new Error("The transactions API returned incomplete transaction data.");
  }
  return {
    id,
    plan,
    amount:
      typeof value.amount === "number" && Number.isFinite(value.amount)
        ? value.amount
        : null,
    currency: readString(value.currency)?.toUpperCase() ?? "USD",
    status: status.toLowerCase(),
    createdAt: readDate(value.createdAt),
    vendor: normalizeVendor(value.vendor),
  };
}

export async function fetchAdminOverview(
  signal?: AbortSignal,
): Promise<AdminOverviewStatistics> {
  const data = getData(await requestJson("/api/admin/overview", { signal }));
  if (!isRecord(data.statistics)) {
    throw new Error("The overview API returned invalid statistics.");
  }
  const totalUsers = readCount(data.statistics.totalUsers);
  const totalVendors = readCount(data.statistics.totalVendors);
  const totalCustomers = readCount(data.statistics.totalCustomers);
  const totalServices = readCount(data.statistics.totalServices);
  const pendingServices = readCount(data.statistics.pendingServices);
  const totalTransactions = readCount(data.statistics.totalTransactions);
  if (
    totalUsers === null ||
    totalVendors === null ||
    totalCustomers === null ||
    totalServices === null ||
    pendingServices === null ||
    totalTransactions === null
  ) {
    throw new Error("The overview API returned invalid statistics.");
  }
  return {
    totalUsers,
    totalVendors,
    totalCustomers,
    totalServices,
    pendingServices,
    totalTransactions,
  };
}

export async function fetchAdminUsers(
  filters: AdminUserFilters,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.role) query.set("role", filters.role);
  const data = getData(
    await requestJson(`/api/admin/users?${query}`, { signal }),
  );
  if (!Array.isArray(data.users)) {
    throw new Error("The users API did not return a user list.");
  }
  return {
    users: data.users.map(normalizeAdminUser),
    pagination: readPagination(data.pagination),
  };
}

export async function fetchAdminUser(
  userId: string,
  signal?: AbortSignal,
): Promise<AdminUser> {
  const data = getData(
    await requestJson(`/api/admin/users/${encodeURIComponent(userId)}`, {
      signal,
    }),
  );
  return normalizeAdminUser(data.user);
}

export async function setAdminUserBlocked(
  userId: string,
  blocked: boolean,
): Promise<AdminUser> {
  const action = blocked ? "block" : "unblock";
  const data = getData(
    await requestJson(
      `/api/admin/users/${encodeURIComponent(userId)}/${action}`,
      { method: "PATCH" },
    ),
  );
  return normalizeAdminUser(data.user);
}

export async function fetchAdminServices(
  filters: AdminServiceFilters,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(filters.page),
    limit: String(filters.limit),
  });
  if (filters.search.trim()) query.set("search", filters.search.trim());
  if (filters.category) query.set("category", filters.category);
  if (filters.status) query.set("status", filters.status);
  if (filters.availability) query.set("availability", filters.availability);
  const data = getData(
    await requestJson(`/api/admin/services?${query}`, { signal }),
  );
  if (!Array.isArray(data.services)) {
    throw new Error("The services API did not return a service list.");
  }
  return {
    services: data.services.map(normalizeAdminService),
    pagination: readPagination(data.pagination),
  };
}

export async function updateAdminServiceStatus(
  serviceId: string,
  status: "pending" | "approved" | "rejected",
): Promise<AdminService> {
  const data = getData(
    await requestJson(
      `/api/admin/services/${encodeURIComponent(serviceId)}/status`,
      { method: "PATCH", body: JSON.stringify({ status }) },
    ),
  );
  return normalizeAdminService(data.service);
}

export async function updateAdminServiceAvailability(
  serviceId: string,
  isActive: boolean,
): Promise<AdminService> {
  const data = getData(
    await requestJson(
      `/api/admin/services/${encodeURIComponent(serviceId)}/availability`,
      { method: "PATCH", body: JSON.stringify({ isActive }) },
    ),
  );
  return normalizeAdminService(data.service);
}

export async function deleteAdminService(serviceId: string): Promise<void> {
  await requestJson(
    `/api/admin/services/${encodeURIComponent(serviceId)}`,
    { method: "DELETE" },
  );
}

export async function fetchAdminTransactions(
  page: number,
  limit: number,
  status: string,
  signal?: AbortSignal,
) {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  if (status) query.set("status", status);
  const data = getData(
    await requestJson(`/api/admin/transactions?${query}`, { signal }),
  );
  if (!Array.isArray(data.transactions)) {
    throw new Error("The transactions API did not return a transaction list.");
  }
  return {
    transactions: data.transactions.map(normalizeAdminTransaction),
    pagination: readPagination(data.pagination),
  };
}

export const adminServiceCategories = weddingCategories satisfies readonly WeddingCategory[];
