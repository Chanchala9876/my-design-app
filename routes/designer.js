const express = require('express');
const router = express.Router();
const BankDetail = require('../models/bankDetail');

const Designer = require('../models/Designer');
const Product = require('../models/Product');
const Order = require('../models/Order');
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

    // Get designer's products
    const products = await Product.find({ designerId });
    const productIds = products.map(p => p._id);

    // Build query
    const query = { productId: { $in: productIds } };
    if (statusFilter) {
      query.status = statusFilter;
    }

    const orders = await Order.find(query)
      .populate('productId')
      .populate('userId');

    res.render('designerOrders', { orders, selectedStatus: statusFilter || '' });
  } catch (err) {
    console.error('Error loading orders:', err);
    res.status(500).send('Error loading orders');
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

    const { name, description, price, quqntity } = req.body;
    const image = req.file ? '/images/' + req.file.filename : '';

    await Product.create({
      designerId,
      name,
      description,
      price,
      quqntity,
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

    res.render('designerCustomRequests', { customRequests });
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

module.exports = router;
