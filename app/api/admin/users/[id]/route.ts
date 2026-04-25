import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import { recordLog } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const ALL_CATEGORIES = ['events', 'company-news', 'urgent-notices', 'policy', 'birthday-celebrants', 'food-menu'];

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin' || !token.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;
    await dbConnect();
    // Only allow edits when caller is itadmin (superadmin)
    const caller = await User.findById(token.id).lean();
    const isSuperAdmin = (u: any) => u?.username === 'itadmin' || u?.username === 'it.support@cntpromoads.com';
    
    if (!caller || !isSuperAdmin(caller)) {
      return NextResponse.json({ error: 'Only itadmin can edit accounts' }, { status: 403 });
    }
    const target = await User.findById(id).lean();
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
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

    const update: Record<string, unknown> = {};
    if (username && username.trim()) {
      update.username = username.trim().toLowerCase();
    }
    if (name && name.trim()) {
      update.name = name.trim();
    }
    if (typeof password === 'string' && password.trim()) {
      update.password = await bcrypt.hash(password, 10);
    }
    if (!isSuperAdmin(target)) {
      if (Array.isArray(allowedCategories)) {
        const sanitized = allowedCategories.filter((c) => ALL_CATEGORIES.includes(c));
        update.allowedCategories = sanitized.length > 0 ? sanitized : undefined;
      }
      if (Array.isArray(businessUnits)) {
        update.businessUnits = businessUnits.length > 0 ? businessUnits : undefined;
      }
      if (typeof isScannerOnly === 'boolean') {
        update.isScannerOnly = isScannerOnly;
      }
      if (Array.isArray(scannerRegTypes)) {
        update.scannerRegTypes = scannerRegTypes;
      }
    }

    const updatedUser = await User.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await recordLog(token.id, 'updateUser', { updatedUsername: updatedUser.username, targetId: updatedUser._id.toString() });

    return NextResponse.json(
      {
        _id: updatedUser._id.toString(),
        username: updatedUser.username as string,
        allowedCategories: Array.isArray(updatedUser.allowedCategories) ? updatedUser.allowedCategories : [],
        isScannerOnly: !!(updatedUser as { isScannerOnly?: boolean }).isScannerOnly,
        scannerRegTypes: Array.isArray((updatedUser as { scannerRegTypes?: string[] }).scannerRegTypes) ? (updatedUser as { scannerRegTypes?: string[] }).scannerRegTypes : [],
      },
      { status: 200 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || token.role !== 'admin' || !token.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const params = await context.params;
    const { id } = params;

    await dbConnect();

    const target = await User.findById(id).lean();
    if (!target) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const isSuperAdmin = (u: any) => u?.username === 'itadmin' || u?.username === 'it.support@cntpromoads.com';
    if (token.id === id || isSuperAdmin(target)) {
      return NextResponse.json({ error: 'This account cannot be deleted' }, { status: 400 });
    }

    const deleted = await User.findByIdAndDelete(id).lean();
    if (!deleted) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    await recordLog(token.id, 'deleteUser', { deletedUsername: deleted.username, targetId: deleted._id.toString() });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
