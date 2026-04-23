import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  type: 'attendance' | 'announcement';
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema: Schema = new Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['attendance', 'announcement'], required: true },
  color: { type: String, default: '#ed1c24' },
}, {
  timestamps: true,
});

// Avoid multiple model compilation errors
export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
