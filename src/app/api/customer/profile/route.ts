import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function GET(request: Request) {
  return proxyExpressApi(request, "/users/me");
}

export async function PATCH(request: Request) {
  return proxyExpressApi(request, "/users/me", {
    method: "PATCH",
    forwardJsonBody: true,
  });
}
