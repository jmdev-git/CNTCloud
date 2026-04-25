import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Acknowledgment from '@/models/Acknowledgment';

// Mark this route as dynamic to prevent static generation
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(req.url);
    const memoId = searchParams.get('memo_id');
    const email = searchParams.get('email');

    let query: any = {};
    if (memoId) query.memo_id = memoId;
    if (email) query.employee_email = email.toLowerCase().trim();

    const acknowledgments = await Acknowledgment.find(query).sort({ acknowledged_at: -1 });
    return NextResponse.json(acknowledgments);
  } catch (error) {
    console.error('Acknowledgment GET Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect();
    const data = await req.json();
    const { memo_id, memo_title, memo_link, employee_email, employee_name } = data;

    if (!memo_id || !memo_title || !employee_email || !employee_name) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const email = employee_email.toLowerCase().trim();

    // Use findOneAndUpdate with upsert to avoid duplicate errors and ensure idempotency
    const ack = await Acknowledgment.findOneAndUpdate(
      { memo_id, employee_email: email },
      {
        memo_id,
        memo_title,
        memo_link,
        employee_email: email,
        employee_name,
        acknowledged_at: new Date(),
      },
      { upsert: true, new: true }
    );

    return NextResponse.json(ack, { status: 201 });
  } catch (error) {
    console.error('Acknowledgment POST Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
