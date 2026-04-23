import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { to, name, memoTitle, link, acknowledgedAt } = body || {};

    const host = process.env.SMTP_HOST;
    const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.MAIL_FROM || 'no-reply@cntpromoads.com';
    const secure = process.env.SMTP_SECURE === 'true';

    if (!host || !user || !pass) {
      console.log(
        `[Ack Email Fallback] To: ${to} | Name: ${name} | Title: ${memoTitle} | Link: ${link} | At: ${acknowledgedAt}`
      );
      return new Response(JSON.stringify({ ok: true, mode: 'log' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
    });

    const subject = 'Acknowledgment Receipt – Office Policy Update';
    const html = `
      <p>Hello ${name || ''},</p>
      <p>You have successfully acknowledged the memorandum:</p>
      <p><strong>Title:</strong> ${memoTitle || ''}<br/>
      <strong>Link:</strong> ${link || ''}<br/>
      <strong>Acknowledged on:</strong> ${acknowledgedAt ? new Date(acknowledgedAt).toLocaleString() : ''}<br/>
      <strong>Email used:</strong> ${to}</p>
      <p>This confirms you have acknowledged this memorandum.</p>
      <p>Thank you,<br/>PULSE</p>
    `;

    await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    return new Response(JSON.stringify({ ok: true, mode: 'smtp' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch {
    return new Response(JSON.stringify({ ok: false }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
