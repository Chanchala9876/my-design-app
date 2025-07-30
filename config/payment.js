const Razorpay = require('razorpay');

// Initialize Razorpay instance lazily
let razorpay = null;

function getRazorpayInstance() {
  if (!razorpay) {
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      throw new Error('Razorpay API keys not configured. Please set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your .env file');
    }
    
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
}

module.exports = {
  getRazorpayInstance,
  
  // Create payment order
  createPaymentOrder: async (amount, currency = 'INR', receipt = null) => {
    try {
      const rzp = getRazorpayInstance();
      const options = {
        amount: amount * 100, // Razorpay expects amount in paise
        currency: currency,
        receipt: receipt || `receipt_${Date.now()}`,
        payment_capture: 1, // Auto capture payment
      };

      const order = await rzp.orders.create(options);
      return order;
    } catch (error) {
      console.error('Error creating payment order:', error);
      throw error;
    }
  },

  // Verify payment signature
  verifyPayment: (paymentId, orderId, signature) => {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(orderId + '|' + paymentId)
      .digest('hex');

    return expectedSignature === signature;
  },

  // Get payment details
  getPaymentDetails: async (paymentId) => {
    try {
      const rzp = getRazorpayInstance();
      const payment = await rzp.payments.fetch(paymentId);
      return payment;
    } catch (error) {
      console.error('Error fetching payment details:', error);
      throw error;
    }
  }
}; 