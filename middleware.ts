import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "lib/admin-auth";

/**
 * Guards every /admin route. The login page + login API are reachable so you
 * can authenticate; everything else under /admin requires a valid signed
 * session cookie, otherwise you're bounced to /admin/login.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // The login page must stay reachable.
  if (pathname === "/admin/login") return NextResponse.next();

  const session = await verifySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (session) return NextResponse.next();

  const url = req.nextUrl.clone();
  url.pathname = "/admin/login";
  url.search = "";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
