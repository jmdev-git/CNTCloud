import { NextResponse } from "next/server";
import { tokens } from "../send-link/route";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.redirect(new URL("/verify?error=missing_token", req.url));
  }

  const data = tokens.get(token);

  if (!data) {
    return NextResponse.redirect(new URL("/verify?error=invalid_token", req.url));
  }

  if (data.expires < Date.now()) {
    tokens.delete(token);
    return NextResponse.redirect(new URL("/verify?error=expired_token", req.url));
  }

  // Token is valid!
  const res = NextResponse.redirect(new URL(data.next, req.url));
  
  // Set the verification cookie
  res.cookies.set("verified_email", data.email, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });

  // Cleanup token
  tokens.delete(token);

  return res;
}
