import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const url = req.nextUrl.clone();
  const isLoggedIn = !!req.auth?.user;
  const role = req.auth?.user?.role;

  const isPublic = pathname === "/login" || pathname === "/register";
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/schedule");

  if (!isLoggedIn) {
    if (isProtected || pathname === "/") {
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return;
  }

  if (isPublic || pathname === "/") {
    url.pathname = role === "ADMIN" ? "/dashboard" : "/schedule";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/dashboard") && role !== "ADMIN") {
    url.pathname = "/schedule";
    return NextResponse.redirect(url);
  }

  if (pathname.startsWith("/schedule") && role === "ADMIN") {
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};