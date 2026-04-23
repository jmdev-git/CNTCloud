import mongoose from 'mongoose';

const businessUnitSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a business unit name'],
    unique: true,
    trim: true,
  },
  label: {
    type: String,
    required: [true, 'Please provide a label (prefix)'],
    unique: true,
    trim: true,
  },
  color: {
    type: String,
    default: '#ed1c24',
  },
  image: {
    type: String,
    default: '/CNT_PROMO_ADS_SPECIALISTS.png',
  },
}, {
  timestamps: true,
});

export default mongoose.models.BusinessUnit || mongoose.model('BusinessUnit', businessUnitSchema);
