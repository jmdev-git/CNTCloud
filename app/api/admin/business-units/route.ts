import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import BusinessUnit from '@/models/BusinessUnit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordLog } from '@/utils/logger';

export async function GET() {
  try {
    await dbConnect();
    const bus = await BusinessUnit.find({}).sort({ name: 1 });
    return NextResponse.json(bus);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.canManageUsers) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await request.json();
    const bu = await BusinessUnit.create(data);

    if (session.user.id) {
      await recordLog(session.user.id, 'create_business_unit', {
        targetTitle: bu.name,
        targetId: bu._id.toString(),
      });
    }

    return NextResponse.json(bu, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
