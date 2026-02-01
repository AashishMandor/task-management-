// src/proxy.ts
import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;

  const pathname = req.nextUrl.pathname;

  console.log(`Proxy running for: ${pathname} | Logged in: ${isLoggedIn}`);

  // Protect dashboard routes
  if (pathname.startsWith("/dashboard") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  // Optional: Redirect logged-in users away from login (prevents seeing login form after auth)
  if (pathname === "/login" && isLoggedIn) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // Allow the request to continue (important!)
  return NextResponse.next();
});

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};