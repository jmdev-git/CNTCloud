
import dbConnect from '@/lib/mongodb';
import Log from '@/models/Log';
import User from '@/models/User';

type LogAction =
  | 'createUser'
  | 'updateUser'
  | 'deleteUser'
  | 'create_announcement'
  | 'update_announcement'
  | 'delete_announcement'
  | 'create_business_unit'
  | 'update_business_unit'
  | 'delete_business_unit'
  | 'create_company_email'
  | 'update_company_email'
  | 'delete_company_email';

type LogDetails = {
  targetTitle?: string;
  targetId?: string;
  createdUsername?: string;
  updatedUsername?: string;
  deletedUsername?: string;
};

export async function recordLog(
  adminId: string,
  action: LogAction,
  details: LogDetails = {}
) {
  try {
    await dbConnect();
    const admin = await User.findById(adminId, 'username name').lean();
    const performedBy = (admin as { username?: string; name?: string } | null)?.name || 
                        (admin as { username?: string; name?: string } | null)?.username || 
                        adminId;

    const targetTitle =
      details.targetTitle ||
      details.createdUsername ||
      details.updatedUsername ||
      details.deletedUsername ||
      action;

    const targetId = details.targetId || adminId;

    await Log.create({
      action,
      targetTitle,
      targetId,
      performedBy,
      adminId,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('Failed to record log:', error);
  }
}
