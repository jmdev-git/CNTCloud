import mongoose, { Schema, Document } from 'mongoose';

export interface ICompanyEmail extends Document {
  email: string;
  name: string;
  businessUnit?: string;
  birthdate?: Date;
}

const CompanyEmailSchema: Schema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    businessUnit: { type: String, required: false, trim: true },
    birthdate: { type: Date, required: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.CompanyEmail || mongoose.model<ICompanyEmail>('CompanyEmail', CompanyEmailSchema);
