import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import BusinessUnit from '@/models/BusinessUnit';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordLog, recordSecurityEvent } from '@/utils/logger';
import { CATEGORIES } from '@/types';
import https from 'https';
import { AnnouncementSchema } from '@/lib/schemas';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    await dbConnect();
    const now = new Date();
    const maxAgeMs = 60 * 24 * 60 * 60 * 1000;
    await Announcement.deleteMany({
      $or: [
        { expiresAt: { $lte: now } },
        { expiresAt: { $exists: false }, createdAt: { $lte: new Date(now.getTime() - maxAgeMs) } },
      ],
    });
    const announcements = await Announcement.find({}).sort({ createdAt: -1 });
    return NextResponse.json(announcements);
  } catch (error) {
    console.error('Announcement POST Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message, details: error }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      await recordSecurityEvent('security_unauthorized_access', {
        reason: 'Unauthenticated POST to /api/announcements',
        endpoint: '/api/announcements',
        ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      });
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const data = await req.json();

    // Zod validation
    const parsed = AnnouncementSchema.safeParse(data);
    if (!parsed.success) {
      await recordSecurityEvent('security_validation_failed', {
        reason: `Invalid announcement payload: ${parsed.error.issues.map(i => i.message).join(', ')}`,
        endpoint: '/api/announcements',
        identity: (session.user as any)?.name || 'unknown',
      });
      return NextResponse.json({ error: 'Invalid data', details: parsed.error.issues }, { status: 400 });
    }

    const username = (session.user as { name?: string } | undefined)?.name;
    const payload = data as Record<string, unknown>;

    const createdAt =
      payload.createdAt instanceof Date
        ? payload.createdAt
        : typeof payload.createdAt === 'string'
          ? new Date(payload.createdAt)
          : new Date();
    const maxAgeMs = 60 * 24 * 60 * 60 * 1000;
    const maxExpiresAt = new Date(createdAt.getTime() + maxAgeMs);
    const expiresAtValue = payload.expiresAt;
    const requestedExpiresAt =
      expiresAtValue instanceof Date
        ? expiresAtValue
        : typeof expiresAtValue === 'string'
          ? new Date(expiresAtValue)
          : undefined;

    payload.createdAt = createdAt;
    const categoryValue = typeof payload.category === 'string' ? payload.category : '';
    const categoryKey = Object.prototype.hasOwnProperty.call(CATEGORIES, categoryValue) ? (categoryValue as keyof typeof CATEGORIES) : undefined;
    const rules = categoryKey ? CATEGORIES[categoryKey]?.rules : undefined;
    const defaultDays = typeof rules?.autoHideDays === 'number' && rules.autoHideDays > 0 ? Math.min(60, rules.autoHideDays) : 60;

    const computeDefaultExpiresAt = () => {
      if (categoryValue === 'events') {
        const raw = payload.eventDate;
        const d = raw instanceof Date ? raw : typeof raw === 'string' ? new Date(raw) : undefined;
        if (d && !Number.isNaN(d.getTime())) {
          const end = new Date(d);
          end.setHours(23, 59, 59, 999);
          return end;
        }
      }
      const end = new Date(createdAt.getTime() + defaultDays * 24 * 60 * 60 * 1000);
      return end;
    };

    const computed =
      requestedExpiresAt && !Number.isNaN(requestedExpiresAt.getTime())
        ? requestedExpiresAt
        : computeDefaultExpiresAt();

    payload.expiresAt = computed > maxExpiresAt ? maxExpiresAt : computed;

    if (username) {
      payload.createdBy = username;
    }

    const userBUs = (session?.user as any)?.businessUnits || [];
    const isCNTGroup = Array.isArray(userBUs) && userBUs.some((bu: string) => {
      const b = (bu || "").trim().toUpperCase();
      return b === "CNT GROUP" || b === "CNTGROUP";
    });

    const isSuperAdmin = username === 'itadmin' || username === 'it.support@cntpromoads.com';
    if (isSuperAdmin || isCNTGroup) {
      if (!payload.businessUnit || String(payload.businessUnit).trim() === '') {
        payload.businessUnit = 'CNT GROUP';
      }
    }
    // Ensure TTL index is synced so auto-delete works reliably
    await Announcement.syncIndexes();
    // Auto-generate memoUid when missing based on Business Unit prefix
    const normalizeBU = (s?: string) => {
      const v = (s || "").trim();
      if (!v) return "";
      const clean = v.toUpperCase().replace(/[^A-Z0-9]+/g, ""); // Remove all spaces and symbols
      if (clean.startsWith("FRONT")) return "FRONTIER";
      if (clean.startsWith("LYFELAN")) return "LYFE LAND";
      if (clean.includes("PROMO") && (clean.includes("ADS") || clean.includes("AD"))) return "CNT PROMO & ADS SPECIALISTS";
      return v.toUpperCase();
    };
    const buName = normalizeBU((payload as { businessUnit?: string }).businessUnit);
    let prefix = '';
    
    if (buName) {
      const buDoc = await BusinessUnit.findOne({ name: new RegExp(`^${buName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }).lean();
      if (buDoc) {
        prefix = (buDoc as { label?: string }).label || '';
      }
    }

    const memoUidRaw = (payload as { memoUid?: unknown }).memoUid;
    const currentMemoUid = typeof memoUidRaw === 'string' ? memoUidRaw.trim() : '';
    if (buName && prefix && !currentMemoUid) {
      const docs = await Announcement.find(
        { businessUnit: buName, memoUid: { $regex: `^${prefix}-\\d+$`, $options: 'i' } },
        'memoUid',
      ).lean();
      let maxNum = 0;
      for (const d of docs as Array<{ memoUid?: string }>) {
        const m = (d.memoUid || '').match(new RegExp(`^${prefix}-(\\d+)$`, 'i'));
        if (m && m[1]) {
          const n = parseInt(m[1], 10);
          if (!Number.isNaN(n)) {
            maxNum = Math.max(maxNum, n);
          }
        }
      }
      const next = (maxNum + 1);
      const memoUid = `${prefix}-${String(next).padStart(3, '0')}`;
      (payload as { memoUid?: string }).memoUid = memoUid;
    }
    const announcement = await Announcement.create(payload);

    // Send Synology Chat Webhook
    try {
      let webhookUrl = process.env.WEBHOOK_URL;
      if (webhookUrl) {
        // Clean up URL (remove any extra quotes that might have been added in .env)
        webhookUrl = webhookUrl.replace(/%22/g, '').replace(/"/g, '');
        
        const categoryName = CATEGORIES[announcement.category as keyof typeof CATEGORIES]?.displayName || announcement.category;
        const baseUrl = (process.env.NEXTAUTH_URL || '').replace(/\/$/, '');
        const pulseUrl = `${baseUrl}/pulse`;
        
        // Truncate content to the first paragraph
        const fullContent = announcement.content || '';
        const paragraphs = fullContent.split(/\n\s*\n/);
        const truncatedContent = paragraphs[0] + (paragraphs.length > 1 ? '\n\n...' : '');

        const text = `📢 *New Announcement*\n\n*Title:* ${announcement.title}\n*Category:* ${categoryName}\n*Created By:* ${announcement.createdBy}\n\n${truncatedContent}\n\n🔗 Click here to view the full details: ${pulseUrl}\n\n_**This is an automated system message generated by the BOT🤖**_`;
        
        const payloadData = { text };
        const body = `payload=${encodeURIComponent(JSON.stringify(payloadData))}`;

        console.log('Sending webhook to Synology via HTTPS module...');
        
        // Use https module to bypass SSL certificate issues for local IP
        const url = new URL(webhookUrl);
        const options = {
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname + url.search,
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Content-Length': Buffer.byteLength(body),
          },
          rejectUnauthorized: false, // Bypass SSL verification for internal Synology IP
        };

        const webhookRequest = new Promise((resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
              try {
                const result = JSON.parse(data);
                resolve(result);
              } catch (e) {
                resolve({ success: res.statusCode === 200, raw: data });
              }
            });
          });

          req.on('error', (e) => {
            console.error('Webhook Request Error:', e);
            reject(e);
          });

          req.write(body);
          req.end();
        });

        const result = await webhookRequest;
        console.log('Synology Response:', result);
      }
    } catch (error) {
      console.error('Synology Webhook Error:', error);
    }

    // Create log entry using recordLog
    if (session.user.id) {
      await recordLog(session.user.id, 'create_announcement', {
        targetTitle: announcement.title,
        targetId: announcement._id.toString(),
      });
    }

    return NextResponse.json(announcement, { status: 201 });
  } catch (error) {
    console.error('Announcement POST Error:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ 
      error: message, 
      details: error instanceof Error ? error.stack : undefined 
    }, { status: 500 });
  }
}
