import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/services/[serviceId]/status">,
) {
  const { serviceId } = await context.params;
  return proxyExpressApi(
    request,
    `/admin/services/${encodeURIComponent(serviceId)}/status`,
    { method: "PATCH", forwardJsonBody: true },
  );
}
