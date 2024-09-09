import mongoose from 'mongoose';

const choreSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true
  },
  done: {
    type: Boolean,
    default: false
  },
  user: {
    type: String,
    default: null
  },
  frequency: {
    type: String,
    enum: ['weekly', 'monthly', 'yearly'],  // Limit to valid values
    required: true
  }
});

const Chore = mongoose.model('Chore', choreSchema);

export default Chore;
