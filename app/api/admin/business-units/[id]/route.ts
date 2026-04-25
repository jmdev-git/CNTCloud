import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusinessUnit from '@/models/BusinessUnit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordLog } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    const { id } = await context.params;
    const bu = await BusinessUnit.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!bu) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    if (session.user.id) {
      await recordLog(session.user.id, 'update_business_unit', {
        targetTitle: bu.name,
        targetId: bu._id.toString(),
      });
    }

    return NextResponse.json(bu);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;
    const bu = await BusinessUnit.findByIdAndDelete(id);
    if (!bu) {
      return NextResponse.json({ error: 'Business unit not found' }, { status: 404 });
    }

    if (session.user.id) {
      await recordLog(session.user.id, 'delete_business_unit', {
        targetTitle: bu.name,
        targetId: bu._id.toString(),
      });
    }

    return NextResponse.json({ message: 'Business unit deleted' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
