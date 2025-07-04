// updateCategories.js
const mongoose = require('mongoose');
const Category = require('./models/Category'); // adjust path if needed

mongoose.connect('mongodb://localhost:27017/designhub', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(async () => {
    const updates = [
      { category_id: 1, image: "/categories/footware.jpg" },
      { category_id: 2, image: "/categories/dress.jpg" },
      { category_id: 3, image: "/categories/sarees.jpg" },
      { category_id: 4, image: "/categories/bags.jpg" },
      { category_id: 5, image: "/categories/home-decor.jpg" },
      { category_id: 6, image: "/categories/electronics.jpg" },
      { category_id: 7, image: "/categories/kitchen-stuff.jpg" }
    ];

    for (const item of updates) {
      await Category.updateOne(
        { category_id: item.category_id },
        { $set: { image: item.image } }
      );
    }

    console.log("✅ Category images updated.");
    mongoose.disconnect();
  })
  .catch(err => {
    console.error("❌ Error connecting or updating:", err);
  });
