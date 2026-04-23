import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  username: string;
  name?: string;
  password?: string;
  role: 'admin';
  allowedCategories?: string[];
  canManageUsers?: boolean;
  businessUnits?: string[];
  isScannerOnly?: boolean;
  scannerRegTypes?: string[];
}

const UserSchema: Schema = new Schema({
  username: { type: String, required: true, unique: true },
  name: { type: String, required: false },
  password: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ['admin'], default: 'admin' },
  allowedCategories: { type: [String], required: false },
  canManageUsers: { type: Boolean, required: false, default: false },
  businessUnits: { type: [String], required: false },
  isScannerOnly: { type: Boolean, required: false, default: false },
  scannerRegTypes: { type: [String], required: false },
}, { timestamps: true });

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
