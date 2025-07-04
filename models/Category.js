const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
  category_id: { type: Number, unique: true, required: true },
  name: { type: String, unique: true, required: true },
  image: { type: String, required: true } 
});

module.exports = mongoose.model('Category', categorySchema);
