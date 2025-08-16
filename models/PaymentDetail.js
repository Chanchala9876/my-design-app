const mongoose = require('mongoose');

const paymentDetailSchema = new mongoose.Schema({
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  razorpayPaymentId: { type: String, required: true, unique: true },
  razorpayOrderId: { type: String, required: true, unique: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { 
    type: String, 
    enum: ['created', 'authorized', 'captured', 'refunded', 'failed'],
    required: true 
  },
  method: { type: String, required: true }, // UPI, card, netbanking etc.
  refundStatus: {
    type: String,
    enum: ['none', 'pending', 'processed', 'failed'],
    default: 'none'
  },
  refundAmount: { type: Number },
  refundId: { type: String },
  metadata: { type: Object }, // For storing additional payment-related data
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date }
});

// Update timestamp on save
paymentDetailSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('PaymentDetail', paymentDetailSchema);
