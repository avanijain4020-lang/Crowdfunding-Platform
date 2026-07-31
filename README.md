# 🚀 CrowdFund - Full-Stack Crowdfunding Platform

CrowdFund ek modern, responsive Full-Stack Crowdfunding Web Application hai. Is platform par users apne creative projects, medical cases, ya startup ideas ke liye campaigns launch kar sakte hain, doosro ke campaigns explore/filter kar sakte hain, aur flexible payment options (UPI, Card, Net Banking) ke zariye support kar sakte hain.

---

## 🛠️ Tech Stack

* **Frontend:** HTML5, CSS3 (Flexbox & Grid Layouts), JavaScript (ES6+), LocalStorage (Session Management)
* **Backend:** Node.js, Express.js
* **Database:** MongoDB / JSON Data Store
* **API Architecture:** RESTful APIs

---

## ✨ Key Features

* 🔐 **User Authentication:** Dynamic Sign Up, Login, aur Logout functionality with session management.
* 📋 **Campaign Management:** Users apne individual campaigns create kar sakte hain with target goal, category, aur descriptions.
* 📊 **Personal User Dashboard:** Dynamic stats tracking created campaigns, raised amounts, aur percentage goal completion.
* 🔍 **Smart Search & Filtering:** Category-wise filtering (Tech, Medical, Education, etc.) aur search functionality.
* 💳 **Interactive Payment Modal:** Multi-payment mode options (UPI, Credit/Debit Card, Net Banking) with real-time goal progress updating.

---

## 📦 Project Structure

```text
crowdfunding-platform/
│
├── 📁 frontend/              # Client-side UI & Scripts
│   ├── index.html            # Main Landing / Explore Page
│   ├── auth.html             # Login & Registration Page
│   ├── dashboard.html        # User Profile & Stats Dashboard
│   ├── style.css             # Platform Styling & Layouts
│   ├── auth-style.css        # Authentication UI Styling
│   └── script.js             # Client Logic, DOM & API calls
│
├── 📁 backend/               # Server-side Application
│   ├── server.js             # Express API Routes & Server logic
│   ├── package.json          # Node dependencies & scripts
│   └── .package-lock.json
│
├── .gitignore                # Ignores heavy folders like node_modules
└── README.md                 # Project Documentation