#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('🎉 Welcome to DesignHub Payment Setup!');
console.log('=====================================\n');

// Check if .env exists
const envPath = path.join(__dirname, '.env');
const envExists = fs.existsSync(envPath);

if (envExists) {
  console.log('✅ .env file already exists');
} else {
  console.log('📝 Creating .env file...');
  
  const envContent = `# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/designhub

# Razorpay Configuration (TEST KEYS)
RAZORPAY_KEY_ID=rzp_test_YOUR_TEST_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_TEST_KEY_SECRET

# Session Secret
SESSION_SECRET=your_session_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development
`;

  fs.writeFileSync(envPath, envContent);
  console.log('✅ .env file created successfully');
}

console.log('\n📋 Next Steps:');
console.log('1. Get your Razorpay API keys from: https://dashboard.razorpay.com/');
console.log('2. Update the .env file with your keys');
console.log('3. Start the server: npm start');
console.log('4. Test payment: http://localhost:3000/test-payment');
console.log('5. View setup guide: PAYMENT_SETUP.md');

console.log('\n🧪 Test Credentials:');
console.log('- Cards: 4111 1111 1111 1111 (success)');
console.log('- UPI: success@razorpay (success)');
console.log('- UPI: failure@razorpay (failure)');

console.log('\n🚀 Ready to start? Run: npm start');

rl.close(); 