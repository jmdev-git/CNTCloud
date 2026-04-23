import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceRegistration extends Document {
  eventId: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  userEmail: string;
  qrCodeData: string;
  registeredAt: Date;
  attended: boolean;
  attendedAt?: Date;
}

const AttendanceRegistrationSchema: Schema = new Schema({
  eventId: { type: Schema.Types.ObjectId, ref: 'AttendanceEvent', required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userEmail: { type: String, required: true },
  qrCodeData: { type: String, required: true, unique: true },
  registeredAt: { type: Date, default: Date.now },
  attended: { type: Boolean, default: false },
  attendedAt: { type: Date },
}, {
  timestamps: true,
});

// Ensure a user can only register once per event
AttendanceRegistrationSchema.index({ eventId: 1, userEmail: 1 }, { unique: true });

export default mongoose.models.AttendanceRegistration || mongoose.model<IAttendanceRegistration>('AttendanceRegistration', AttendanceRegistrationSchema);
