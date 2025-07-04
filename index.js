require('dotenv').config();
console.log('MONGO_URI from .env:', process.env.MONGO_URI);

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();

// DB Models
const Designer = require('./models/Designer');
const Category = require('./models/Category');
const Product = require('./models/Product');

// Connect to MongoDB
const { connectToMongoDB } = require('./models/db');
connectToMongoDB(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: false
}));

app.set('view engine', 'ejs');

// Route Imports (after app is defined!)
const designerRoutes = require('./routes/designer');
const authRoutes = require('./routes/auth');

// Use Routes
app.use('/designer', designerRoutes);
app.use('/api', authRoutes);

// Routes
app.get("/", (req, res) => res.render('home'));
app.get('/usersignup', (req, res) => res.render('userSignup'));
app.get('/userlogin', (req, res) => res.render('userLogin'));
app.get('/designerlogin', (req, res) => res.render('designerLogin'));

app.get('/designersignup', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render('designerSignup', { categories });
  } catch (err) {
    console.error('Error loading categories:', err);
    res.status(500).send('Error loading categories');
  }
});

app.get('/designerdashboard', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    const designer = await Designer.findById(designerId);
    const products = await Product.find({ designerId });
    res.render('designerDashboard', { designer, products });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send("Error loading dashboard");
  }
});

app.get('/stores/:categorySlug', async (req, res) => {
  try {
    const categorySlug = req.params.categorySlug;
    const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    const designers = await Designer.find({ category: categoryName });
    res.render('designerStores', { category: categoryName, designers });
  } catch (err) {
    console.error('Error loading designer stores:', err);
    res.status(500).send('Error loading designers');
  }
});

app.get('/content', async (req, res) => {
  try {
    const categories = await Category.find({});
    res.render('content', { categories });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error loading categories.");
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
