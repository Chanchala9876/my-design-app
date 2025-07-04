const mongoose = require('mongoose');

const bankDetailSchema = new mongoose.Schema({
  designerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Designer',
    required: true,
    unique: true  // One bank detail per designer
  },
  accountHolderName: { type: String, required: true },
  accountNumber: { type: String, required: true },
  ifscCode: { type: String, required: true },
  bankName: { type: String, required: true },
  upiId: { type: String } // optional
}, {
  timestamps: true
});

module.exports = mongoose.model('BankDetail', bankDetailSchema);
