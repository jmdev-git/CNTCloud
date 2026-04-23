import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import EventAttendance from '@/models/EventAttendance';
import CompanyEmail from '@/models/CompanyEmail';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: announcementId } = await context.params;

    const registrations = await EventAttendance.find({ announcementId })
      .sort({ registeredAt: -1 })
      .lean();

    return NextResponse.json(registrations);
  } catch (error) {
    console.error('Error fetching event attendance:', error);
    return NextResponse.json(
      { error: 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id: announcementId } = await context.params;
    const { employeeEmail, employeeName } = await request.json();

    if (!employeeEmail || !employeeName) {
      return NextResponse.json({ error: 'Email and name are required' }, { status: 400 });
    }

    // Validate announcement exists
    const announcement = await Announcement.findById(announcementId);
    if (!announcement) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if it's an event
    if (announcement.category !== 'events') {
      return NextResponse.json({ error: 'This announcement is not an event' }, { status: 400 });
    }

    // Check if user is from the same business unit if restricted
    const corporateEmail = await CompanyEmail.findOne({ email: employeeEmail.toLowerCase().trim() });
    // Also allow admin users
    const adminUser = !corporateEmail
      ? await User.findOne({ username: employeeEmail.toLowerCase().trim() }).lean()
      : null;

    if (!corporateEmail && !adminUser) {
      return NextResponse.json({ error: 'Access Denied: Your email is not registered in our corporate directory.' }, { status: 403 });
    }

    // Resolve actual name from DB
    const resolvedName = corporateEmail?.name || (adminUser as any)?.name || employeeName;

    // --- ENFORCE REGISTRATION TYPES ---
    const regType = announcement.registrationType || 'GENERAL';

    if (regType === 'BU_ONLY') {
      const allowedBUs = announcement.allowedBusinessUnits || [];
      const userBU = corporateEmail?.businessUnit || (adminUser as any)?.businessUnits?.[0] || '';
      if (!allowedBUs.includes(userBU)) {
        return NextResponse.json({ 
          error: `Access Denied: This event is restricted to ${allowedBUs.join(', ')}. Your Business Unit: ${userBU}` 
        }, { status: 403 });
      }
    }

    if (regType === 'INVITE_ONLY') {
      const invitedUsers = announcement.invitedUsers || [];
      if (!invitedUsers.some((email: string) => email.toLowerCase() === employeeEmail.toLowerCase())) {
        return NextResponse.json({ 
          error: 'Access Denied: This is an exclusive event. You must be on the guest list to register.' 
        }, { status: 403 });
      }
    }

    if (regType === 'RULE_BASED' && announcement.ruleConfig?.type === 'BIRTHDAY') {
      const birthdate = corporateEmail?.birthdate || (adminUser as any)?.birthdate;
      if (!birthdate) {
        return NextResponse.json({ error: 'Access Denied: Your birthday information is missing from your profile.' }, { status: 403 });
      }
      const birthDate = new Date(birthdate);
      const targetMonth = announcement.ruleConfig.month; // 0-indexed
      if (birthDate.getMonth() !== targetMonth) {
        const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        return NextResponse.json({ 
          error: `Access Denied: This event is only for employees born in ${months[targetMonth]}.` 
        }, { status: 403 });
      }
    }
    // ----------------------------------

    // Check if registration deadline has passed
    if (announcement.registrationDeadline) {
      const deadline = new Date(announcement.registrationDeadline);
      if (announcement.registrationDeadlineTime) {
        const [hours, minutes] = announcement.registrationDeadlineTime.split(':').map(Number);
        deadline.setHours(hours || 0, minutes || 0, 0, 0);
      } else {
        deadline.setHours(23, 59, 59, 999);
      }
      
      if (new Date() > deadline) {
        return NextResponse.json({ error: 'Registration deadline has passed' }, { status: 400 });
      }
    }

    // Check if user is already registered
    const existingRegistration = await EventAttendance.findOne({
      announcementId,
      employeeEmail: employeeEmail.toLowerCase().trim()
    });

    if (existingRegistration) {
      return NextResponse.json({ error: 'You are already registered for this event' }, { status: 400 });
    }

    // Generate QR code data - simplified format as requested
    const qrCodeData = JSON.stringify({
      eventId: announcementId,
      userEmail: employeeEmail.toLowerCase().trim()
    });

    // Create registration
    const registration = await EventAttendance.create({
      announcementId,
      employeeEmail: employeeEmail.toLowerCase().trim(),
      employeeName: resolvedName,
      registeredAt: new Date(),
      isPresent: false,
      qrCodeData
    });

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error('Error registering for event:', error);
    return NextResponse.json(
      { error: 'An error occurred during registration. Please try again later.' },
      { status: 500 }
    );
  }
}
