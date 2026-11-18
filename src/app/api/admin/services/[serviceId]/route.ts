import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function DELETE(
  request: Request,
  context: RouteContext<"/api/admin/services/[serviceId]">,
) {
  const { serviceId } = await context.params;
  return proxyExpressApi(
    request,
    `/admin/services/${encodeURIComponent(serviceId)}`,
    { method: "DELETE" },
  );
}
