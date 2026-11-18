function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function uploadImageToImgBB(
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

  const rawUrl = isRecord(payload) ? payload.url : null;
  let url: string | null = null;
  if (typeof rawUrl === "string" && rawUrl.length <= 2048) {
    try {
      const parsedUrl = new URL(rawUrl);
      if (parsedUrl.protocol === "https:" || parsedUrl.protocol === "http:") {
        url = parsedUrl.toString();
      }
    } catch {
      url = null;
    }
  }

  if (!response.ok || !url) {
    const message =
      isRecord(payload) && typeof payload.error === "string"
        ? payload.error
        : "The image could not be uploaded.";
    throw new Error(message);
  }

  return url;
}
