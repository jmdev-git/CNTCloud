import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function proxy(req: NextRequest) {
  const token = await getToken({
    req: req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  const pathname = req.nextUrl.pathname;

  // 1. Skip middleware for static assets and internal Next.js paths
  if (
    pathname.startsWith("/_next") || 
    pathname.startsWith("/api") || 
    pathname.startsWith("/favicon.ico") ||
    pathname.includes(".") // Handles files like .png, .jpg, .gif, .webm
  ) {
    return NextResponse.next();
  }

  // 2. Admin Session Protection (Restriction for logged-in admins)
  if (token) {
    // List of public paths that logged-in admins should NOT be able to access
    const publicPaths = ["/", "/pulse", "/about", "/helpdesk", "/chat", "/memo"];
    
    // Check if the current path is one of the restricted public paths
    const isPublicPath = publicPaths.some(path => 
      pathname === path || pathname.startsWith(`${path}/`)
    );

    // Also restrict access to the login page for logged-in users
    const isLoginPage = pathname === "/admin/login";

    if (isPublicPath || isLoginPage) {
      // Redirect logged-in admins back to the admin dashboard
      return NextResponse.redirect(new URL("/admin", req.url));
    }
    
    // If they are on /admin or other admin routes, let them through
    return NextResponse.next();
  }

  // 3. Allow access to /verify without redirection
  if (pathname === "/verify") {
    return NextResponse.next();
  }

  // 4. Protect all other internal routes for non-logged in users (Email Verification)
  if (
    pathname === "/" ||
    pathname.startsWith("/pulse") || 
    pathname.startsWith("/chat") || 
    pathname.startsWith("/helpdesk") || 
    pathname.startsWith("/memo") ||
    pathname.startsWith("/admin")
  ) {
    // Skip email verification for the login page
    if (pathname === "/admin/login") return NextResponse.next();

    const verified = req.cookies.get("verified_email");

    if (!verified) {
      const url = new URL("/verify", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/auth|_next/static|_next/image|favicon.ico).*)"],
};
