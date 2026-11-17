import "server-only";

type ProxyOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  forwardJsonBody?: boolean;
  requireSameOrigin?: boolean;
};

function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function getApiRoot() {
  const configuredUrl =
    process.env.WEDPLAN_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_URL?.trim() ||
    process.env.NEXT_PUBLIC_API_BASE_URL?.trim() ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:5000/api"
      : "");
  if (!configuredUrl) {
    throw new Error("The WedPlan API is not configured.");
  }

  let endpoint: URL;
  try {
    endpoint = new URL(configuredUrl);
  } catch {
    throw new Error("WEDPLAN_API_URL must be a valid absolute URL.");
  }

  let path = endpoint.pathname.replace(/\/+$/, "");
  if (/\/api\/services$/i.test(path)) {
    path = path.replace(/\/services$/i, "");
  } else if (!/\/api$/i.test(path)) {
    path = `${path}/api`;
  }

  return { origin: endpoint.origin, path };
}

export async function proxyExpressApi(
  request: Request,
  path: string,
  options: ProxyOptions = {},
) {
  const method = options.method ?? "GET";
  if (
    (options.requireSameOrigin ?? method !== "GET") &&
    !isSameOrigin(request)
  ) {
    return Response.json(
      { error: "This request is not allowed." },
      { status: 403 },
    );
  }

  let body: unknown;
  if (options.forwardJsonBody) {
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Enter valid JSON data." },
        { status: 400 },
      );
    }

    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return Response.json(
        { error: "Enter valid JSON data." },
        { status: 400 },
      );
    }
  }

  let apiRoot: ReturnType<typeof getApiRoot>;
  try {
    apiRoot = getApiRoot();
  } catch (error) {
    console.error("WedPlan API proxy is not configured.", error);
    return Response.json(
      { error: "The WedPlan API is not configured." },
      { status: 503 },
    );
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(
    `${apiRoot.path}${path}`,
    apiRoot.origin,
  );
  targetUrl.search = incomingUrl.search;

  const headers = new Headers({ Accept: "application/json" });
  const cookie = request.headers.get("cookie");
  if (cookie) headers.set("Cookie", cookie);
  if (body !== undefined) headers.set("Content-Type", "application/json");

  let upstream: Response;
  try {
    upstream = await fetch(targetUrl, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
      redirect: "manual",
    });
  } catch (error) {
    console.error("WedPlan API proxy request failed.", error);
    return Response.json(
      { error: "The WedPlan API is unavailable. Please try again." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await upstream.json();
  } catch {
    console.error("WedPlan API returned an invalid JSON response.");
    return Response.json(
      { error: "The WedPlan API returned an invalid response." },
      { status: 502 },
    );
  }

  return Response.json(payload, {
    status: upstream.status,
    headers: { "Cache-Control": "no-store" },
  });
}
