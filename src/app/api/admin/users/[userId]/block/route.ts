import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/users/[userId]/block">,
) {
  const { userId } = await context.params;
  return proxyExpressApi(
    request,
    `/admin/users/${encodeURIComponent(userId)}/block`,
    { method: "PATCH" },
  );
}
