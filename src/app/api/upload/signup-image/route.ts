import { uploadImageWithImgBB } from "@/lib/server/imgbb-upload";

export async function POST(request: Request) {
  return uploadImageWithImgBB(request);
}
