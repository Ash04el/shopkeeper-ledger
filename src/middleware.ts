import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, parseSessionValue } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const session = parseSessionValue(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";
  const isApiRoute = pathname.startsWith("/api");
  const isAuthRoute = pathname.startsWith("/auth");

  // Allow auth API routes and login page without a session
  if (isLoginPage || (isApiRoute && pathname.startsWith("/api/auth"))) {
    if (session && !isApiRoute) {
      // Logged-in user visiting /login → redirect to dashboard
      const url = request.nextUrl.clone();
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect everything else (dashboard, customers, other /api routes)
  if (!session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (!isApiRoute && !isAuthRoute) {
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw.js|manifest|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
