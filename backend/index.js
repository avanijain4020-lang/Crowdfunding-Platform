const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 5002;
const JWT_SECRET = "supersecretkey123";

// 1. MIDDLEWARES
app.use(cors());
app.use(express.json());

// TOKEN VERIFICATION MIDDLEWARE (Security Check)
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization');
  if (!token) return res.status(401).json({ message: "Access Denied! No token provided." });

  try {
    // Bearer token format se token alag karna (agar frontend se 'Bearer <token>' aaye)
    const actualToken = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    const verified = jwt.verify(actualToken, JWT_SECRET);
    req.user = verified; // Isme user ki ID aur Name aa jayega
    next(); // Agle step par bhejo
  } catch (err) {
    res.status(400).json({ message: "Invalid Token!" });
  }
};

// 2. MONGOOSE DATABASE CONNECTION
mongoose.connect('mongodb://localhost:27017/crowdfunding')
  .then(() => console.log('✅ MongoDB Database Connected Successfully!'))
  .catch((err) => console.error('❌ Database Connection Error:', err));

// 3. DATABASE SCHEMAS & MODELS

// User Schema
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

// Updated Campaign Schema with Donors Array
const campaignSchema = new mongoose.Schema({
  title: String,
  goal: Number,
  raised: { type: Number, default: 0 },
  category: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  createdBy: String,
  donors: [
    {
      donorName: String,
      amount: Number,
      donatedAt: { type: Date, default: Date.now }
    }
  ] // Naya Donors Array 📁
});
const Campaign = mongoose.model('Campaign', campaignSchema);

// 4. AUTHENTICATION APIs (Login/Signup)

// Signup Route
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists!" });

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    user = new User({ name, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully! 🎉" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid Credentials!" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid Credentials!" });

    const token = jwt.sign({ id: user._id, name: user.name }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 5. CAMPAIGN APIs (Puraani APIs)

// Get all campaigns
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find();
    res.json(campaigns);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 1. Create a campaign (SECURED with verifyToken)
app.post('/api/campaigns', verifyToken, async (req, res) => {
  try {
    const { title, goal, category } = req.body;
    // req.user hume middleware se mila hai
    const newCampaign = new Campaign({ 
      title, 
      goal, 
      category, 
      raised: 0,
      userId: req.user.id,
      createdBy: req.user.name
    });
    await newCampaign.save();
    res.status(201).json(newCampaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Pledge/Donate to a campaign (SECURED: Saves Donor Info)
app.put('/api/campaigns/:id/pledge', verifyToken, async (req, res) => {
  try {
    const { amount } = req.body;
    const donationAmount = Number(amount);

    if (isNaN(donationAmount) || donationAmount <= 0) {
      return res.status(400).json({ message: "Please enter a valid donation amount." });
    }

    // Campaign ko dhoondho aur usme paise + donor details add karo
    const updatedCampaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      {
        $inc: { raised: donationAmount }, // Paise badhao
        $push: { 
          donors: { 
            donorName: req.user.name, // Login user ka naam 👤
            amount: donationAmount 
          } 
        } // Donor list mein jodo
      },
      { new: true }
    );

    if (!updatedCampaign) return res.status(404).json({ message: "Campaign not found" });
    res.json(updatedCampaign);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Delete a campaign (SECURED: Only owner can delete)
app.delete('/api/campaigns/:id', verifyToken, async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ message: "Campaign not found" });

    // Check agar login user hi owner hai
    if (campaign.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized! You can only delete your own campaigns." });
    }

    await Campaign.findByIdAndDelete(req.params.id);
    res.json({ message: "Campaign closed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// 6. SERVER START
app.listen(PORT, () => {
  console.log(`🚀 Backend Server running smoothly on http://localhost:${PORT}`);
});