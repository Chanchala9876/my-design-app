const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer', required: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true }, // Reference to verify purchase
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, required: true },
  title: { type: String, required: true },
  images: [String], // Optional images for the review
  helpful: { type: Number, default: 0 }, // Number of users who found this review helpful
  verified: { type: Boolean, default: true }, // Will be true since we verify through orderId
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' }
});

module.exports = mongoose.model('Review', reviewSchema);
