import { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import type { JWT } from "next-auth/jwt";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";

type AuthorizedUser = {
  id: string;
  name: string;
  username: string;
  role: "admin";
  allowedCategories?: string[];
  canManageUsers: boolean;
  businessUnits?: string[];
  isScannerOnly?: boolean;
  scannerRegTypes?: string[];
};

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Admin",
      credentials: {
        username: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          await dbConnect();
        } catch (err) {
          console.error("[AUTH] DB connect failed:", err);
          return null;
        }

        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const uname = credentials.username.trim().toLowerCase();

        let user: any = null;
        try {
          user = await User.findOne({ username: uname }).select("+password");
          if (!user) {
            user = await User.findOne({
              username: { $regex: new RegExp(`^${uname.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
            }).select("+password");
          }
        } catch (err) {
          console.error("[AUTH] DB query failed:", err);
          return null;
        }

        if (!user) return null;

        const storedPassword: string = user.password || "";
        const isBcrypt =
          storedPassword.startsWith("$2a$") ||
          storedPassword.startsWith("$2b$") ||
          storedPassword.startsWith("$2y$");

        let isPasswordMatch = false;

        if (isBcrypt) {
          isPasswordMatch = await bcrypt.compare(credentials.password, storedPassword);
        } else {
          isPasswordMatch = credentials.password === storedPassword;
          if (isPasswordMatch) {
            try {
              const hashed = await bcrypt.hash(credentials.password, 10);
              await User.updateOne({ _id: user._id }, { $set: { password: hashed } });
            } catch {}
          }
        }

        if (!isPasswordMatch) return null;

        const canManageUsers =
          user.canManageUsers === true ||
          user.username === "itadmin" ||
          user.username === "it.support@cntpromoads.com";

        const isItAdmin =
          user.username.toLowerCase() === "itadmin" ||
          user.username.toLowerCase() === "it.support@cntpromoads.com";

        const authorizedUser: AuthorizedUser = {
          id: user._id.toString(),
          name: isItAdmin ? "IT Admin" : user.name || user.username,
          username: user.username,
          role: "admin",
          allowedCategories: user.allowedCategories ?? undefined,
          canManageUsers,
          businessUnits: Array.isArray(user.businessUnits) ? user.businessUnits : undefined,
          isScannerOnly: !!user.isScannerOnly,
          scannerRegTypes: user.scannerRegTypes || [],
        };

        return authorizedUser;
      },
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/api/auth/signin",
  },
  callbacks: {
    async redirect({ url, baseUrl }) {
      const base = baseUrl.replace(/\/$/, "");
      if (url.startsWith(base)) {
        if (url === base || url === `${base}/`) return `${base}/admin`;
        return url;
      }
      return base;
    },
    async jwt({ token, user }) {
      const u = user as AuthorizedUser | undefined;
      if (u) {
        (token as any).id = u.id;
        (token as any).name = u.name;
        (token as any).username = u.username;
        (token as any).role = u.role;
        (token as any).allowedCategories = u.allowedCategories;
        (token as any).canManageUsers = u.canManageUsers === true;
        (token as any).businessUnits = u.businessUnits;
        (token as any).isScannerOnly = u.isScannerOnly;
        (token as any).scannerRegTypes = u.scannerRegTypes;
      }
      return token;
    },
    async session({ session, token }) {
      const t = token as any;
      const s = session as any;
      if (!s.user) s.user = {};
      if (t.id) s.user.id = t.id;
      if (t.name) s.user.name = t.name;
      if (t.username) s.user.username = t.username;
      if (t.role) s.user.role = t.role;
      if (t.allowedCategories) s.user.allowedCategories = t.allowedCategories;
      if (t.canManageUsers !== undefined) s.user.canManageUsers = t.canManageUsers;
      if (t.businessUnits) s.user.businessUnits = t.businessUnits;
      if (t.isScannerOnly !== undefined) s.user.isScannerOnly = t.isScannerOnly;
      if (t.scannerRegTypes) s.user.scannerRegTypes = t.scannerRegTypes;
      return session;
    },
  },
};
