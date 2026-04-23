import mongoose, { Schema, Document } from 'mongoose';

export interface IEventAttendance extends Document {
  announcementId: mongoose.Types.ObjectId;
  employeeEmail: string;
  employeeName: string;
  registeredAt: Date;
  attendedAt?: Date;
  isPresent: boolean;
  qrCodeData?: string;
}

const EventAttendanceSchema: Schema = new Schema({
  announcementId: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
  employeeEmail: { type: String, required: true },
  employeeName: { type: String, required: true },
  registeredAt: { type: Date, default: Date.now },
  attendedAt: { type: Date },
  isPresent: { type: Boolean, default: false },
  qrCodeData: { type: String }, // This will store the unique data encoded in the QR code
}, {
  timestamps: true,
});

// Ensure a user can only register once per event
EventAttendanceSchema.index({ announcementId: 1, employeeEmail: 1 }, { unique: true });

export default mongoose.models.EventAttendance || mongoose.model<IEventAttendance>('EventAttendance', EventAttendanceSchema);
