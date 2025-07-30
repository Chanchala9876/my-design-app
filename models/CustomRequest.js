const mongoose = require('mongoose');

const customRequestSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer', required: true },
  description: { type: String, required: true },
  budget: Number,
  deadline: Date,
  image: String, // Optional image attachment
  size: { type: String }, // Added size/measurement field
  address: { type: String, required: true }, // Delivery address
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed'],
    default: 'pending'
  },
  designerPrice: { type: Number }, // Price quoted by designer
  userAccepted: { type: Boolean, default: false }, // Whether user accepted designer's price
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('CustomRequest', customRequestSchema);
