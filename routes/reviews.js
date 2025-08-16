const express = require('express');
const router = express.Router();
const Review = require('../models/Review');
const Order = require('../models/Order');
const Product = require('../models/Product');
const multer = require('multer');
const path = require('path');

// Multer setup for review images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../public/images/reviews'));
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    if (req.xhr) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/userlogin');
  }
  next();
};

// Get reviews for a product
router.get('/product/:productId', async (req, res) => {
  try {
    const { productId } = req.params;
    const { sort = 'newest' } = req.query;

    let sortQuery = {};
    switch(sort) {
      case 'helpful':
        sortQuery = { helpful: -1 };
        break;
      case 'highest':
        sortQuery = { rating: -1 };
        break;
      case 'lowest':
        sortQuery = { rating: 1 };
        break;
      default:
        sortQuery = { createdAt: -1 };
    }

    const reviews = await Review.find({ 
      productId,
      status: 'approved'
    })
    .populate('userId', 'name')
    .sort(sortQuery);

    // Calculate review statistics
    const stats = {
      total: reviews.length,
      average: reviews.reduce((acc, rev) => acc + rev.rating, 0) / reviews.length || 0,
      distribution: {
        5: reviews.filter(r => r.rating === 5).length,
        4: reviews.filter(r => r.rating === 4).length,
        3: reviews.filter(r => r.rating === 3).length,
        2: reviews.filter(r => r.rating === 2).length,
        1: reviews.filter(r => r.rating === 1).length
      }
    };

    res.json({ reviews, stats });
  } catch (err) {
    console.error('Error fetching reviews:', err);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

// Add a new review
router.post('/', requireAuth, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId, rating, comment, title, orderId } = req.body;

    // Verify that user has purchased the product
    const order = await Order.findOne({
      _id: orderId,
      userId,
      productId,
      status: 'delivered' // Only allow reviews for delivered products
    });

    if (!order) {
      return res.status(403).json({ 
        error: 'You can only review products you have purchased and received' 
      });
    }

    // Check if user has already reviewed this product
    const existingReview = await Review.findOne({ userId, productId });
    if (existingReview) {
      return res.status(400).json({ error: 'You have already reviewed this product' });
    }

    // Get product details to get designerId
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Create review
    const review = new Review({
      userId,
      productId,
      designerId: product.designerId,
      orderId,
      rating: Number(rating),
      comment,
      title,
      images: req.files ? req.files.map(file => '/images/reviews/' + file.filename) : [],
      verified: true
    });

    await review.save();

    res.status(201).json({ 
      message: 'Review added successfully',
      review
    });
  } catch (err) {
    console.error('Error adding review:', err);
    res.status(500).json({ error: 'Error adding review' });
  }
});

// Mark review as helpful
router.post('/:reviewId/helpful', requireAuth, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    review.helpful += 1;
    await review.save();

    res.json({ message: 'Marked as helpful', helpfulCount: review.helpful });
  } catch (err) {
    console.error('Error marking review as helpful:', err);
    res.status(500).json({ error: 'Error updating review' });
  }
});

// Get user's reviews
router.get('/user/reviews', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const reviews = await Review.find({ userId })
      .populate('productId', 'name image price')
      .sort({ createdAt: -1 });

    res.json({ reviews });
  } catch (err) {
    console.error('Error fetching user reviews:', err);
    res.status(500).json({ error: 'Error fetching reviews' });
  }
});

module.exports = router;
