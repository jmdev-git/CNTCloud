import mongoose, { Schema, Document } from 'mongoose';

export interface IAttendanceEventCategory extends Document {
  name: string;
  displayName: string;
  description: string;
  color: string;
  icon?: string;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceEventCategorySchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  description: { type: String, required: true },
  color: { type: String, required: true },
  icon: { type: String, default: 'calendar' },
  isActive: { type: Boolean, default: true },
  createdBy: { type: String, required: true },
}, {
  timestamps: true,
});

export default mongoose.models.AttendanceEventCategory || mongoose.model<IAttendanceEventCategory>('AttendanceEventCategory', AttendanceEventCategorySchema);
