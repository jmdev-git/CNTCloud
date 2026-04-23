import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import Log from '@/models/Log';
import User from '@/models/User';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const isItAdmin = session?.user?.username === 'itadmin' || session?.user?.username === 'it.support@cntpromoads.com';
    if (!session || !session.user || !isItAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();

    // Auto-delete logs older than 60 days
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    await Log.deleteMany({ timestamp: { $lt: cutoff } });
    const logs = await Log.find()
      .populate({
        path: 'adminId',
        select: 'name',
        options: { strictPopulate: false }
      })
      .sort({ timestamp: -1 })
      .limit(100)
      .lean();

    // Transform logs to use admin name if available
    const transformedLogs = await Promise.all(logs.map(async (log: any) => {
      let displayName = log.performedBy;
      
      if (log.adminId?.name) {
        displayName = log.adminId.name;
      } else if (log.performedBy) {
        // Fallback: try to find the user by username/email to get their current name
        const user = await User.findOne({ 
          $or: [
            { username: log.performedBy },
            { name: log.performedBy } // In case it's already a name
          ]
        }, 'name').lean();
        if (user?.name) {
          displayName = user.name;
        }
      }
      
      // Specifically fix for the IT admin if it still shows the old name/email
      if (displayName === 'it.support@cntpromoads.com' || displayName === 'itadmin' || displayName === 'IT Support') {
        displayName = 'IT Admin';
      }

      return {
        ...log,
        performedBy: displayName
      };
    }));

    return NextResponse.json(transformedLogs);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
