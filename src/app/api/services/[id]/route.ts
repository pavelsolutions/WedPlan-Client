import { ObjectId, type Document } from "mongodb";
import { mongoDb } from "@/lib/mongodb";

type VendorDocument = Document & {
  _id: string | ObjectId;
  role?: string;
  name?: string;
  businessName?: string;
  image?: string;
};

function isObjectIdString(value: string) {
  return /^[\da-f]{24}$/i.test(value);
}

function getVendorId(value: unknown): string | null {
  if (value instanceof ObjectId) return value.toHexString();
  if (typeof value === "string" && value.trim()) return value.trim();
  if (
    typeof value === "object" &&
    value !== null &&
    "$oid" in value &&
    typeof value.$oid === "string"
  ) {
    return value.$oid;
  }
  return null;
}

export async function GET(
  _request: Request,
  context: RouteContext<"/api/services/[id]">,
) {
  const { id } = await context.params;

  if (!isObjectIdString(id)) {
    return Response.json({ error: "Service not found." }, { status: 404 });
  }

  try {
    const service = await mongoDb.collection("services").findOne({
      _id: new ObjectId(id),
      status: "approved",
      isActive: true,
    });

    if (!service) {
      return Response.json({ error: "Service not found." }, { status: 404 });
    }

    const vendorId = getVendorId(service.vendorId);
    const users = mongoDb.collection<VendorDocument>("user");
    let vendor = null;
    if (vendorId) {
      if (isObjectIdString(vendorId)) {
        vendor = await users.findOne(
          { _id: new ObjectId(vendorId), role: "vendor" },
          { projection: { name: 1, businessName: 1, image: 1 } },
        );
      }
      if (!vendor) {
        vendor = await users.findOne(
          { _id: vendorId, role: "vendor" },
          { projection: { name: 1, businessName: 1, image: 1 } },
        );
      }
    }

    return Response.json({
      success: true,
      data: {
        service: {
          ...service,
          vendor,
        },
      },
    });
  } catch (error) {
    console.error("Failed to load service details.", error);
    return Response.json(
      { error: "Service details could not be loaded." },
      { status: 500 },
    );
  }
}
