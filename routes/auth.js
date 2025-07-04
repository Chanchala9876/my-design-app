const express = require('express');
const router = express.Router();
const User = require('../models/User'); // path corrected
const Designer = require('../models/Designer');
const bcrypt = require('bcryptjs');

// User signup
router.post('/user/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const user = new User({ name, email, password });
    await user.save();
    res.redirect('/content');
  } catch (err) {
    console.error('User Signup Error:', err); // ✅ Add this
    res.status(500).json({ error: 'Server error' });
  }
});

// User login
router.post('/user/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });

    res.redirect('/content');
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Designer signup
router.post('/designer/signup', async (req, res) => {
  try {
    const { name, storeName, email, password, category } = req.body;
    const exists = await Designer.findOne({ email });
    if (exists) return res.status(400).json({ error: 'Email already registered' });

    const designer = new Designer({ name, storeName, email, password, category });
    await designer.save();
    res.status(201).json({ message: 'Designer registered successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Designer login
router.post('/designer/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const designer = await Designer.findOne({ email });
    if (!designer) return res.status(400).json({ error: 'Invalid email or password' });

    const isMatch = await bcrypt.compare(password, designer.password);
    if (!isMatch) return res.status(400).json({ error: 'Invalid email or password' });
        req.session.designerId = designer._id;

    res.redirect('/designerdashboard');
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
