const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./User'); // Sahi path check kar lena agar file dusre folder mein ho

const JWT_SECRET = "supersecretkey123"; // Ise aap kuch bhi rakh sakte hain

// 1. SIGNUP / REGISTER API
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Check agar user pehle se hai
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists!" });

    // Password ko secure (Hash) karo
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Naya User save karo
    user = new User({ name, email, password: hashedPassword });
    await user.save();

    res.status(201).json({ message: "User registered successfully! 🎉" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. LOGIN API
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check user email
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    // Match Password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials!" });

    // Generate JWT Token
    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });

    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;