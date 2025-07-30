const express = require('express');
const router = express.Router();
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const CustomRequest = require('../models/Customrequest');
const multer = require('multer');
const path = require('path');

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    // Check if it's an AJAX request
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/userlogin');
  }
  next();
};

// Add to cart
router.post('/cart/add', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.session.userId;

    // Check if product exists
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Check if product is in stock
    if (product.quantity < quantity) {
      return res.status(400).json({ error: 'Insufficient stock' });
    }

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product already in cart
    const existingItem = cart.items.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += parseInt(quantity);
    } else {
      cart.items.push({ productId, quantity: parseInt(quantity) });
    }

    await cart.save();
    res.json({ success: true, message: 'Product added to cart' });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// View cart
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.render('cart', { cartItems: [], total: 0 });
    }

    const cartItems = cart.items.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      total: item.productId.price * item.quantity
    }));

    const total = cartItems.reduce((sum, item) => sum + item.total, 0);
    
    res.render('cart', { cartItems, total });
  } catch (error) {
    console.error('View cart error:', error);
    res.status(500).send('Server error');
  }
});

// Update cart item quantity
router.put('/cart/update', requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.session.userId;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    const item = cart.items.find(item => item.productId.toString() === productId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found in cart' });
    }

    if (quantity <= 0) {
      cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    } else {
      item.quantity = quantity;
    }

    await cart.save();
    res.json({ success: true });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Remove item from cart
router.delete('/cart/remove/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.session.userId;

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ error: 'Cart not found' });
    }

    cart.items = cart.items.filter(item => item.productId.toString() !== productId);
    await cart.save();
    
    res.json({ success: true });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Checkout page
router.get('/checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId }).populate('items.productId');
    
    if (!cart || cart.items.length === 0) {
      return res.redirect('/cart');
    }

    const cartItems = cart.items.map(item => ({
      product: item.productId,
      quantity: item.quantity,
      total: item.productId.price * item.quantity
    }));

    const subtotal = cartItems.reduce((sum, item) => sum + item.total, 0);
    const shipping = subtotal > 500 ? 0 : 50; // Free shipping above ₹500
    const total = subtotal + shipping;
    
    res.render('checkout', { user, cartItems, subtotal, shipping, total });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).send('Server error');
  }
});

// Process checkout
router.post('/checkout/process', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { fullName, phone, address, city, state, pincode, paymentMethod, notes } = req.body;

    const cart = await Cart.findOne({ userId }).populate('items.productId');
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    // Create orders for each item
    const orders = [];
    for (const item of cart.items) {
      const product = item.productId;
      
      // Check stock
      if (product.quantity < item.quantity) {
        return res.status(400).json({ error: `Insufficient stock for ${product.name}` });
      }

      // Update product stock
      product.quantity -= item.quantity;
      await product.save();

      // Create order
      const order = new Order({
        userId,
        productId: product._id,
        designerId: product.designerId,
        quantity: item.quantity,
        totalPrice: product.price * item.quantity,
        shippingAddress: {
          fullName,
          phone,
          address,
          city,
          state,
          pincode
        },
        paymentMethod,
        notes,
        paymentStatus: paymentMethod === 'cod' ? 'pending' : 'pending'
      });

      await order.save();
      orders.push(order);
    }

    // Clear cart
    await Cart.findOneAndDelete({ userId });

    // For now, redirect to success page
    // In a real app, you'd integrate with a payment gateway here
    res.redirect('/orders/success');
  } catch (error) {
    console.error('Process checkout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Order success page
router.get('/orders/success', requireAuth, (req, res) => {
  res.render('paymentSuccess', {
    orderId: req.query.orderId || 'N/A',
    paymentId: req.query.paymentId || 'N/A'
  });
});

// POST route for user custom request submission
router.post('/custom-request', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const userId = req.session.userId;
    const { designerId, description, budget, deadline, size, address } = req.body;
    if (!address) return res.status(400).send('Address is required');
    const image = req.file ? '/images/' + req.file.filename : '';

    await CustomRequest.create({
      userId,
      designerId,
      description,
      budget,
      deadline,
      image,
      size,
      address
    });

    res.redirect('/store/' + designerId);
  } catch (err) {
    console.error('Custom request submission error:', err);
    res.status(500).send('Error submitting custom request');
  }
});

// POST route for user to accept/reject designer's price
router.post('/custom-request/:id/user-action', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id } = req.params;
    const { action } = req.body;
    const customRequest = await CustomRequest.findById(id);
    if (!customRequest || customRequest.userId.toString() !== userId) {
      return res.status(403).send('Access denied');
    }
    if (customRequest.status !== 'accepted' || customRequest.userAccepted) {
      return res.status(400).send('Action not allowed');
    }
    if (action === 'accept') {
      customRequest.userAccepted = true;
      await customRequest.save();
    } else if (action === 'reject') {
      customRequest.status = 'pending';
      customRequest.designerPrice = undefined;
      customRequest.userAccepted = false;
      await customRequest.save();
    } else {
      return res.status(400).send('Invalid action');
    }
    res.redirect('/dashboard');
  } catch (err) {
    console.error('User action on custom request error:', err);
    res.status(500).send('Error processing action');
  }
});

// User Dashboard
router.get('/dashboard', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const user = await User.findById(userId);
    
    // Get user's orders
    const allOrders = await Order.find({ userId })
      .populate('productId')
      .populate('designerId')
      .sort({ orderedAt: -1 });

    // Calculate statistics
    const stats = {
      totalOrders: allOrders.length,
      pendingOrders: allOrders.filter(order => order.status === 'pending').length,
      deliveredOrders: allOrders.filter(order => order.status === 'delivered').length,
      totalSpent: allOrders.reduce((sum, order) => sum + order.totalPrice, 0)
    };

    // Get recent orders (last 5)
    const recentOrders = allOrders.slice(0, 5);

    // Get user's custom requests
    const customRequests = await CustomRequest.find({ userId }).populate('designerId');

    res.render('userDashboard', { user, stats, recentOrders, customRequests });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).send('Server error');
  }
});

// View user orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const statusFilter = req.query.status;

    // Build query
    const query = { userId };
    if (statusFilter) {
      query.status = statusFilter;
    }

    const orders = await Order.find(query)
      .populate('productId')
      .populate('designerId')
      .sort({ orderedAt: -1 });

    res.render('userOrders', { 
      orders, 
      selectedStatus: statusFilter || '' 
    });
  } catch (error) {
    console.error('View orders error:', error);
    res.status(500).send('Server error');
  }
});

module.exports = router; 