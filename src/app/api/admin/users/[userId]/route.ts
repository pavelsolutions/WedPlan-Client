import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function GET(
  request: Request,
  context: RouteContext<"/api/admin/users/[userId]">,
) {
  const { userId } = await context.params;
  return proxyExpressApi(
    request,
    `/admin/users/${encodeURIComponent(userId)}`,
  );
}
