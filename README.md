# 🤝 Crowdfunding Platform

🚀 **Empowering Ideas, Securing Futures.**

Crowdfunding Platform ek modern, responsive design par bana Full-Stack Fundraising Portal hai. Yahan users aakar apne noble causes ya startup ideas ke liye campaigns create kar sakte hain, live progress track kar sakte hain, aur secure authentication ke saath funds raise kar sakte hain.

---

## 🛠️ Tech Stack

* **Frontend:** React.js, JavaScript (ES6+), CSS-in-JS (Custom Glassmorphism Styles)
* **Build Tool:** Vite / Rolldown (Ultra-fast modern bundling)
* **Deployment:** Vercel (Frontend Hosting)
* **Security:** JWT (JSON Web Tokens) Session Management Simulation

---

## ✨ Key Features

* **Glassmorphism Neon UI:** Ek behad attractive aur professional Sign-In screen jo radiant neon blue aur purple gradient shadows ke saath modern aesthetic look deti hai.
* **Full CRUD Campaign Engine:** Authenticated users bina kisi system crash ke dashboard se hi apne fundraising campaigns ko **Create, Read, Update, aur Delete** kar sakte hain.
* **Secure Token Workflow:** Backend security standard ko follow karte hue system local-storage tokens generate karta hai, jisse sirf validated users hi campaigns ko alter ya delete kar paayein.
* **Dynamic "Created by" Tagging:** Har naye campaign card par automatic tracking lagti hai jo dynamic tarike se batati hai ki is campaign ka real owner/creator kaun hai.
* **Interactive Progress Trackers:** Live dynamic green progress bars jo real-time mein calculate karti hain ki target goal ka kitna percentage ($) raise ho chuka hai.

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