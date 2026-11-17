import { ObjectId } from "mongodb";
import { auth } from "@/lib/auth";
import { mongoDb } from "@/lib/mongodb";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function idVariants(value: string | ObjectId) {
  if (value instanceof ObjectId) {
    return [value, value.toHexString()];
  }
  if (/^[\da-f]{24}$/i.test(value)) {
    return [value, new ObjectId(value)];
  }
  return [value];
}

function toMongoId(value: string) {
  return /^[\da-f]{24}$/i.test(value) ? new ObjectId(value) : value;
}

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;
  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return Response.json({ error: "This booking request is not allowed." }, { status: 403 });
  }

  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session) {
      return Response.json({ error: "Sign in to request a booking." }, { status: 401 });
    }

    if (session.user.role === "admin") {
      return Response.json(
        { error: "Admin accounts cannot submit customer bookings." },
        { status: 403 },
      );
    }

    let payload: unknown;
    try {
      payload = await request.json();
    } catch {
      return Response.json({ error: "Enter valid booking details." }, { status: 400 });
    }

    const serviceId = isRecord(payload) && typeof payload.serviceId === "string"
      ? payload.serviceId
      : "";
    const eventDateValue =
      isRecord(payload) && typeof payload.eventDate === "string"
        ? payload.eventDate
        : "";
    const eventLocation =
      isRecord(payload) && typeof payload.eventLocation === "string"
        ? payload.eventLocation.trim()
        : "";
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message.trim()
        : "";

    if (!/^[\da-f]{24}$/i.test(serviceId)) {
      return Response.json({ error: "Service not found." }, { status: 404 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(eventDateValue)) {
      return Response.json({ error: "Choose a valid event date." }, { status: 400 });
    }
    if (!eventLocation || eventLocation.length > 200 || message.length > 1000) {
      return Response.json(
        { error: "Enter a valid event location and message." },
        { status: 400 },
      );
    }

    const eventDate = new Date(`${eventDateValue}T00:00:00.000Z`);
    if (
      Number.isNaN(eventDate.getTime()) ||
      eventDate.toISOString().slice(0, 10) !== eventDateValue
    ) {
      return Response.json({ error: "Choose a valid event date." }, { status: 400 });
    }
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);
    if (eventDate < today) {
      return Response.json(
        { error: "Choose today or a future event date." },
        { status: 400 },
      );
    }

    const serviceObjectId = new ObjectId(serviceId);
    const service = await mongoDb.collection("services").findOne({
      _id: serviceObjectId,
      status: "approved",
      isActive: true,
    });
    if (!service) {
      return Response.json({ error: "This service is no longer available." }, { status: 404 });
    }
    if (!service.vendorId) {
      return Response.json(
        { error: "This service is missing its vendor information." },
        { status: 409 },
      );
    }

    if (String(service.vendorId) === session.user.id) {
      return Response.json(
        { error: "Vendors cannot book their own services." },
        { status: 403 },
      );
    }
    if (session.user.role !== "customer") {
      return Response.json(
        { error: "Only customer accounts can submit booking requests." },
        { status: 403 },
      );
    }

    const customerId = toMongoId(session.user.id);
    const endOfEventDay = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
    const duplicate = await mongoDb.collection("bookings").findOne({
      customerId: { $in: idVariants(customerId) },
      serviceId: { $in: idVariants(serviceObjectId) },
      eventDate: { $gte: eventDate, $lt: endOfEventDay },
      status: { $in: ["pending", "accepted"] },
    });
    if (duplicate) {
      return Response.json(
        { error: "You already have an active request for this service and date." },
        { status: 409 },
      );
    }

    const booking = {
      serviceId: serviceObjectId,
      vendorId: service.vendorId,
      customerId,
      eventDate,
      eventLocation,
      message,
      status: "pending",
      createdAt: new Date(),
    };
    const result = await mongoDb.collection("bookings").insertOne(booking);

    return Response.json(
      {
        success: true,
        data: { bookingId: result.insertedId.toString() },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create booking request.", error);
    return Response.json(
      { error: "The booking request could not be created. Please try again." },
      { status: 500 },
    );
  }
}
