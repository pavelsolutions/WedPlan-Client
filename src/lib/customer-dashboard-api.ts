export type CustomerBookingStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "cancelled"
  | string;

export type CustomerBooking = {
  id: string;
  status: CustomerBookingStatus;
  eventDate: string | null;
  eventLocation: string;
  message: string;
  createdAt: string | null;
  service: {
    id: string;
    name: string;
    category: string;
    image: string | null;
    location: string;
    price: number | null;
  } | null;
  vendor: {
    id: string | null;
    name: string;
    image: string | null;
  };
};

export type BookingStatistics = {
  totalBookingRequests: number;
  pendingBookings: number;
  acceptedBookings: number;
  rejectedBookings: number;
};

export type CustomerBookingsResult = {
  bookings: CustomerBooking[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
  statistics: BookingStatistics;
};

export type CustomerProfile = {
  id: string;
  name: string;
  email: string;
  image: string | null;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function readOptionalHttpUrl(value: unknown): string | null {
  const text = readString(value);
  if (!text?.trim()) return null;

  try {
    const url = new URL(text);
    return url.protocol === "http:" || url.protocol === "https:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function readNonNegativeInteger(value: unknown): number | null {
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= 0
    ? value
    : null;
}

function readNonNegativeNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

async function readResponse(response: Response) {
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new Error(
      response.ok
        ? "The dashboard API returned an invalid response."
        : `The dashboard API returned HTTP ${response.status}.`,
    );
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : `The dashboard API returned HTTP ${response.status}.`;
    throw new Error(message);
  }
  return payload;
}

function normalizeBooking(value: unknown): CustomerBooking {
  if (!isRecord(value)) {
    throw new Error("The bookings API returned an invalid booking.");
  }

  const id = readString(value.id);
  const status = readString(value.status);
  if (!id || !status) {
    throw new Error("The bookings API returned an invalid booking.");
  }

  let service: CustomerBooking["service"] = null;
  if (value.service !== null && value.service !== undefined) {
    if (!isRecord(value.service)) {
      throw new Error("The bookings API returned invalid service details.");
    }

    const serviceId = readString(value.service.id);
    const name = readString(value.service.name);
    if (!serviceId || !name) {
      throw new Error("The bookings API returned invalid service details.");
    }
    service = {
      id: serviceId,
      name,
      category: readString(value.service.category) ?? "",
      image: readOptionalHttpUrl(value.service.image),
      location: readString(value.service.location) ?? "",
      price: readNonNegativeNumber(value.service.price),
    };
  }

  let vendor: CustomerBooking["vendor"] = {
    id: null,
    name: "Wedding vendor",
    image: null,
  };
  if (isRecord(value.vendor)) {
    vendor = {
      id: readString(value.vendor.id),
      name: readString(value.vendor.name) ?? "Wedding vendor",
      image: readOptionalHttpUrl(value.vendor.image),
    };
  }

  return {
    id,
    status: status.toLowerCase(),
    eventDate: readString(value.eventDate),
    eventLocation: readString(value.eventLocation) ?? "",
    message: readString(value.message) ?? "",
    createdAt: readString(value.createdAt),
    service,
    vendor,
  };
}

export async function fetchCustomerBookings(
  page: number,
  limit: number,
  signal?: AbortSignal,
): Promise<CustomerBookingsResult> {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
  });
  const response = await fetch(`/api/customer/bookings?${query}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  const payload = await readResponse(response);
  if (!isRecord(payload) || !isRecord(payload.data)) {
    throw new Error("The bookings API returned an invalid response.");
  }

  const { data } = payload;
  const pagination = data.pagination;
  const statistics = data.statistics;
  if (
    !Array.isArray(data.bookings) ||
    !isRecord(pagination) ||
    !isRecord(statistics)
  ) {
    throw new Error("The bookings API returned incomplete dashboard data.");
  }

  const pageValue = readNonNegativeInteger(pagination.page);
  const limitValue = readNonNegativeInteger(pagination.limit);
  const total = readNonNegativeInteger(pagination.total);
  const totalPages = readNonNegativeInteger(pagination.totalPages);
  const totalBookingRequests = readNonNegativeInteger(
    statistics.totalBookingRequests,
  );
  const pendingBookings = readNonNegativeInteger(statistics.pendingBookings);
  const acceptedBookings = readNonNegativeInteger(statistics.acceptedBookings);
  const rejectedBookings = readNonNegativeInteger(statistics.rejectedBookings);
  if (
    pageValue === null ||
    limitValue === null ||
    total === null ||
    totalPages === null ||
    totalBookingRequests === null ||
    pendingBookings === null ||
    acceptedBookings === null ||
    rejectedBookings === null ||
    typeof pagination.hasNextPage !== "boolean"
  ) {
    throw new Error("The bookings API returned invalid pagination or statistics.");
  }

  return {
    bookings: data.bookings.map(normalizeBooking),
    pagination: {
      page: pageValue,
      limit: limitValue,
      total,
      totalPages,
      hasNextPage: pagination.hasNextPage,
    },
    statistics: {
      totalBookingRequests,
      pendingBookings,
      acceptedBookings,
      rejectedBookings,
    },
  };
}

export async function cancelCustomerBooking(bookingId: string) {
  const response = await fetch(
    `/api/customer/bookings/${encodeURIComponent(bookingId)}/cancel`,
    {
      method: "PATCH",
      headers: { Accept: "application/json" },
    },
  );
  const payload = await readResponse(response);
  if (
    !isRecord(payload) ||
    !isRecord(payload.data) ||
    !isRecord(payload.data.booking) ||
    payload.data.booking.status !== "cancelled"
  ) {
    throw new Error("The booking API returned an invalid cancellation response.");
  }
}

function normalizeCustomerProfile(value: unknown): CustomerProfile {
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
    image: readOptionalHttpUrl(value.image),
  };
}

export async function fetchCustomerProfile(
  signal?: AbortSignal,
): Promise<CustomerProfile> {
  const response = await fetch("/api/customer/profile", {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal,
  });
  const payload = await readResponse(response);
  if (!isRecord(payload)) {
    throw new Error("The profile API returned invalid profile data.");
  }
  return normalizeCustomerProfile(payload.data);
}

export async function updateCustomerProfile(input: {
  name: string;
  image: string | null;
}): Promise<CustomerProfile> {
  const response = await fetch("/api/customer/profile", {
    method: "PATCH",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  const payload = await readResponse(response);
  if (!isRecord(payload)) {
    throw new Error("The profile API returned invalid profile data.");
  }
  return normalizeCustomerProfile(payload.data);
}
