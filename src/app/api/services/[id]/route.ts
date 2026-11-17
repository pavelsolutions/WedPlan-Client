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

    const vendorId = service.vendorId;
    const vendorIds: Array<string | ObjectId> = [];
    if (vendorId instanceof ObjectId) {
      vendorIds.push(vendorId, vendorId.toHexString());
    } else if (typeof vendorId === "string") {
      vendorIds.push(vendorId);
      if (isObjectIdString(vendorId)) vendorIds.push(new ObjectId(vendorId));
    }

    const vendor = vendorIds.length
      ? await mongoDb.collection<VendorDocument>("user").findOne(
          { _id: { $in: vendorIds }, role: "vendor" },
          { projection: { name: 1, businessName: 1, image: 1 } },
        )
      : null;

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
