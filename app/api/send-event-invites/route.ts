import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { eventId, eventTitle, eventDate, invitedEmails } = body || {};

    if (!eventId || !invitedEmails || !Array.isArray(invitedEmails)) {
      return NextResponse.json({ error: 'Invalid invite data' }, { status: 400 });
    }

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || 'no-reply@cntpromoads.com';
    const secure = process.env.SMTP_SECURE === 'true';

    // Base URL for the registration link
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    if (!host || !user || !pass) {
      console.warn('SMTP configuration missing. Falling back to log-only mode.');
      console.log('--- EVENT INVITES FALLBACK ---');
      invitedEmails.forEach((email: string) => {
        const inviteLink = `${baseUrl}/register/${eventId}?email=${encodeURIComponent(email)}`;
        console.log(`To: ${email} | Event: ${eventTitle} | Link: ${inviteLink}`);
      });
      console.log('------------------------------');
      return NextResponse.json({ ok: true, mode: 'log', message: 'Invites logged (SMTP missing)' });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const formattedDate = eventDate ? new Date(eventDate).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }) : 'To be announced';

    const sendPromises = invitedEmails.map(async (email: string) => {
      const inviteLink = `${baseUrl}/register/${eventId}?email=${encodeURIComponent(email)}`;
      
      const subject = `Invitation: ${eventTitle}`;
      const html = `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #ed1c24;">Hi,</h2>
          <p style="font-size: 16px; line-height: 1.5;">You are invited to attend:</p>
          <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;"><strong>Event:</strong> ${eventTitle}</p>
            <p style="margin: 10px 0 0 0; font-size: 16px;"><strong>Date:</strong> ${formattedDate}</p>
          </div>
          <p style="font-size: 16px; line-height: 1.5;">Click the link below to register and generate your entry pass:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${inviteLink}" style="background: #ed1c24; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">Confirm Attendance</a>
          </div>
          <p style="font-size: 14px; color: #666; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
            Thank you!<br/>
            <strong>CNT CloudSpace</strong>
          </p>
        </div>
      `;

      return transporter.sendMail({
        from,
        to: email,
        subject,
        html,
      });
    });

    await Promise.all(sendPromises);

    return NextResponse.json({ ok: true, mode: 'smtp', count: invitedEmails.length });
  } catch (error) {
    console.error('Failed to send invites:', error);
    return NextResponse.json({ error: 'Failed to send invites' }, { status: 500 });
  }
}
