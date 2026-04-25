import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { recordLog } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALL_CATEGORIES = ['events', 'company-news', 'urgent-notices', 'policy', 'birthday-celebrants', 'food-menu'];

export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin' || !token.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const users = await User.find({}, 'username name allowedCategories businessUnits role isScannerOnly scannerRegTypes').sort({ username: 1 }).lean();
    const mapped = users.map((u) => ({
      _id: u._id.toString(),
      username: u.username as string,
      name: u.name as string,
      role: u.role as string,
      allowedCategories: Array.isArray(u.allowedCategories) ? u.allowedCategories : [],
      businessUnits: Array.isArray((u as { businessUnits?: string[] }).businessUnits) ? (u as { businessUnits?: string[] }).businessUnits : [],
      isScannerOnly: !!(u as { isScannerOnly?: boolean }).isScannerOnly,
      scannerRegTypes: Array.isArray((u as { scannerRegTypes?: string[] }).scannerRegTypes) ? (u as { scannerRegTypes?: string[] }).scannerRegTypes : [],
    }));
    return NextResponse.json(mapped, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin' || !token.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const body = await request.json();
    const { username, name, password, allowedCategories, businessUnits, isScannerOnly, scannerRegTypes } = body as {
      username?: string;
      name?: string;
      password?: string;
      allowedCategories?: string[];
      businessUnits?: string[];
      isScannerOnly?: boolean;
      scannerRegTypes?: string[];
    };
    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password are required' }, { status: 400 });
    }
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const uname = username.trim().toLowerCase();
    const existing = await User.findOne({ username: new RegExp(`^${esc(uname)}$`, 'i') });
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 400 });
    }

    const isSuperAdmin = (u: string) => u === 'itadmin' || u === 'it.support@cntpromoads.com';
    const isSuper = isSuperAdmin(uname);

    const sanitizedCategories = !isSuper && Array.isArray(allowedCategories)
      ? allowedCategories.filter((c) => ALL_CATEGORIES.includes(c))
      : undefined;

    // isScannerOnly only when events is the sole allowed category
    const effectiveScannerOnly = !isSuper && !!isScannerOnly &&
      Array.isArray(sanitizedCategories) && sanitizedCategories.length === 1 && sanitizedCategories[0] === 'events';

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username: uname,
      name: name,
      password: hashedPassword,
      role: 'admin',
      allowedCategories: !isSuper && sanitizedCategories && sanitizedCategories.length > 0 ? sanitizedCategories : undefined,
      businessUnits: !isSuper && Array.isArray(businessUnits) && businessUnits.length > 0 ? businessUnits : undefined,
      isScannerOnly: effectiveScannerOnly,
      scannerRegTypes: !isSuper && Array.isArray(scannerRegTypes) ? scannerRegTypes : [],
      canManageUsers: isSuper || !effectiveScannerOnly,
    });

    await recordLog(token.id, 'createUser', { createdUsername: newUser.username, targetId: newUser._id.toString() });

    return NextResponse.json({ message: 'User created', username: newUser.username }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
