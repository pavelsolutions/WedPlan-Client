import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function GET(
  request: Request,
  context: RouteContext<"/api/vendor/services/[serviceId]">,
) {
  const { serviceId } = await context.params;
  return proxyExpressApi(
    request,
    `/vendor/services/${encodeURIComponent(serviceId)}`,
  );
}

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/vendor/services/[serviceId]">,
) {
  const { serviceId } = await context.params;
  return proxyExpressApi(
    request,
    `/vendor/services/${encodeURIComponent(serviceId)}`,
    { method: "PATCH", forwardJsonBody: true },
  );
}

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/vendor/services/[serviceId]">,
) {
  const { serviceId } = await context.params;
  return proxyExpressApi(
    request,
    `/vendor/services/${encodeURIComponent(serviceId)}`,
    { method: "DELETE" },
  );
}
