import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AttendanceEvent from '@/models/AttendanceEvent';
import AttendanceRegistration from '@/models/AttendanceRegistration';
import Announcement from '@/models/Announcement';
import EventAttendance from '@/models/EventAttendance';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { qrData, eventId: manualEventId } = await request.json();

    // Parse QR data
    let parsedData;
    try {
      parsedData = JSON.parse(qrData);
    } catch {
      // If qrData is not JSON, it might be just the email or a raw string
      parsedData = { userEmail: qrData };
    }

    const eventId = parsedData.eventId || manualEventId;
    const userEmail = parsedData.userEmail || qrData;

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    if (!userEmail) {
      return NextResponse.json({ error: 'User Email is required' }, { status: 400 });
    }

    // --- HYBRID LOGIC: Support both AttendanceEvent and Announcement ---
    
    // 1. Try to find the event in both collections
    let event: any = await AttendanceEvent.findById(eventId);
    let isAnnouncementSystem = false;

    if (!event) {
      event = await Announcement.findById(eventId);
      if (event && event.category === 'events') {
        isAnnouncementSystem = true;
      }
    }

    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // 1.5. Check permissions
    const adminUser = session.user as any;
    const isSuperAdmin = adminUser.username === 'itadmin' || adminUser.username === 'it.support@cntpromoads.com';

    if (!isSuperAdmin) {
      // Check Business Unit Access
      if (adminUser.businessUnits && adminUser.businessUnits.length > 0) {
        const eventBU = event.businessUnit;
        if (eventBU && !adminUser.businessUnits.includes(eventBU)) {
          return NextResponse.json({ 
            error: `Unauthorized: Your Business Unit (${adminUser.businessUnits.join(', ')}) does not have access to scan for ${eventBU} events.` 
          }, { status: 403 });
        }
      }

      // Check Registration Type Access
      if (adminUser.scannerRegTypes && adminUser.scannerRegTypes.length > 0) {
        const eventRegType = event.registrationType || 'GENERAL';
        
        // Mapping: UI ID -> Model Enum
        const regTypeMapping: Record<string, string> = {
          'PUBLIC': 'GENERAL',
          'INVITE': 'INVITE_ONLY',
          'ATTRIBUTE': 'RULE_BASED',
          'BU_ONLY': 'BU_ONLY'
        };

        // Find which UI IDs the admin has
        const allowedModelTypes = adminUser.scannerRegTypes.map((t: string) => regTypeMapping[t] || t);
        
        if (!allowedModelTypes.includes(eventRegType)) {
          const typeLabels: Record<string, string> = {
            'GENERAL': 'Public Access',
            'INVITE_ONLY': 'Exclusive Invite',
            'RULE_BASED': 'Attribute-Based',
            'BU_ONLY': 'Business Unit'
          };
          return NextResponse.json({ 
            error: `Unauthorized: You are not assigned to scan ${typeLabels[eventRegType] || eventRegType} events.` 
          }, { status: 403 });
        }
      }
    }

    // 2. Try to find registration in corresponding collection
    let registration: any;
    if (isAnnouncementSystem) {
      registration = await EventAttendance.findOne({
        announcementId: eventId,
        employeeEmail: userEmail.toLowerCase()
      });
    } else {
      registration = await AttendanceRegistration.findOne({
        eventId,
        userEmail: userEmail.toLowerCase()
      });
    }

    if (!registration) {
      return NextResponse.json({ error: 'Registration not found' }, { status: 404 });
    }

    const alreadyAttended = isAnnouncementSystem ? registration.isPresent : registration.attended;

    if (alreadyAttended) {
      return NextResponse.json({ 
        message: 'Already scanned',
        attended: true,
        attendedAt: registration.attendedAt,
        userName: isAnnouncementSystem ? registration.employeeName : registration.userName,
        userEmail: isAnnouncementSystem ? registration.employeeEmail : registration.userEmail,
        eventTitle: event.title
      }, { status: 200 });
    }

    // 3. Mark as present
    if (isAnnouncementSystem) {
      registration.isPresent = true;
      registration.attendedAt = new Date();
    } else {
      registration.attended = true;
      registration.attendedAt = new Date();
    }
    await registration.save();

    return NextResponse.json({
      message: 'Successfully marked as present',
      attended: true,
      attendedAt: registration.attendedAt,
      userName: isAnnouncementSystem ? registration.employeeName : registration.userName,
      userEmail: isAnnouncementSystem ? registration.employeeEmail : registration.userEmail,
      eventTitle: event.title
    }, { status: 200 });
  } catch (error) {
    console.error('Error scanning QR code:', error);
    return NextResponse.json(
      { error: 'Failed to process QR code' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { searchParams } = new URL(request.url);
    const eventId = searchParams.get('eventId');

    if (!eventId) {
      return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
    }

    // Try System 2 first
    let registrations: any[] = await AttendanceRegistration.find({ eventId })
      .sort({ attendedAt: -1 })
      .lean();

    // If no registrations found, try System 1
    if (registrations.length === 0) {
      const system1Regs = await EventAttendance.find({ announcementId: eventId })
        .sort({ attendedAt: -1 })
        .lean();
      
      // Map System 1 to System 2 format for frontend consistency
      registrations = system1Regs.map(r => ({
        _id: r._id,
        eventId: r.announcementId,
        userName: r.employeeName,
        userEmail: r.employeeEmail,
        attended: r.isPresent,
        attendedAt: r.attendedAt,
        registeredAt: r.registeredAt
      }));
    }

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching attendance stats:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
