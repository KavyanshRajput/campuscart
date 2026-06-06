# CampusCart (AcroCart)

CampusCart is a peer-to-peer marketplace app built for college students at Acropolis Institute. It allows students to buy, sell, and trade used books, lab coats, calculators, electronics, and other college essentials.

Live Link: https://campuscart-9c677.web.app
Github Repo: https://github.com/KavyanshRajput/campuscart

## Features

- **Google Login with Domain Lock:** Only users with an `@acropolis.in` email can access the application, keeping the marketplace secure and exclusive to campus students.
- **Real-Time Chat:** Integrated messaging system to coordinate meetups and negotiate pricing directly on campus. The chat view switches dynamically on mobile for standard scrolling.
- **PWA (Progressive Web App):** Can be installed to home screens on mobile and desktop as a standalone app.
- **Matching and Settings:** Options to toggle dark mode, customize WhatsApp hooks for listing notifications, set branch matching alerts, and block users.
- **Explore and Search:** Browse items by category, filter by maximum price, or filter by the item's usage age.

## Tech Stack

- **Frontend:** Next.js (App Router), React, CSS Modules, Lucide React
- **Backend & Database:** Firebase Auth (Google Provider), Firestore, Firebase Storage
- **Deployment:** Firebase Hosting

## Local Setup

### 1. Prerequisites
Make sure you have Node.js installed on your computer.

### 2. Clone and Install
```bash
git clone https://github.com/KavyanshRajput/campuscart.git
cd campuscart
npm install
```

### 3. Environment Variables
Create a `.env.local` file in the root directory and add your Firebase configurations:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### 4. Run Locally
```bash
npm run dev
```
Open http://localhost:3000 in your browser.

*Note: In local development, Google Sign-in might block localhost referrers. The app will automatically log you in as a mock user on localhost so you can test profile options and chats immediately.*

## Build and Deploy

To create a static production build:
```bash
npm run build
```

To deploy the static build to Firebase Hosting:
```bash
npx firebase deploy --only hosting --project campuscart-9c677
```

## Developer
- Kavyansh Singh Rajput

## License
Academic project for evaluation at Acropolis Institute. All rights reserved.
