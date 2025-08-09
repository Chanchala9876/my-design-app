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
const ChatMessage = require('./models/ChatMessage');
const CustomRequest = require('./models/CustomRequest');

// Connect to MongoDB
const { connectToMongoDB } = require('./models/db');
connectToMongoDB(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch(err => console.error("❌ MongoDB connection error:", err));

// Middleware
// Handle Razorpay webhook before body parsers
app.post('/payment/webhook', express.raw({ type: 'application/json' }), (req, res, next) => {
  req.rawBody = req.body;
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.use(session({
  secret: process.env.SESSION_SECRET || 'please_set_a_session_secret',
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
app.use('/payment', paymentRoutes);
app.use('/', userRoutes);

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

    if (!designerId) {
      return res.redirect('/designerlogin');
    }

    const designer = await Designer.findById(designerId);
    if (!designer) return res.status(404).send("Designer not found");

    const products = await Product.find({ designerId });
    res.render('designerDashboard', { designer, products });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send("Error loading dashboard");
  }
});


app.get('/stores/:categorySlug', async (req, res) => {
  const categorySlug = req.params.categorySlug;

  try {
    if (!categorySlug) {
      return res.status(400).render('designerStores', {
        category: 'Unknown',
        designers: [],
        error: 'Invalid category'
      });
    }

    // Convert slug to proper category name
    const categoryName = categorySlug
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');

    console.log('Looking for designers in category:', categoryName);

    // Find category first to verify it exists
    const category = await Category.findOne({ name: categoryName });

    if (!category) {
      console.log('Category not found:', categoryName);
      return res.status(404).render('designerStores', { 
        category: categoryName, 
        designers: [],
        error: 'Category not found'
      });
    }

    console.log('Found category:', category.name, 'with ID:', category._id);

    // Find designers with matching category ID
    const designers = await Designer.find({ category: category._id });
    console.log(`Found ${designers.length} designers for category ID:`, category._id);

    console.log(`Found ${designers.length} designers for category: ${categoryName}`);
    
    res.render('designerStores', { 
      category: category.name, // Use the proper case from the database
      designers,
      error: null
    });
  } catch (err) {
    console.error('Error loading designer stores:', err);
    // Use the categorySlug if available, otherwise use 'Unknown'
    const displayCategory = categorySlug ? categorySlug.replace(/-/g, ' ') : 'Unknown';
    res.status(500).render('designerStores', { 
      category: displayCategory, 
      designers: [],
      error: 'Error loading designers'
    });
  }
});

app.get('/store/:designerId', async (req, res) => {
  try {
    const { designerId } = req.params;
    
    // Validate designer ID format
    if (!mongoose.Types.ObjectId.isValid(designerId)) {
      return res.status(400).render('error', {
        error: 'Invalid store ID',
        message: 'The store ID provided is not valid'
      });
    }
    
    // Find the designer and their products
    const designer = await Designer.findById(designerId).populate('category');
    if (!designer) {
      return res.status(404).render('error', {
        error: 'Store not found',
        message: 'The store you are looking for does not exist'
      });
    }

    // Get all products by this designer
    const products = await Product.find({ designerId });
    
    console.log(`Found ${products.length} products for designer: ${designer.storeName}`);

    // Render the store view with designer and products data
    res.render('store', { 
      designer,
      products,
      userId: req.session.userId // Pass user ID to handle cart functionality
    });
  } catch(err) {
    console.error('Error loading store:', err);
    res.status(500).send('Error loading store');
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

// Socket.io setup
const server = require('http').createServer(app);
const io = require('socket.io')(server);

// Chat functionality
io.on('connection', (socket) => {
  console.log('A user connected to chat');

  socket.on('joinRoom', async ({ requestId }) => {
    socket.join(requestId);
    console.log(`User joined room: ${requestId}`);

    // Load previous messages
    try {
      const messages = await ChatMessage.find({ requestId })
        .sort({ createdAt: 1 })
        .limit(100);
      socket.emit('previousMessages', messages);
    } catch (err) {
      console.error('Error loading previous messages:', err);
    }
  });

  socket.on('chatMessage', async (data) => {
    try {
      const { requestId, sender, senderId, message } = data;
      
      // Save message to database
      const chatMessage = new ChatMessage({
        requestId,
        senderType: sender,
        senderId,
        message
      });
      await chatMessage.save();

      // Broadcast message to room
      io.to(requestId).emit('chatMessage', {
        ...chatMessage.toObject(),
        createdAt: new Date()
      });
    } catch (err) {
      console.error('Error saving chat message:', err);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

  socket.on('typing', (data) => {
    socket.to(data.requestId).emit('userTyping', {
      userId: data.userId,
      userName: data.userName
    });
  });

  socket.on('stopTyping', (data) => {
    socket.to(data.requestId).emit('userStoppedTyping', {
      userId: data.userId
    });
  });

  socket.on('leaveRoom', ({ requestId }) => {
    socket.leave(requestId);
    console.log(`User left room: ${requestId}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected from chat');
  });
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
