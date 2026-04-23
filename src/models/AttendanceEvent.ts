import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceEvent extends Document {
  title: string;
  description: string;
  category: string;
  eventDate: Date;
  eventTime: string;
  location: string;
  maxAttendees?: number;
  registrationDeadline?: Date;
  registrationDeadlineTime?: string;
  businessUnit?: string;
  registrationType?: 'GENERAL' | 'BU_ONLY' | 'INVITE_ONLY' | 'RULE_BASED';
  allowedBusinessUnits?: string[];
  invitedUsers?: string[];
  ruleConfig?: {
    type: string;
    month?: number;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceEventSchema: Schema = new Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  category: { type: String, required: true },
  eventDate: { type: Date, required: true },
  eventTime: { type: String, required: true },
  location: { type: String, required: true },
  maxAttendees: { type: Number },
  registrationDeadline: { type: Date },
  registrationDeadlineTime: { type: String },
  businessUnit: { type: String },
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
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
}, {
  timestamps: true,
});

export default mongoose.models.AttendanceEvent || mongoose.model<IAttendanceEvent>('AttendanceEvent', AttendanceEventSchema);
