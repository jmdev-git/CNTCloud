import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongodb";
import CompanyEmail from "@/models/CompanyEmail";
import User from "@/models/User";

// Legacy exports kept for compatibility with confirm route (not used in this flow)
export const tokens = new Map<string, { email: string; expires: number; next: string }>();

export async function POST(req: Request) {
  try {
    const { email, next } = await req.json();

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required" }, { status: 400 });
    }

    // Validate if it's a company email or admin user
    await dbConnect();
    const emailLower = email.toLowerCase().trim();
    const employee = await CompanyEmail.findOne({ email: emailLower });
    const adminUser = !employee ? await User.findOne({ username: emailLower }) : null;

    if (!employee && !adminUser) {
      return NextResponse.json({ ok: false, error: "Email not found in company directory" }, { status: 404 });
    }

    // Immediate verification: set cookie and return ok
    const res = NextResponse.json({ ok: true, next: next || "/" });
    
    // Set cookie with proper settings for production
    res.cookies.set("verified_email", emailLower, {
      httpOnly: true,
      secure: false, // Allow HTTP for local network deployment
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });
    
    return res;
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ ok: false, error: "An internal error occurred" }, { status: 500 });
  }
}
