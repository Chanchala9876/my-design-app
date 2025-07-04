const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // 🔧 You were using bcrypt in your pre-save, so import it!

const designerSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  storeName: { type: String, required: true },
  
  // 👉 Change here: store category as an ObjectId reference
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  
  bio: String,
  profilePic: String,
  createdAt: { type: Date, default: Date.now }
});

// 🔐 Hash password before saving
designerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

// 🔐 Compare password method
designerSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('Designer', designerSchema);
