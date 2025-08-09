const express = require('express');
const router = express.Router();
const BankDetail = require('../models/bankDetail');
const Designer = require('../models/Designer');
const Order = require('../models/Order');
const Product = require('../models/Product');
const CustomRequest = require('../models/CustomRequest');
const multer = require('multer');
const path = require('path');

// Multer setup for file uploads
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
      .populate('userId');

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

// PUT route to update order status
router.put('/orders/:orderId/status', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { orderId } = req.params;
    const { status } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Optionally, check if the order belongs to this designer
    order.status = status;
    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Order status update error:', err);
    res.status(500).json({ success: false, message: 'Error updating order status' });
  }
});

// PUT route to update tracking number
router.put('/orders/:orderId/tracking', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    const { orderId } = req.params;
    const { trackingNumber } = req.body;
    const order = await Order.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    // Optionally, check if the order belongs to this designer
    order.trackingNumber = trackingNumber;
    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error('Tracking number update error:', err);
    res.status(500).json({ success: false, message: 'Error updating tracking number' });
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

// Upload Product Page
router.get('/upload-product', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');
    const designer = await Designer.findById(designerId);
    // You may want to fetch categories if needed
    res.render('designerUploadProduct', { designer });
  } catch (err) {
    console.error('Upload Product Error:', err);
    res.status(500).send('Error loading upload product page');
  }
});

// Custom Requests Page
router.get('/custom-requests', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');
    const customRequests = await CustomRequest.find({ designerId }).populate('userId');
    const designer = await Designer.findById(designerId);
    res.render('designerCustomRequests', { customRequests, designer });
  } catch (err) {
    console.error('Error loading custom requests:', err);
    res.status(500).send('Error loading custom requests');
  }
});

// Chat Page
router.get('/chat/:requestId', async (req, res) => {
  try {
    const designerId = req.session.designerId;
    if (!designerId) return res.redirect('/designer/login');

    const requestId = req.params.requestId;
    const customRequest = await CustomRequest.findById(requestId)
      .populate('userId', 'name email')
      .populate('designerId', 'name email');

    if (!customRequest) {
      return res.status(404).render('error', {
        error: 'Request not found',
        message: 'The custom request you are trying to chat about does not exist'
      });
    }

    // Ensure the designer has access to this chat
    if (customRequest.designerId._id.toString() !== designerId) {
      return res.status(403).render('error', {
        error: 'Access denied',
        message: 'You do not have permission to access this chat'
      });
    }

    // Format the data for the chat view
    const chatData = {
      customRequest: {
        _id: customRequest._id,
        description: customRequest.description,
        status: customRequest.status,
        budget: customRequest.budget,
        deadline: customRequest.deadline,
        designerPrice: customRequest.designerPrice,
        userDetails: {
          name: customRequest.userId.name,
          email: customRequest.userId.email
        },
        designerDetails: {
          name: customRequest.designerId.name,
          email: customRequest.designerId.email
        }
      },
      isUser: false,
      designerId
    };

    res.render('chat', chatData);
  } catch (err) {
    console.error('Error loading chat:', err);
    res.status(500).render('error', {
      error: 'Error loading chat',
      message: 'There was a problem loading the chat. Please try again.'
    });
  }
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
      customRequest.userAccepted = false;
    }
    await customRequest.save();
    res.redirect('/designer/custom-requests');
  } catch (err) {
    console.error('Custom request status update error:', err);
    res.status(500).send('Error updating status');
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

module.exports = router;
