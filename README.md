# 🤝 Crowdfunding Platform

🚀 **Empowering Ideas, Securing Futures.**

The Crowdfunding Platform is a modern, responsive Full-Stack Fundraising Portal. It enables users to seamlessly launch crowdfunding campaigns for noble causes or startup ideas, track donation progress in real-time, and manage everything within a secure authenticated environment.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, JavaScript (ES6+), CSS-in-JS (Custom Glassmorphism Styles)
* **Build Tool:** Vite / Rolldown (Ultra-fast modern bundling)
* **Deployment:** Vercel (Frontend Hosting)
* **Security:** JWT (JSON Web Tokens) Session Management Simulation

---

## ✨ Key Features

* **Glassmorphism Neon UI:** A visually stunning and highly professional Sign-In screen featuring radiant neon blue and purple gradient shadows to deliver a premium modern aesthetic.
* **Full CRUD Campaign Engine:** Authenticated users can smoothly **Create, Read, Update, and Delete** active fundraising campaigns directly from the dashboard without application crashes.
* **Secure Token Workflow:** Following backend security standards, the system handles local-storage tokens to guarantee that only validated users can alter or delete campaigns.
* **Dynamic "Created by" Tagging:** Automated ownership tracking that dynamically injects a personalized `"Created by: [User Name]"` badge onto each newly launched campaign card.
* **Interactive Progress Trackers:** Real-time dynamic green progress indicators that instantly calculate and display the percentage of funds raised against the target goal.

---

## 📦 Project Structure

```text
Crowdfunding-Platform/
├── src/
│   ├── App.jsx          # Main application core logic (CRUD + Login Auth)
│   ├── main.jsx         # Vite standard DOM injection setup
│   └── index.css        # Core styling overrides
├── public/              # Static public assets & screenshots
├── package.json         # Dependency configuration matrix
└── README.md            # Project documentation & overview