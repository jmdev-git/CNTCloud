import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Announcement from '@/models/Announcement';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { recordLog } from '@/utils/logger';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await dbConnect();
    const { id } = await context.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    const now = new Date();
    const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
    const expiresAt = (announcement as { expiresAt?: Date } | null)?.expiresAt;
    const createdAt = (announcement as { createdAt?: Date } | null)?.createdAt;
    const isExpired =
      (expiresAt instanceof Date && expiresAt.getTime() <= now.getTime()) ||
      (!expiresAt && createdAt instanceof Date && createdAt.getTime() <= now.getTime() - maxAgeMs);
    if (isExpired) {
      await Announcement.findByIdAndDelete(id);
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }
    return NextResponse.json(announcement);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;
    const data = (await request.json()) as Record<string, unknown>;
    delete data.createdBy;
    delete data.createdAt;

    if (data.expiresAt) {
      const maxAgeMs = 30 * 24 * 60 * 60 * 1000;
      const existing = await Announcement.findById(id, 'createdAt').lean();
      const createdAt = (existing as { createdAt?: Date } | null)?.createdAt;
      if (createdAt) {
        const maxExpiresAt = new Date(new Date(createdAt).getTime() + maxAgeMs);
        const raw = data.expiresAt;
        const requested =
          raw instanceof Date ? raw : typeof raw === 'string' ? new Date(raw) : undefined;
        if (!requested || Number.isNaN(requested.getTime())) {
          delete data.expiresAt;
        } else {
          data.expiresAt = requested > maxExpiresAt ? maxExpiresAt : requested;
        }
      } else {
        delete data.expiresAt;
      }
    }
    
    // Ensure TTL index is synced so auto-delete works reliably
    await Announcement.syncIndexes();

    const announcement = await Announcement.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    // Create log entry using recordLog
    if (session.user.id) {
      await recordLog(session.user.id, 'update_announcement', {
        targetTitle: announcement.title,
        targetId: id,
      });
    }

    return NextResponse.json(announcement);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }>}
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const { id } = await context.params;
    const announcement = await Announcement.findById(id);
    
    if (!announcement) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 });
    }

    const title = announcement.title;
    await Announcement.findByIdAndDelete(id);

    // Create log entry using recordLog
    if (session.user.id) {
      await recordLog(session.user.id, 'delete_announcement', {
        targetTitle: title,
        targetId: id,
      });
    }

    return NextResponse.json({ message: 'Announcement deleted successfully' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
