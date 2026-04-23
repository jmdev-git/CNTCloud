import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AttendanceEvent from '@/models/AttendanceEvent';
import Announcement from '@/models/Announcement';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const businessUnit = searchParams.get('businessUnit');
    const isActive = searchParams.get('isActive') === 'true' ? true : searchParams.get('isActive') === 'false' ? false : undefined;

    const filter: any = {};
    
    if (businessUnit && businessUnit !== 'all') {
      filter.businessUnit = businessUnit;
    }
    
    if (isActive !== undefined) {
      filter.isActive = isActive;
    }

    const events = await AttendanceEvent.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching attendance events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance events' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const eventData = await request.json();
    
    const newEvent = {
      ...eventData,
      eventDate: new Date(eventData.eventDate),
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : undefined,
      createdBy: session.user.name || session.user.email || 'Unknown',
    };

    const event = await AttendanceEvent.create(newEvent);
    
    // Create pulse announcement for the event
    const pulseAnnouncement = {
      title: `Event Registration: ${eventData.title}`,
      content: `Registration is now open for ${eventData.title}. Event Date: ${new Date(eventData.eventDate).toLocaleDateString()} at ${eventData.eventTime}. Location: ${eventData.location}. Registration Deadline: ${eventData.registrationDeadline ? new Date(eventData.registrationDeadline).toLocaleDateString() : 'No deadline'}.`,
      category: 'events',
      createdAt: new Date(),
      createdBy: session.user.name || session.user.email || 'Unknown',
      businessUnit: eventData.businessUnit,
      eventDate: new Date(eventData.eventDate),
      eventTime: eventData.eventTime,
      registrationDeadline: eventData.registrationDeadline ? new Date(eventData.registrationDeadline) : undefined,
      registrationDeadlineTime: eventData.registrationDeadlineTime,
      location: eventData.location,
      isActive: true,
      requiresAcknowledgment: false,
      memoUid: `ATT-${event._id.toString().slice(-6).toUpperCase()}`,
      attendanceEventId: event._id,
    };

    await Announcement.create(pulseAnnouncement);

    // Trigger announcement update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('announcements-updated'));
    }

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error('Error creating attendance event:', error);
    return NextResponse.json(
      { error: 'Failed to create attendance event' },
      { status: 500 }
    );
  }
}
