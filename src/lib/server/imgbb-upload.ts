const maxImageSize = 10 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

function hasExpectedSignature(file: File) {
  return file.slice(0, 12).arrayBuffer().then((buffer) => {
    const bytes = new Uint8Array(buffer);
    const isJpeg =
      file.type === "image/jpeg" &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff;
    const isPng =
      file.type === "image/png" &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a;
    const isWebp =
      file.type === "image/webp" &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";

    return isJpeg || isPng || isWebp;
  });
}

function getUploadedImageUrl(payload: unknown): string | null {
  if (typeof payload !== "object" || payload === null || !("data" in payload)) {
    return null;
  }

  const data = payload.data;
  if (typeof data !== "object" || data === null || !("url" in data)) {
    return null;
  }

  return typeof data.url === "string" ? data.url : null;
}

export async function uploadImageWithImgBB(request: Request) {
  const origin = request.headers.get("origin");
  let isSameOrigin = false;
  try {
    isSameOrigin =
      origin !== null && new URL(origin).origin === new URL(request.url).origin;
  } catch {
    isSameOrigin = false;
  }
  if (!isSameOrigin) {
    return Response.json({ error: "This upload request is not allowed." }, { status: 403 });
  }

  const requestSize = Number(request.headers.get("content-length"));
  if (Number.isFinite(requestSize) && requestSize > maxImageSize + 128 * 1024) {
    return Response.json(
      { error: "Choose an image smaller than 10 MB." },
      { status: 413 },
    );
  }

  const apiKey = process.env.IMGBB_API_KEY?.trim();
  if (!apiKey) {
    return Response.json(
      { error: "Image uploads are not configured yet." },
      { status: 503 },
    );
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Choose a valid image file." }, { status: 400 });
  }

  const image = formData.get("image");
  if (!(image instanceof File)) {
    return Response.json({ error: "Choose a profile image to upload." }, { status: 400 });
  }

  if (!allowedImageTypes.has(image.type) || !(await hasExpectedSignature(image))) {
    return Response.json(
      { error: "Choose a valid JPG, PNG, or WebP image." },
      { status: 415 },
    );
  }

  if (image.size > maxImageSize) {
    return Response.json(
      { error: "Choose an image smaller than 10 MB." },
      { status: 413 },
    );
  }

  const uploadUrl = new URL("https://api.imgbb.com/1/upload");
  uploadUrl.searchParams.set("key", apiKey);
  const uploadForm = new FormData();
  uploadForm.append("image", image, image.name);

  let uploadResponse: Response;
  try {
    uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      body: uploadForm,
      cache: "no-store",
    });
  } catch {
    return Response.json(
      { error: "ImgBB could not be reached. Please try again." },
      { status: 502 },
    );
  }

  if (!uploadResponse.ok) {
    const message =
      uploadResponse.status === 400 ||
      uploadResponse.status === 401 ||
      uploadResponse.status === 403
        ? "ImgBB rejected the upload. Check the server-side API key and image requirements."
        : uploadResponse.status === 413
          ? "ImgBB rejected the image because it is too large."
          : `ImgBB rejected the upload (HTTP ${uploadResponse.status}). Please try again.`;
    return Response.json({ error: message }, { status: 502 });
  }

  let uploadResult: unknown;
  try {
    uploadResult = await uploadResponse.json();
  } catch {
    return Response.json(
      { error: "ImgBB returned an invalid response. Please try again." },
      { status: 502 },
    );
  }

  const imageUrl = getUploadedImageUrl(uploadResult);
  if (!imageUrl) {
    return Response.json(
      { error: "ImgBB did not return an image URL. Please try again." },
      { status: 502 },
    );
  }

  return Response.json({ url: imageUrl });
}
