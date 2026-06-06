# 🛒 CampusCart (AcroCart)
> **A Premium Peer-to-Peer Student Marketplace App**

CampusCart is a secure, modern, and lightning-fast peer-to-peer web application designed specifically for college campuses. It allows students at the **Acropolis Institute** to safely buy, sell, and trade textbooks, calculators, electronics, lab gear, and other dorm essentials. 

🚀 **Live App URL:** [https://campuscart-9c677.web.app](https://campuscart-9c677.web.app)

---

## ✨ Key Features

*   🔒 **Campus-Restricted Auth:** Log in securely via Google Authentication. User registration and access are strictly limited to official campus emails (`@acropolis.in`).
*   📱 **PWA Standalone App:** Install CampusCart directly onto your mobile phone or desktop home screen. Built with custom launch icons and offline-ready service worker configuration.
*   🎨 **Premium Aesthetic & Custom Themes:** A visually stunning UI featuring smooth glassmorphism cards, fluid transitions, and a curated **Space Navy Dark Mode** matched with warm gold accents.
*   💬 **WhatsApp-Style Live Chat:** Coordinate meetups and negotiate prices in real-time. Mobile viewports switch between active chat lists and message threads with back-button controls.
*   🎓 **Smart Department Matching:** Highlight and alert users to listings posted by peers within their own branch/department (e.g., Computer Science, Information Technology).
*   ⚙️ **User Preferences & Controls:** Customize WhatsApp contact hooks, set matching preferences, toggle dark/light mode themes, and manage user blocks to keep listings clean.
*   🔍 **Advanced Search & Filter Suite:** Find campus items quickly using price ranges, keyword filters, categories, and item age tags.

---

## 🛠️ Tech Stack

*   **Framework:** Next.js (App Router) & React
*   **Styling:** Vanilla CSS & CSS Modules (Modular, clean, scoped stylesheets)
*   **Backend Services:** Firebase v10+
    *   **Firebase Authentication:** Google Auth Provider
    *   **Firestore Database:** Scalable document-based database for listings, settings, and messaging threads.
    *   **Firebase Storage:** Secure storage for item image uploads.
*   **Hosting:** Firebase Hosting (Optimized static export build)
*   **Icons:** Lucide React

---

## ⚙️ Local Development Setup

To run CampusCart on your local machine:

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) (v18.0 or higher recommended)
*   npm or yarn package manager

### 2. Clone the Repository
```bash
git clone https://github.com/KavyanshRajput/campuscart.git
cd campuscart
```

### 3. Environment Variables
Create a `.env.local` file in the root of the directory and paste your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Install Dependencies
```bash
npm install
```

### 5. Run the Development Server
```bash
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser to view the application.

> 🛠️ **Local Mock Auth Bypass:**
> In local development environments, Google Authentication referrers may block sign-in attempts on `localhost:3000`. We have built-in an automatic bypass in local mode. Navigating to `/profile` on localhost will automatically sign you in as a mock user (`KAVYANSH RAJPUT`) to let you test and preview settings, chats, and listing creations smoothly.

---

## 📦 Build & Deploy

### Production Build
Generate a statically exported production bundle:
```bash
npm run build
```
This outputs a pre-rendered HTML/CSS/JS export in the `/out` directory.

### Hosting Deployment
Deploy the static build to Firebase Hosting:
```bash
npx firebase deploy --only hosting --project campuscart-9c677
```

---

## 👥 Developer
*   **Kavyansh Singh Rajput**

---

## 📄 License
This project is developed for academic evaluation at the Acropolis Institute. All rights reserved.
