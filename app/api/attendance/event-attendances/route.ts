import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import EventAttendance from '@/models/EventAttendance';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    const attendances = await EventAttendance.find({ isPresent: true })
      .sort({ attendedAt: -1 })
      .lean();
    
    return NextResponse.json(attendances);
  } catch (error) {
    console.error('Error fetching event attendances:', error);
    return NextResponse.json(
      { error: 'Failed to fetch event attendances' },
      { status: 500 }
    );
  }
}
