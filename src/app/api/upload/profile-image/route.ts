import { ObjectId } from "mongodb";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { mongoDb } from "@/lib/mongodb";
import { uploadImageWithImgBB } from "@/lib/server/imgbb-upload";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return Response.json({ error: "Sign in to upload an image." }, { status: 401 });
  }

  if (!ObjectId.isValid(session.user.id)) {
    return Response.json({ error: "Your session is invalid." }, { status: 401 });
  }
  const user = await mongoDb.collection("user").findOne(
    { _id: new ObjectId(session.user.id) },
    { projection: { isBlocked: 1 } },
  );
  if (!user) {
    return Response.json({ error: "Your account could not be verified." }, { status: 401 });
  }
  if (user.isBlocked === true) {
    return Response.json({ error: "This account is blocked." }, { status: 403 });
  }

  return uploadImageWithImgBB(request);
}
