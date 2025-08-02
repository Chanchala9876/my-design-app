const express = require('express');
const router = express.Router();
const BankDetail = require('../models/bankDetail');
const Designer = require('../models/Designer');
const Order = require('../models/Order');
const Product = require('../models/Product');

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
