require('dotenv').config();
console.log('MONGO_URI from .env:', process.env.MONGO_URI);

const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

// DB Models
const Designer = require('./models/Designer');
const Category = require('./models/Category');
const Product = require('./models/Product');
const ChatMessage = require('./models/ChatMessage');

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
const userRoutes = require('./routes/user');
const paymentRoutes = require('./routes/payment');

// Use Routes
app.use('/designer', designerRoutes);
app.use('/api', authRoutes);
app.use('/', userRoutes);
app.use('/payment', paymentRoutes);

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
    console.log('Category slug:', categorySlug);
    
    const categoryName = categorySlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    console.log('Category name:', categoryName);
    
    const category = await Category.findOne({ name: categoryName });
    console.log('Found category:', category);
    
    if (!category) {
      return res.status(404).send('Category not found');
    }
    
    const designers = await Designer.find({ category: category._id });
    console.log('Found designers:', designers.length);
    
    res.render('designerStores', { category: category.name, designers });
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

// Test payment page
app.get('/test-payment', (req, res) => {
  res.render('testPayment');
});

// Individual store page showing all products for a specific designer
app.get('/store/:designerId', async (req, res) => {
  try {
    const designerId = req.params.designerId;
    const designer = await Designer.findById(designerId);
    
    if (!designer) {
      return res.status(404).send('Designer not found');
    }
    
    const products = await Product.find({ designerId });
    res.render('store', { designer, products });
  } catch (err) {
    console.error('Error loading store:', err);
    res.status(500).send('Error loading store');
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinRoom', async ({ requestId }) => {
    if (requestId) {
      socket.join(requestId);
      console.log(`Socket ${socket.id} joined room ${requestId}`);
      // Send previous messages
      const messages = await ChatMessage.find({ requestId }).sort({ createdAt: 1 });
      socket.emit('previousMessages', messages);
    }
  });

  socket.on('leaveRoom', ({ requestId }) => {
    if (requestId) {
      socket.leave(requestId);
      console.log(`Socket ${socket.id} left room ${requestId}`);
    }
  });

  socket.on('chatMessage', async (data) => {
    // data: { requestId, sender, message }
    if (data.requestId && data.message && data.sender && data.senderId) {
      // Save to DB
      const chatMsg = new ChatMessage({
        requestId: data.requestId,
        senderType: data.sender,
        senderId: data.senderId,
        message: data.message
      });
      await chatMsg.save();
      io.to(data.requestId).emit('chatMessage', {
        requestId: data.requestId,
        sender: data.sender,
        senderId: data.senderId,
        message: data.message,
        createdAt: chatMsg.createdAt
      });
      console.log(`Message to room ${data.requestId}:`, data.message);
    }
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
