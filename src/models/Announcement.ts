import mongoose, { Schema, Document } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  category: 'events' | 'company-news' | 'urgent-notices' | 'policy' | 'birthday-celebrants' | 'food-menu';
  createdAt: Date;
  createdBy?: string;
  memoUid?: string;
  businessUnit?: string;
  expiresAt?: Date;
  pinned?: boolean;
  link?: string;
  fileUrl?: string;
  imageUrl?: string;
  imageUrls?: string[];
  eventDate?: Date;
  eventTime?: string;
  registrationDeadline?: Date;
  registrationDeadlineTime?: string;
  registrationType?: 'GENERAL' | 'BU_ONLY' | 'INVITE_ONLY' | 'RULE_BASED';
  allowedBusinessUnits?: string[];
  invitedUsers?: string[];
  ruleConfig?: {
    type: string;
    month?: number;
  };
  location?: string;
  isActive: boolean;
  requiresAcknowledgment?: boolean;
  requiresOtp?: boolean;
  attendanceEventId?: mongoose.Types.ObjectId;
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String },
  category: { 
    type: String, 
    required: true,
    enum: ['events', 'company-news', 'urgent-notices', 'policy', 'birthday-celebrants', 'food-menu']
  },
  createdBy: { type: String },
  memoUid: { type: String },
  businessUnit: { type: String },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, expires: 0 },
  pinned: { type: Boolean, default: false },
  link: { type: String },
  fileUrl: { type: String },
  imageUrl: { type: String },
  imageUrls: [{ type: String }],
  eventDate: { type: Date },
  eventTime: { type: String },
  registrationDeadline: { type: Date },
  registrationDeadlineTime: { type: String },
  registrationType: { 
    type: String, 
    enum: ['GENERAL', 'BU_ONLY', 'INVITE_ONLY', 'RULE_BASED'],
    default: 'GENERAL'
  },
  allowedBusinessUnits: [{ type: String }],
  invitedUsers: [{ type: String }],
  ruleConfig: {
    type: { type: String },
    month: { type: Number },
  },
  location: { type: String },
  isActive: { type: Boolean, default: true },
  requiresAcknowledgment: { type: Boolean, default: false },
  requiresOtp: { type: Boolean, default: false },
  attendanceEventId: { type: Schema.Types.ObjectId, ref: 'AttendanceEvent' },
}, {
  timestamps: true,
});

// Use existing model if it exists, or create a new one
export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);
