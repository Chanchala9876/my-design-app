const mongoose = require('mongoose');

const customRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer', required: true },
  description: { type: String, required: true },
  budget: Number,
  deadline: Date,
  image: String, // Optional image attachment
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomRequest', customRequestSchema);
