# 🏦 Razorpay Payment Integration Setup Guide

## 📋 Prerequisites
- Node.js and npm installed
- MongoDB running
- Razorpay account (free to create)

## 🚀 Setup Steps

### 1. Create Razorpay Account
1. Go to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Sign up for a free account
3. Complete KYC verification (required for live payments)

### 2. Get API Keys
1. **For Testing:**
   - Use test keys from Razorpay dashboard
   - Test cards: 4111 1111 1111 1111
   - Test UPI: success@razorpay

2. **For Production:**
   - Switch to live mode in dashboard
   - Get live API keys

### 3. Environment Configuration
1. Copy `env.example` to `.env`
2. Update the following variables:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# For Production
# RAZORPAY_KEY_ID=rzp_live_YOUR_LIVE_KEY_ID
# RAZORPAY_KEY_SECRET=YOUR_LIVE_KEY_SECRET
```

### 4. Install Dependencies
```bash
npm install razorpay dotenv
```

### 5. Test the Integration
1. Start your server: `npm start`
2. Add items to cart
3. Proceed to checkout
4. Test with Razorpay test credentials

## 🔧 Payment Flow

### How it Works:
1. **User clicks "Proceed to Payment"**
   - Form validation
   - Creates Razorpay order
   - Opens payment modal

2. **Payment Modal Opens**
   - User sees UPI, cards, net banking options
   - Can enter UPI ID or use other methods
   - Payment processed by Razorpay

3. **Payment Verification**
   - Server verifies payment signature
   - Creates orders in database
   - Clears user's cart
   - Redirects to success page

4. **Success Page**
   - Shows payment confirmation
   - Displays order details
   - Auto-redirects to dashboard

## 🧪 Testing

### Test Cards:
- **Success:** 4111 1111 1111 1111
- **Failure:** 4000 0000 0000 0002
- **Expired:** 4000 0000 0000 0069

### Test UPI:
- **Success:** success@razorpay
- **Failure:** failure@razorpay

### Test Net Banking:
- Use any bank from the list

## 🔒 Security Features

1. **Payment Signature Verification**
   - Server verifies every payment
   - Prevents tampering

2. **Environment Variables**
   - API keys stored securely
   - Different keys for test/production

3. **Webhook Support**
   - Real-time payment updates
   - Automatic order status updates

## 📱 UPI Payment Flow

### For Users:
1. Enter UPI ID (e.g., user@upi)
2. Click "Pay"
3. Receive notification in UPI app
4. Approve payment
5. Payment completed

### For Merchants:
1. Payment received instantly
2. Order automatically created
3. Stock updated
4. Email confirmation sent

## 🚨 Troubleshooting

### Common Issues:
1. **"Invalid API Key"**
   - Check environment variables
   - Ensure keys are correct

2. **"Payment Failed"**
   - Check Razorpay dashboard
   - Verify webhook configuration

3. **"Order Not Created"**
   - Check MongoDB connection
   - Verify order creation logic

### Support:
- Razorpay Support: support@razorpay.com
- Documentation: https://razorpay.com/docs/

## 💰 Pricing

### Razorpay Fees:
- **Cards:** 2% + GST
- **UPI:** 2% + GST
- **Net Banking:** 2% + GST
- **Wallets:** 2% + GST

### Free Tier:
- No setup fees
- No monthly charges
- Pay only for transactions

## 🔄 Production Deployment

1. **Switch to Live Keys**
   - Update environment variables
   - Use live API keys

2. **Configure Webhooks**
   - Set webhook URL in Razorpay dashboard
   - Test webhook delivery

3. **SSL Certificate**
   - Required for production
   - HTTPS mandatory

4. **Monitor Transactions**
   - Use Razorpay dashboard
   - Set up alerts

## 📊 Analytics

### Available in Razorpay Dashboard:
- Transaction success rate
- Payment method distribution
- Revenue analytics
- Customer insights

---

**🎉 Your payment integration is now ready!** 