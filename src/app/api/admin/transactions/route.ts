import { proxyExpressApi } from "@/lib/server-api-proxy";

export async function GET(request: Request) {
  return proxyExpressApi(request, "/admin/transactions");
}
