const express = require('express');
const router = express.Router();
const BankDetail = require('../models/bankDetail');

const Designer = require('../models/Designer');
const Product = require('../models/Product');
const Order = require('../models/Order');
const CustomRequest=require('../models/Customrequest');

const multer = require('multer');
const path = require('path');


// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Show Bank Detail Form
router.get('/bank', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const bank = await BankDetail.findOne({ designerId });
    res.render('designerBankForm', { bank });
  } catch (err) {
    console.error('Bank form load error:', err);
    res.status(500).send('Server error');
  }
});

// Submit or Update Bank Details
router.post('/bank', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    const { accountHolderName, accountNumber, ifscCode, bankName, upiId } = req.body;

    const existing = await BankDetail.findOne({ designerId });
    if (existing) {
      Object.assign(existing, { accountHolderName, accountNumber, ifscCode, bankName, upiId });
      await existing.save();
    } else {
      await BankDetail.create({ designerId, accountHolderName, accountNumber, ifscCode, bankName, upiId });
    }

    res.redirect('/designer/dashboard');
  } catch (err) {
    console.error('Bank form submit error:', err);
    res.status(500).send('Failed to save bank details');
  }
});

// Show Orders Received page
router.get('/orders', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const statusFilter = req.query.status;
    const paymentStatusFilter = req.query.paymentStatus;

    // Get designer's products
    const products = await Product.find({ designerId });
    const productIds = products.map(p => p._id);

    // Build query
    const query = { productId: { $in: productIds } };
    if (statusFilter) {
      query.status = statusFilter;
    }
    if (paymentStatusFilter) {
      query.paymentStatus = paymentStatusFilter;
    }

    const orders = await Order.find(query)
      .populate('productId')
      .populate('userId')
      .sort({ orderedAt: -1 });

    res.render('designerOrders', { 
      orders, 
      selectedStatus: statusFilter || '',
      selectedPaymentStatus: paymentStatusFilter || ''
    });
  } catch (err) {
    console.error('Error loading orders:', err);
    res.status(500).send('Error loading orders');
  }
});

// Update order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const designerId = req.session.designerId;

    if (!designerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify the order belongs to this designer
    const product = await Product.findById(order.productId);
    if (!product || product.designerId.toString() !== designerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    order.status = status;
    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update tracking number
router.put('/orders/:orderId/tracking', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { trackingNumber } = req.body;
    const designerId = req.session.designerId;

    if (!designerId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Verify the order belongs to this designer
    const product = await Product.findById(order.productId);
    if (!product || product.designerId.toString() !== designerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    order.trackingNumber = trackingNumber;
    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Update tracking number error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET route to render the upload product form
router.get('/upload-product', (req, res) => {
  if (!req.session.designerId) return res.redirect('/designer/login');
  res.render('designerUploadProduct');
});

// POST route to handle product upload
router.post('/upload-product', upload.single('image'), async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const { name, description, price, quantity } = req.body;
    const image = req.file ? '/images/' + req.file.filename : '';

    await Product.create({
      designerId,
      name,
      description,
      price,
      quantity,
      image
    });

    res.redirect('/designer/dashboard');
  } catch (err) {
    console.error('Product upload error:', err);
    res.status(500).send('Error uploading product');
  }
});

// GET route to show all custom requests for the designer
router.get('/custom-requests', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const customRequests = await CustomRequest.find({ designerId })
      .populate('userId');
    const designer = await Designer.findById(designerId); // Fetch designer object
    res.render('designerCustomRequests', { customRequests, designer });
  } catch (err) {
    console.error('Error loading custom requests:', err);
    res.status(500).send('Error loading custom requests');
  }
});

// POST route to handle new custom request submission
router.post('/custom-requests', upload.single('image'), async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const { description, budget, deadline } = req.body;
    const image = req.file ? '/images/' + req.file.filename : '';

    // For demo, userId is not set (should be set by the user making the request)
    // Here, you may want to get userId from session or another source
    const userId = req.session.userId || null;

    await CustomRequest.create({
      userId,
      designerId,
      description,
      budget,
      deadline,
      image
    });

    res.redirect('/designer/custom-requests');
  } catch (err) {
    console.error('Custom request submission error:', err);
    res.status(500).send('Error submitting custom request');
  }
});

// POST route to update custom request status
router.post('/custom-requests/:id/status', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');
    const { id } = req.params;
    const { status, designerPrice } = req.body;
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed'];
    if (!validStatuses.includes(status)) return res.status(400).send('Invalid status');

    const customRequest = await CustomRequest.findById(id);
    if (!customRequest || customRequest.designerId.toString() !== designerId) {
      return res.status(403).send('Access denied');
    }
    customRequest.status = status;
    if (status === 'accepted') {
      if (!designerPrice) return res.status(400).send('Designer price required');
      customRequest.designerPrice = designerPrice;
      customRequest.userAccepted = false; // reset user acceptance if re-accepting
    }
    await customRequest.save();
    res.redirect('/designer/custom-requests');
  } catch (err) {
    console.error('Custom request status update error:', err);
    res.status(500).send('Error updating status');
  }
});
// Designer Dashboard
router.get('/dashboard', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const designer = await Designer.findById(designerId);
    const products = await Product.find({ designerId });
    
    res.render('designerDashboard', { designer, products });
  } catch (err) {
    console.error('Dashboard Error:', err);
    res.status(500).send('Error loading dashboard');
  }
});

module.exports = router;
