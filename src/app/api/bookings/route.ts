import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function POST(request: Request) {
  return proxyExpressApi(request, "/bookings", {
    method: "POST",
    forwardJsonBody: true,
  });
}
