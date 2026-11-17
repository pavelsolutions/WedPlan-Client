import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function PATCH(
  request: Request,
  context: RouteContext<"/api/vendor/bookings/[bookingId]/status">,
) {
  const { bookingId } = await context.params;
  return proxyExpressApi(
    request,
    `/vendor/bookings/${encodeURIComponent(bookingId)}/status`,
    { method: "PATCH", forwardJsonBody: true },
  );
}
