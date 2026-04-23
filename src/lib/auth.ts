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
        await dbConnect();

        if (!credentials?.username || !credentials.password) {
          return null;
        }

        const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const uname = credentials.username.trim();
        // Case-insensitive username lookup
        const user = await User.findOne({ username: new RegExp(`^${esc(uname)}$`, 'i') }).select('+password');

        if (!user) {
          return null;
        }

        let isPasswordMatch = false;
        const storedPassword = user.password || '';

        // Check if it's a bcrypt hash
        const isBcrypt = storedPassword.startsWith('$2a$') || storedPassword.startsWith('$2b$') || storedPassword.startsWith('$2y$');

        if (isBcrypt) {
          isPasswordMatch = await bcrypt.compare(credentials.password, storedPassword);
        } else {
          // If it's not a bcrypt hash, it's likely plain text
          isPasswordMatch = credentials.password === storedPassword;

          // If it matches as plain text, we should hash it and save it back for security
          if (isPasswordMatch) {
            try {
              const hashedPassword = await bcrypt.hash(credentials.password, 10);
              await User.updateOne({ _id: user._id }, { $set: { password: hashedPassword } });
              console.log(`Auto-hashed plain text password for user: ${user.username}`);
            } catch (err) {
              console.error('Failed to auto-hash password:', err);
            }
          }
        }

        if (!isPasswordMatch) {
          return null;
        }

        const canManageUsers = user.canManageUsers === true || user.username === 'itadmin' || user.username === 'it.support@cntpromoads.com';
        const businessUnits = Array.isArray(user.businessUnits) ? user.businessUnits : undefined;

        const isItAdminEmail = (u: string) => {
          const lower = u.toLowerCase();
          return lower === 'itadmin' || lower === 'it.support@cntpromoads.com';
        };

        let displayName = user.name || user.username;
        if (isItAdminEmail(user.username)) {
          displayName = 'IT Admin';
        }

        const authorizedUser: AuthorizedUser = {
          id: user._id.toString(),
          name: displayName,
          username: user.username,
          role: 'admin' as const,
          allowedCategories: user.allowedCategories ?? undefined,
          canManageUsers,
          businessUnits,
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
      const base = baseUrl.replace(/\/$/, '');
      // If the user is logging in, redirect them to /admin instead of the root
      if (url.startsWith(base)) {
        if (url === base || url === `${base}/`) {
          return `${base}/admin`;
        }
        return url;
      }
      return base;
    },
    async jwt({ token, user }) {
      type RoleUser = {
        id: string;
        name?: string;
        username?: string;
        role?: "admin";
        allowedCategories?: string[];
        canManageUsers?: boolean;
        businessUnits?: string[];
        isScannerOnly?: boolean;
        scannerRegTypes?: string[];
      };
      type RoleToken = JWT & {
        id?: string;
        username?: string;
        role?: "admin";
        allowedCategories?: string[];
        canManageUsers?: boolean;
        businessUnits?: string[];
        isScannerOnly?: boolean;
        scannerRegTypes?: string[];
      };
      const u = user as RoleUser | undefined;
      const t = token as RoleToken;
      
      // Only update token on sign in
      if (u) {
        t.id = u.id;
        t.name = u.name;
        t.username = u.username ?? '';
        t.role = u.role ?? 'admin';
        t.allowedCategories = u.allowedCategories;
        t.canManageUsers = u.canManageUsers === true;
        t.businessUnits = u.businessUnits;
        t.isScannerOnly = u.isScannerOnly;
        t.scannerRegTypes = u.scannerRegTypes;
      }
      return t;
    },
    async session({ session, token }) {
      type RoleToken = JWT & {
        id?: string;
        name?: string;
        username?: string;
        role?: "admin";
        allowedCategories?: string[];
        canManageUsers?: boolean;
        businessUnits?: string[];
        isScannerOnly?: boolean;
        scannerRegTypes?: string[];
      };
      const t = token as RoleToken;
      const s = session as {
        user?: {
          id?: string;
          name?: string;
          username?: string;
          role?: "admin";
          allowedCategories?: string[];
          canManageUsers?: boolean;
          businessUnits?: string[];
          isScannerOnly?: boolean;
          scannerRegTypes?: string[];
        };
      };
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
