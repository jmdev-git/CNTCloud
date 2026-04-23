import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import CompanyEmail from '@/models/CompanyEmail';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const email = (searchParams.get('email') || '').toLowerCase().trim();
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    
    // Check CompanyEmail directory first
    let item = await CompanyEmail.findOne({ email });
    
    if (!item) {
      // If not found in directory, check if it's an admin user email
      const adminUser = await User.findOne({ username: email });
      if (adminUser) {
        // Map admin user to a company email format for frontend consistency
        item = {
          _id: adminUser._id.toString(),
          email: adminUser.username,
          name: adminUser.name || adminUser.username.split('@')[0].replace(/[\._]/g, ' '),
          businessUnit: Array.isArray(adminUser.businessUnits) ? adminUser.businessUnits[0] : 'CNT GROUP',
        };
      }
    }

    if (!item) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
