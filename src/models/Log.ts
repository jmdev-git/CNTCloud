import mongoose from 'mongoose';

const LogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  targetTitle: {
    type: String,
    required: true,
  },
  targetId: {
    type: String,
    required: true,
  },
  performedBy: {
    type: String,
    required: true,
  },
  adminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
});

// Force refresh the model if it exists to avoid strictPopulate issues
if (mongoose.models.Log) {
  delete mongoose.models.Log;
}

export default mongoose.model('Log', LogSchema);
