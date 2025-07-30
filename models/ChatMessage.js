const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  requestId: { type: mongoose.Schema.Types.ObjectId, ref: 'CustomRequest', required: true },
  senderType: { type: String, enum: ['user', 'designer'], required: true },
  senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
  message: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatMessage', chatMessageSchema); 