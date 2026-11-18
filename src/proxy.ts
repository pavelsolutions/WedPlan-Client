// import { NextRequest, NextResponse } from "next/server";
// import { auth } from "@/lib/auth";

// export async function proxy(request: NextRequest) {
//   const session = await auth.api.getSession({
//     headers: request.headers,
//   });

//   if (!session) {
//     const callbackURL = `${request.nextUrl.pathname}${request.nextUrl.search}`;
//     return NextResponse.redirect(
//       new URL(`/signin?callbackURL=${encodeURIComponent(callbackURL)}`, request.url),
//     );
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: ["/dashboard/:path*"],
// };

import { NextRequest, NextResponse } from "next/server";
import { auth } from "./lib/auth";
import { headers } from "next/headers";

export async function proxy(request: NextRequest) {

  const session = await auth.api.getSession({
    headers: await headers()
  })

  const user = session?.user

  if(!user){
    return NextResponse.redirect(new URL("/signin", request.url)) 
  }

return NextResponse.next();
}

export const config = {
  // matcher: ["/profile/:path*"],
  matcher: [ '/dashboard', '/dashboard/:path', '/services/:path']
};