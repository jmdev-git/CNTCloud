import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import AttendanceEvent from '@/models/AttendanceEvent';
import AttendanceRegistration from '@/models/AttendanceRegistration';
import CompanyEmail from '@/models/CompanyEmail';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { eventId, userEmail, userName } = await request.json();

    // Validate the event exists and registration is still open
    const event = await AttendanceEvent.findById(eventId);
    if (!event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    if (!event.isActive) {
      return NextResponse.json({ error: 'Event is not active' }, { status: 400 });
    }

    const corporateEmail = await CompanyEmail.findOne({ email: userEmail.toLowerCase() });
    // Also allow admin users (in User collection) to register
    const adminUser = !corporateEmail
      ? await User.findOne({ username: userEmail.toLowerCase() }).lean()
      : null;

    if (!corporateEmail && !adminUser) {
      return NextResponse.json({ error: 'Access Denied: Your email is not registered in our corporate directory.' }, { status: 403 });
    }

    // Resolve the display name — prefer the name from DB over what was passed
    const resolvedName = corporateEmail?.name || (adminUser as any)?.name || userName || userEmail;

    // --- ENFORCE REGISTRATION TYPES ---
    const regType = event.registrationType || 'GENERAL';

    if (regType === 'BU_ONLY') {
      const allowedBUs = event.allowedBusinessUnits || [];
      const userBU = corporateEmail?.businessUnit || (adminUser as any)?.businessUnits?.[0] || '';
      if (!allowedBUs.includes(userBU)) {
        return NextResponse.json({ 
          error: `Access Denied: This event is restricted to ${allowedBUs.join(', ')}. Your Business Unit: ${userBU}` 
        }, { status: 403 });
      }
    }

    if (regType === 'INVITE_ONLY') {
      const invitedUsers = event.invitedUsers || [];
      if (!invitedUsers.some((email: string) => email.toLowerCase() === userEmail.toLowerCase())) {
        return NextResponse.json({ 
          error: 'Access Denied: This is an exclusive event. You must be on the guest list to register.' 
        }, { status: 403 });
      }
    }

    if (regType === 'RULE_BASED' && event.ruleConfig?.type === 'BIRTHDAY') {
      const birthdate = corporateEmail?.birthdate || (adminUser as any)?.birthdate;
      if (!birthdate) {
        return NextResponse.json({ error: 'Access Denied: Your birthday information is missing from your profile.' }, { status: 403 });
      }
      const birthDate = new Date(birthdate);
      const targetMonth = event.ruleConfig.month; // 0-indexed (0 = Jan, 3 = Apr)
      if (birthDate.getMonth() !== targetMonth) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return NextResponse.json({ 
          error: `Access Denied: This event is only for employees born in ${months[targetMonth]}.` 
        }, { status: 403 });
      }
    }
    // ----------------------------------

    if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
      return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
    }

    // Check if user is already registered
    const existingRegistration = await AttendanceRegistration.findOne({
      eventId,
      userEmail: userEmail.toLowerCase()
    });

    if (existingRegistration) {
      return NextResponse.json({ error: 'Already registered for this event' }, { status: 400 });
    }

    // Generate QR code data - simplified format as requested
    const qrData = JSON.stringify({
      eventId,
      userEmail: userEmail.toLowerCase()
    });

    // Create registration
    const registration = await AttendanceRegistration.create({
      eventId,
      userId: session.user.id || userEmail,
      userName: resolvedName,
      userEmail: userEmail.toLowerCase(),
      qrCodeData: qrData,
      registeredAt: new Date(),
      attended: false
    });

    return NextResponse.json({ 
      ...registration.toObject(), 
      qrCodeData: qrData
    }, { status: 201 });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'Failed to register for event' },
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

    const registrations = await AttendanceRegistration.find({ eventId })
      .sort({ registeredAt: -1 })
      .lean();

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
