import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function PATCH(
  request: Request,
  { params }: RouteContext<"/api/customer/bookings/[bookingId]/cancel">,
) {
  const { bookingId } = await params;
  return proxyExpressApi(
    request,
    `/bookings/${encodeURIComponent(bookingId)}/cancel`,
    { method: "PATCH" },
  );
}
