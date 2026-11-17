import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function GET(request: Request) {
  return proxyExpressApi(request, "/vendor/services");
}

export async function POST(request: Request) {
  return proxyExpressApi(request, "/vendor/services", {
    method: "POST",
    forwardJsonBody: true,
  });
}
