const express = require('express');
const router = express.Router();
const paymentConfig = require('../config/payment');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Middleware to check if user is logged in
const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    return res.redirect('/userlogin');
  }
  next();
};

// Create payment order
router.post('/create-order', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    console.log('Creating order for user:', userId);
    const { amount, orderId } = req.body;
    
    console.log('Order request:', { amount, orderId });

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create Razorpay order
    const paymentOrder = await paymentConfig.createPaymentOrder(
      amount,
      'INR',
      `order_${orderId}_${Date.now()}`
    );

    res.json({
      success: true,
      order_id: paymentOrder.id,
      amount: paymentOrder.amount,
      currency: paymentOrder.currency
    });
  } catch (error) {
    console.error('Error creating payment order:', error);
    res.status(500).json({ error: 'Failed to create payment order' });
  }
});

// Verify payment and process order
router.post('/verify-payment', requireAuth, async (req, res) => {
  try {
    const userId = req.session.userId;
    const { 
      razorpay_payment_id, 
      razorpay_order_id, 
      razorpay_signature,
      orderData 
    } = req.body;

    // Verify payment signature
    const isValid = paymentConfig.verifyPayment(
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature
    );

    if (!isValid) {
      return res.status(400).json({ error: 'Invalid payment signature' });
    }

    // Get payment details from Razorpay
    const paymentDetails = await paymentConfig.getPaymentDetails(razorpay_payment_id);

    // Check if payment was successful
    if (paymentDetails.status !== 'captured') {
      return res.status(400).json({ error: 'Payment not completed' });
    }

    // Process the order
    const { fullName, phone, address, city, state, pincode, notes } = orderData;

    // Get user's cart
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
        paymentMethod: 'online',
        paymentStatus: 'completed',
        notes,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id
      });

      // Save the order first to get the orderId
      await order.save();

      // Create payment details
      const paymentDetail = new PaymentDetail({
        orderId: order._id,
        userId,
        razorpayPaymentId: razorpay_payment_id,
        razorpayOrderId: razorpay_order_id,
        amount: product.price * item.quantity,
        currency: 'INR',
        status: 'captured',
        method: req.body.paymentMethod || 'card',
        metadata: {
          productId: product._id,
          productName: product.name,
          designerId: product.designerId
        }
      });

      await paymentDetail.save();

      await order.save();
      orders.push(order);
    }

    // Clear cart
    await Cart.findOneAndDelete({ userId });

    res.json({
      success: true,
      message: 'Payment successful and order placed',
      orders: orders.map(order => order._id)
    });

  } catch (error) {
    console.error('Error verifying payment:', error);
    res.status(500).json({ error: 'Failed to verify payment' });
  }
});

// Payment webhook (for production)
router.post('/webhook', async (req, res) => {
  try {
    const crypto = require('crypto');
    const signature = req.headers['x-razorpay-signature'];
    
    // Verify webhook signature using rawBody
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(JSON.stringify(req.rawBody))
      .digest('hex');

    if (signature !== expectedSignature) {
      return res.status(400).send('Invalid signature');
    }

    const event = req.body;

    // Handle different webhook events
    switch (event.event) {
      case 'payment.captured':
        console.log('Payment captured:', event.payload.payment.entity.id);
        // Update order status if needed
        break;
      
      case 'payment.failed':
        console.log('Payment failed:', event.payload.payment.entity.id);
        // Handle failed payment
        break;
      
      default:
        console.log('Unhandled webhook event:', event.event);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).send('Webhook error');
  }
});

// Get payment status
router.get('/status/:paymentId', requireAuth, async (req, res) => {
  try {
    const { paymentId } = req.params;
    const paymentDetails = await paymentConfig.getPaymentDetails(paymentId);
    
    res.json({
      success: true,
      payment: paymentDetails
    });
  } catch (error) {
    console.error('Error getting payment status:', error);
    res.status(500).json({ error: 'Failed to get payment status' });
  }
});

module.exports = router; 