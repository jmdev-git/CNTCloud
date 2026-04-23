import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CompanyEmail from '@/models/CompanyEmail';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordLog } from '@/utils/logger';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userBUs = (session?.user as any)?.businessUnits || [];
    const isCNTGroup = Array.isArray(userBUs) && userBUs.some((bu: string) => {
      const b = (bu || "").trim().toUpperCase();
      return b === "CNT GROUP" || b === "CNTGROUP";
    });
    
    const canAccessTracking = !!session?.user?.allowedCategories?.includes('policy') || isCNTGroup;
    
    if (!session || !session.user || (!session.user.canManageUsers && !canAccessTracking)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    const isItAdmin = session?.user?.username === 'itadmin' || session?.user?.username === 'it.support@cntpromoads.com' || session?.user?.username === 'itadmin@gmail.com';
    // For super admins or users with manage users permission, return all
    if (session.user.canManageUsers || isItAdmin) {
      const items = await CompanyEmail.find({}).sort({ email: 1 });
      return NextResponse.json(items);
    }

    // For restricted users with policy access, return all emails 
    // (Frontend will handle the specific BU filtering for tracking)
    const items = await CompanyEmail.find({}).sort({ email: 1 });
    return NextResponse.json(items);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
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
    const body = await request.json();
    const item = await CompanyEmail.create(body);

    if (session.user.id) {
      await recordLog(session.user.id, 'create_company_email', {
        targetTitle: item.email,
        targetId: item._id.toString(),
      });
    }

    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
