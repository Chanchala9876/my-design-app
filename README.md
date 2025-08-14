# DesignHub - Student Designer Marketplace

DesignHub is a comprehensive e-commerce platform that connects student designers with customers, enabling them to showcase and sell their designs across various categories. The platform features real-time chat, custom design requests, secure payments, and a user-friendly interface for both designers and customers.

## 🌟 Features

### For Customers
- **Browse by Categories**: Explore designs across multiple categories like clothing, accessories, home decor, etc.
- **Shopping Cart**: Add products to cart and manage purchases
- **Custom Design Requests**: Request custom designs from specific designers
- **Real-time Chat**: Communicate directly with designers about custom requests
- **Secure Payments**: Integrated Razorpay payment gateway for secure transactions
- **Order Tracking**: Track order status and delivery progress

### For Designers
- **Store Management**: Create and manage your design store
- **Product Management**: Upload and manage product listings
- **Custom Request Handling**: Accept/reject custom design requests
- **Bank Account Integration**: Manage payment details for receiving payments
- **Dashboard**: Track sales, orders, and customer interactions
- **Real-time Chat**: Communicate with customers about their requests

## 💻 Technical Stack

- **Backend**: Node.js with Express.js
- **Frontend**: EJS templating with Tailwind CSS
- **Database**: MongoDB with Mongoose ODM
- **Real-time Features**: Socket.IO
- **Payment Gateway**: Razorpay
- **Authentication**: Session-based with express-session
- **File Upload**: Multer for image handling
- **UI Framework**: Tailwind CSS with custom components

## 🚀 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file with the following variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   RAZORPAY_KEY_ID=your_razorpay_key_id
   RAZORPAY_KEY_SECRET=your_razorpay_secret
   SESSION_SECRET=your_session_secret
   PORT=3000
   ```

4. Seed the categories:
   ```bash
   node seedCategory.js
   ```

5. Start the server:
   ```bash
   node index.js
   ```

## 📁 Project Structure

```
my-design-app/
├── config/
│   └── payment.js
├── models/
│   ├── bankDetail.js
│   ├── Cart.js
│   ├── Category.js
│   ├── ChatMessage.js
│   ├── CustomRequest.js
│   ├── Designer.js
│   ├── Order.js
│   ├── Product.js
│   ├── Review.js
│   └── User.js
├── public/
│   └── images/
├── routes/
│   ├── auth.js
│   ├── designer.js
│   ├── payment.js
│   └── user.js
├── views/
│   ├── chat.ejs
│   ├── store.ejs
│   └── [other view files]
├── index.js
└── package.json
```

## 🔐 User Roles

### Customer Features
- Sign up/login as a customer
- Browse designer stores by category
- View and purchase products
- Submit custom design requests
- Chat with designers
- Track orders
- Manage shopping cart

### Designer Features
- Sign up/login as a designer
- Create and manage store
- Upload and manage products
- Handle custom requests
- Chat with customers
- Track orders and sales
- Manage bank details for payments

## 💳 Payment Flow

1. Customer adds products to cart
2. Proceeds to checkout
3. Enters shipping details
4. Redirected to Razorpay payment
5. Payment confirmation
6. Order creation
7. Stock update
8. Order tracking begins

## 💬 Chat System

- Real-time messaging using Socket.IO
- Support for custom design discussions
- Typing indicators
- Message history
- Room-based chat system
- Automatic reconnection

## 🎯 Custom Request Flow

1. Customer submits custom request
2. Designer receives notification
3. Designer reviews and sets price
4. Customer accepts/rejects price
5. If accepted, payment flow begins
6. Real-time chat throughout process

## 🔒 Security Features

- Session-based authentication
- Secure password hashing
- Protected API endpoints
- Secure payment integration
- Input validation
- Error handling
- XSS protection

## 🎨 Categories

- Clothing
- Accessories
- Home Decor
- Art
- Jewelry
- Footwear
- Bags
- And more...

## 📱 Responsive Design

- Mobile-first approach
- Responsive UI components
- Optimized images
- Touch-friendly interfaces
- Fluid layouts



Required software:
- Node.js (v14 or higher)
- MongoDB
- npm or yarn
- Git


