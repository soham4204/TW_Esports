# 🎮 TW Esports

**Live Link:** [https://tw-esports.vercel.app/](https://tw-esports.vercel.app/)

TW Esports is a dynamic and competitive platform for gamers to join, track, and participate in esports tournaments. It brings together players from various games into a single platform with live updates, registration management, and a seamless Discord-based authentication system.

---

## 🚀 Features

- ✅ **Join Tournaments**  
  Search and register for active gaming tournaments easily.
- 🔐 **Discord Authentication**  
  Secure and seamless login using Discord OAuth2, ensuring authentic player profiles and preventing spam registrations.
- 🎯 **Multiple Tournament Types**  
  Supports knockout, round-robin, and various gaming platforms.
- 👤 **User Profiles & History**  
  Personalized tournament history synced to your account via Firestore, accessible across any device.
- 🛠️ **Admin Dashboard**  
  A hidden route (`/admin`) to manage tournaments, view registered teams, and track capacity.
- 📱 **Multi-Platform Support**  
  Fully responsive and optimized for both mobile and web platforms.

---

## 🛠️ Tech Stack

### 🔹 Frontend
- **React.js** (via Create React App)
- **Tailwind CSS** (for styling)
- **React Router** (for navigation)
- **Lucide React** (for icons)

### 🔸 Backend & Database
- **Firebase Firestore** (NoSQL Database for Tournaments and Users)
- **Firebase Authentication** (Custom Tokens via Discord)
- **Firebase Cloud Functions** (Node.js/Express) for handling the OAuth2 token exchange
- **Firebase Hosting / Vercel** (for deployment)

---

## 💻 Running the Project Locally

Follow these steps to set up the project on your local machine.

### 1. Prerequisites
- **Node.js** (v18 or higher recommended)
- **npm** or **yarn**
- **Firebase CLI** (`npm install -g firebase-tools`)

### 2. Clone the Repository
```bash
git clone <your-repo-url>
cd TW_Esports
```

### 3. Install Dependencies
You need to install dependencies for both the React frontend and the Cloud Functions backend.

**Frontend:**
```bash
npm install
```

**Backend (Cloud Functions):**
```bash
cd functions
npm install
cd ..
```

### 4. Configuration
Ensure your `src/firebase-config.js` is properly configured with your Firebase project credentials.

*(Optional but recommended for full backend testing)*: 
Update `functions/index.js` with your production Discord `CLIENT_ID` and `CLIENT_SECRET` if you are deploying or testing full authentication flows.

### 5. Start the Application

You need to run two processes: one for the React frontend, and one for the Firebase Emulator (which runs the backend Discord login function).

**Terminal 1 (Backend Emulator):**
```bash
# Start the Firebase Cloud Functions emulator
firebase emulators:start --only functions
```

**Terminal 2 (Frontend React App):**
```bash
# Start the React development server
npm start
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

---

## 🚀 Deployment

### Deploying the Backend (Firebase Functions)
Since the Discord login relies on a Cloud Function, you must deploy it to your Firebase project:
```bash
firebase login
firebase deploy --only functions
```
**Note:** Once deployed, make sure to update the `functionUrl` in `src/routes/DiscordCallback.js` from the local emulator URL to your production Google Cloud URL.

### Deploying the Frontend
The frontend can be deployed easily to platforms like **Vercel**, **Netlify**, or **Firebase Hosting**.
```bash
npm run build
```
