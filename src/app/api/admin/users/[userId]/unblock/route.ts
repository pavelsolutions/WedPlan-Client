import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/admin/users/[userId]/unblock">,
) {
  const { userId } = await context.params;
  return proxyExpressApi(
    request,
    `/admin/users/${encodeURIComponent(userId)}/unblock`,
    { method: "PATCH" },
  );
}
