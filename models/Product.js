const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  designerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Designer', required: true },
  name: { type: String, required: true },
  description: String,
  price: { type: Number, required: true },
  quqntity:{type:Number, required:true},
  image: String,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
