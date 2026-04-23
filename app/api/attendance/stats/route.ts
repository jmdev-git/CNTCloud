import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const mongoose = await dbConnect();
    const db = mongoose.connection.db;

    if (!db) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Get all attendance events
    const events = await db.collection('attendance_events')
      .find({ isActive: true })
      .sort({ createdAt: -1 })
      .toArray();

    // Get all registrations with attendance data
    const registrations = await db.collection('attendance_registrations')
      .find({})
      .toArray();

    // Calculate statistics
    const totalEvents = events.length;
    const totalAttendees = registrations.filter(reg => reg.attended).length;
    const totalRegistrations = registrations.length;
    const averageAttendance = totalEvents > 0 ? Math.round((totalAttendees / totalEvents) * 100) / 100 : 0;

    const stats = {
      totalEvents,
      totalAttendees,
      totalRegistrations,
      averageAttendance,
      events: events.map(event => {
        const eventRegistrations = registrations.filter(reg => reg.eventId === event._id.toString());
        const attendedCount = eventRegistrations.filter(reg => reg.attended).length;
        
        return {
          eventId: event._id,
          title: event.title,
          date: event.eventDate,
          totalRegistrations: eventRegistrations.length,
          attendedCount,
          attendanceRate: eventRegistrations.length > 0 ? Math.round((attendedCount / eventRegistrations.length) * 100) : 0
        };
      })
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Error fetching attendance statistics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance statistics' },
      { status: 500 }
    );
  }
}
