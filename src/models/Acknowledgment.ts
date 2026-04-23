import mongoose, { Schema, Document } from 'mongoose';

export interface IAcknowledgment extends Document {
  memo_id: string;
  memo_title: string;
  memo_link?: string;
  employee_email: string;
  employee_name: string;
  acknowledged_at: Date;
}

const AcknowledgmentSchema: Schema = new Schema({
  memo_id: { type: String, required: true },
  memo_title: { type: String, required: true },
  memo_link: { type: String },
  employee_email: { type: String, required: true },
  employee_name: { type: String, required: true },
  acknowledged_at: { type: Date, default: Date.now },
});

// Compound index to ensure one acknowledgment per memo per email
AcknowledgmentSchema.index({ memo_id: 1, employee_email: 1 }, { unique: true });

export default mongoose.models.Acknowledgment || mongoose.model<IAcknowledgment>('Acknowledgment', AcknowledgmentSchema);
