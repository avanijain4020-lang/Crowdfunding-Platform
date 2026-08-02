const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const nodemailer = require('nodemailer');
require('dotenv').config(); // Environment variables ke liye

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 1. MONGOOSE CONNECTION
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/crowdfundDB";

mongoose.connect(MONGO_URI)
    .then(() => console.log("✅ Successfully Connected to MongoDB Database!"))
    .catch((err) => console.error("❌ Database Connection Error:", err));


// 2. SCHEMAS & MODELS

// User Schema (OTP field names matching api routes)
const userSchema = new mongoose.Schema({
  name: { type: String },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  resetOTP: String,
  resetOTPExpires: Date,
});

// Import ya inline model create karne ka safe tareeka
const User = mongoose.models.User || mongoose.model('User', userSchema);

// Campaign Schema
const campaignSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, default: 'General' },
    description: { type: String, default: 'No description provided.' },
    goalAmount: { type: Number, required: true },
    raisedAmount: { type: Number, default: 0 },
    creatorName: { type: String, default: 'Anonymous Creator' },
    creatorEmail: { type: String, default: '' }
}, { timestamps: true });

const Campaign = mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);


// 3. AUTH ROUTES

// REGISTER
app.post('/api/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            return res.status(400).json({ error: "All fields are required!" });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: "User already exists with this email!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword });
        await newUser.save();

        res.json({ message: "Registration successful! Please login." });
    } catch (err) {
        res.status(500).json({ error: "Failed to register user." });
    }
});

// LOGIN
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ error: "Invalid Email or Password!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: "Invalid Email or Password!" });
        }

        res.json({
            message: "Login successful!",
            user: { id: user._id, name: user.name, email: user.email }
        });
    } catch (err) {
        res.status(500).json({ error: "Server error during login." });
    }
});


// 4. CAMPAIGN ROUTES

// READ: All Campaigns
app.get('/api/campaigns', async (req, res) => {
    try {
        const campaigns = await Campaign.find();
        const formattedCampaigns = campaigns.map(c => ({
            id: c._id.toString(),
            title: c.title,
            category: c.category,
            description: c.description,
            goalAmount: c.goalAmount,
            raisedAmount: c.raisedAmount,
            creatorName: c.creatorName,
            creatorEmail: c.creatorEmail
        }));
        res.json(formattedCampaigns);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch campaigns." });
    }
});

// READ: User-Specific Campaigns for Dashboard
app.get('/api/user-campaigns/:email', async (req, res) => {
    try {
        const { email } = req.params;
        const userCampaigns = await Campaign.find({ creatorEmail: email });

        const formattedCampaigns = userCampaigns.map(c => ({
            id: c._id.toString(),
            title: c.title,
            category: c.category,
            description: c.description,
            goalAmount: c.goalAmount,
            raisedAmount: c.raisedAmount,
            createdAt: c.createdAt
        }));

        res.json(formattedCampaigns);
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch user campaigns." });
    }
});

// CREATE: New Campaign
app.post('/api/campaign/create', async (req, res) => {
    try {
        const { title, description, goalAmount, category, creatorName, creatorEmail } = req.body;

        if (!title || !goalAmount) {
            return res.status(400).json({ error: "Title and Goal Amount are required!" });
        }

        const newCampaign = new Campaign({
            title,
            category: category || "General",
            description: description || "No description provided.",
            goalAmount: parseFloat(goalAmount),
            raisedAmount: 0,
            creatorName: creatorName || "Anonymous Creator",
            creatorEmail: creatorEmail || ""
        });

        await newCampaign.save();
        res.json({ message: "Campaign Created Successfully!", campaign: newCampaign });
    } catch (err) {
        res.status(500).json({ error: "Failed to create campaign." });
    }
});

// UPDATE
app.put('/api/campaign/update/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, goalAmount, category } = req.body;

        const updatedCampaign = await Campaign.findByIdAndUpdate(
            id,
            { title, description, goalAmount: parseFloat(goalAmount), category },
            { new: true }
        );

        if (!updatedCampaign) {
            return res.status(404).json({ error: "Campaign not found!" });
        }

        res.json({ message: "Campaign Updated Successfully!", campaign: updatedCampaign });
    } catch (err) {
        res.status(500).json({ error: "Failed to update campaign." });
    }
});

// DELETE
app.delete('/api/campaign/delete/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const deletedCampaign = await Campaign.findByIdAndDelete(id);

        if (!deletedCampaign) {
            return res.status(404).json({ error: "Campaign not found!" });
        }

        res.json({ message: "Campaign Deleted Successfully!" });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete campaign." });
    }
});

// DONATE / PLEDGE
app.post('/api/donate', async (req, res) => {
    try {
        const { campaignId, amount } = req.body;
        const campaign = await Campaign.findById(campaignId);

        if (!campaign) {
            return res.status(404).json({ error: "Campaign not found!" });
        }

        campaign.raisedAmount += parseFloat(amount);
        await campaign.save();

        res.json({ message: "Pledge successful!", updatedRaisedAmount: campaign.raisedAmount });
    } catch (err) {
        res.status(500).json({ error: "Pledge failed." });
    }
});


// 5. NODEMAILER & OTP PASSWORD RESET ROUTES

// Nodemailer Transporter Setup (Gmail Config)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS  // Gmail App Password
    }
});

// API 1: Send OTP to Email
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User with this email does not exist.' });
        }

        // 6-Digit Random OTP Generate Karein
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Database me OTP aur 10 Minute Expiry Save Karein
        user.resetOTP = otp;
        user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 Minutes Valid
        await user.save();

        // Email Send Config
        const mailOptions = {
            from: `"CrowdFund Support" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: '🔒 Password Reset OTP - CrowdFund',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #007bff;">Password Reset Request</h2>
                    <p>Your OTP for resetting password is:</p>
                    <h1 style="background: #f4f4f4; padding: 10px; display: inline-block; letter-spacing: 4px; color: #333;">${otp}</h1>
                    <p>This OTP is valid for <b>10 minutes</b>. Do not share it with anyone.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'OTP sent successfully to your email!' });

    } catch (error) {
        console.error('Send OTP Error:', error);
        res.status(500).json({ message: 'Failed to send OTP email.' });
    }
});

// API 2: Verify OTP & Reset Password
app.post('/api/verify-otp-reset', async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        // OTP Match & Expiry Check
        if (user.resetOTP !== otp || Date.now() > user.resetOTPExpires) {
            return res.status(400).json({ message: 'Invalid or expired OTP!' });
        }

        // Password Hash Karke Save Karein (Security + Login compatibility fix)
        user.password = await bcrypt.hash(newPassword, 10);

        // Clear OTP after successful reset
        user.resetOTP = null;
        user.resetOTPExpires = null;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully! You can now login.' });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        res.status(500).json({ message: 'Server error while resetting password.' });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});