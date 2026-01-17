# Sports Teammate Finder 🏆

A full-stack web application to help sports enthusiasts find teammates in their area. Built with React, Node.js, Express, and MongoDB.

![Tech Stack](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [OTP Authentication Flow](#-otp-authentication-flow)
- [User Discovery System](#-user-discovery-system)
- [Admin Dashboard](#-admin-dashboard)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [API Endpoints](#-api-endpoints)
- [Test Credentials](#-test-credentials)
- [Deployment](#-deployment)

## ✨ Features

### User Features
- **OTP-based Authentication** - Secure, passwordless login using email OTP
- **Sport-specific Profiles** - Choose from 8 different sports
- **Location-based Discovery** - Find teammates by city and area
- **Real-time Active Status** - See who's online right now
- **Profile Management** - Update preferences anytime

### Admin Features
- **Dashboard Analytics** - Total users, active users, growth metrics
- **User Management** - View, filter, and manage all users
- **Statistics Visualization** - Users by sport, users by city
- **Role-based Access** - Protected admin routes

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | React 18, Tailwind CSS, React Router v6 |
| **Backend** | Node.js, Express.js |
| **Database** | MongoDB (Atlas) |
| **Authentication** | JWT, Email OTP (Nodemailer) |
| **Deployment** | Frontend: Vercel, Backend: Render |

### Why This Stack?
- **React + Tailwind** - Industry standard, fast development
- **Express + MongoDB** - Flexible schema, easy to scale
- **Email OTP** - No SMS costs, works globally
- **JWT** - Stateless, scalable authentication

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │
│  │  Auth    │  │  User    │  │ Discovery │  │    Admin     │   │
│  │  Pages   │  │Dashboard │  │   Page    │  │  Dashboard   │   │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬───────┘   │
│       │             │             │               │            │
│       └─────────────┴──────┬──────┴───────────────┘            │
│                            │                                    │
│                     ┌──────▼──────┐                            │
│                     │   API Service │                           │
│                     │   (Axios)     │                           │
│                     └──────┬──────┘                            │
└────────────────────────────┼───────────────────────────────────┘
                             │ HTTPS
┌────────────────────────────▼───────────────────────────────────┐
│                       SERVER (Express)                          │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                     Middleware                            │  │
│  │  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌───────────┐  │  │
│  │  │  CORS   │  │  Helmet  │  │Rate Limit│  │JWT Verify │  │  │
│  │  └─────────┘  └──────────┘  └─────────┘  └───────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐    │
│  │ Auth Routes │  │ User Routes │  │    Admin Routes     │    │
│  │ /api/auth/* │  │/api/users/* │  │   /api/admin/*      │    │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘    │
│         │                │                     │                │
│         └────────────────┴──────────┬──────────┘                │
│                                     │                           │
│                           ┌─────────▼─────────┐                 │
│                           │    Controllers    │                 │
│                           └─────────┬─────────┘                 │
└─────────────────────────────────────┼──────────────────────────┘
                                      │
┌─────────────────────────────────────▼──────────────────────────┐
│                      DATABASE (MongoDB)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │    Users     │  │     OTPs     │  │    Admins    │         │
│  │  Collection  │  │  Collection  │  │  Collection  │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└────────────────────────────────────────────────────────────────┘
```

## 🔐 OTP Authentication Flow

### Signup Flow

```
┌──────┐          ┌──────────┐          ┌────────────┐          ┌──────────┐
│ User │          │ Frontend │          │  Backend   │          │  Email   │
└──┬───┘          └────┬─────┘          └─────┬──────┘          └────┬─────┘
   │                   │                      │                      │
   │ 1. Enter details  │                      │                      │
   │──────────────────>│                      │                      │
   │                   │                      │                      │
   │                   │ 2. POST /signup/send-otp                    │
   │                   │─────────────────────>│                      │
   │                   │                      │                      │
   │                   │                      │ 3. Generate 6-digit  │
   │                   │                      │    OTP               │
   │                   │                      │                      │
   │                   │                      │ 4. Hash OTP & store  │
   │                   │                      │    with 5min expiry  │
   │                   │                      │                      │
   │                   │                      │ 5. Send OTP email    │
   │                   │                      │─────────────────────>│
   │                   │                      │                      │
   │                   │                      │                      │ 6. Email delivered
   │<──────────────────┼──────────────────────┼──────────────────────│
   │                   │                      │                      │
   │ 7. Enter OTP      │                      │                      │
   │──────────────────>│                      │                      │
   │                   │                      │                      │
   │                   │ 8. POST /signup/verify-otp                  │
   │                   │─────────────────────>│                      │
   │                   │                      │                      │
   │                   │                      │ 9. Verify OTP hash   │
   │                   │                      │    Check expiry      │
   │                   │                      │    Mark user verified│
   │                   │                      │    Delete OTP record │
   │                   │                      │    Generate JWT      │
   │                   │                      │                      │
   │                   │ 10. Return JWT token │                      │
   │<──────────────────│<─────────────────────│                      │
   │                   │                      │                      │
```

### Security Measures

> "OTP is single-use, time-bound, and removed after verification for security."

- **Hashed Storage**: OTP stored as bcrypt hash
- **Time-bound**: 5-minute expiry window
- **Single-use**: Deleted immediately after verification
- **Attempt Limiting**: Max 3 attempts per OTP
- **Rate Limiting**: 3 OTP requests per minute per IP

## 🔍 User Discovery System

### Data Model

```javascript
User {
  name: String,           // Required, max 50 chars
  email: String,          // Unique, verified
  sport: Enum,            // football, cricket, badminton, tennis,
                          // basketball, volleyball, hockey, swimming
  city: String,           // Indexed for fast queries
  area: String,           // Indexed for local search
  latitude: Number,       // Optional, for future radius search
  longitude: Number,      // Optional, for future radius search
  isActive: Boolean,      // Updated on each request
  lastActive: Date,       // Timestamp of last activity
  isVerified: Boolean     // Email verified status
}
```

### Filter Logic

| Filter | Implementation |
|--------|---------------|
| **Sport** | Exact match on sport enum |
| **City** | Case-insensitive regex search |
| **Area** | Case-insensitive regex search |
| **Active** | Users with lastActive within 15 minutes |

### Performance Optimizations

> "I prioritized performance by indexing city, sport, and active status fields."

```javascript
// Compound indexes for efficient filtering
userSchema.index({ sport: 1, city: 1, isActive: 1 });
userSchema.index({ city: 1, area: 1 });
```

### "Nearby" Definition

- **Same Area**: Users in the exact same area as current user
- **Nearby**: Users in the same city but different areas
- **Active**: Users who interacted within the last 15 minutes

> "Active status is derived from last interaction time, updated on every request."

## 👨‍💼 Admin Dashboard

### Admin Authentication

- Separate `admins` collection
- Email + hashed password authentication
- Role-based middleware protection

> "Admin routes are protected via role-based authorization middleware."

### Dashboard Features

| Feature | Description |
|---------|-------------|
| **Total Users** | Count of all verified users |
| **Active Now** | Users active in last 15 minutes |
| **New Today** | Signups in the last 24 hours |
| **This Week** | Signups in the last 7 days |
| **Users by Sport** | Distribution chart |
| **Top Cities** | Cities with most users |
| **User Table** | Filterable, paginated list |

### Admin Capabilities

- View all users with filters (sport, city)
- Delete users
- View real-time statistics
- Pagination support (10 users per page)

## 🚀 Installation

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Gmail account for sending emails

### Backend Setup

```bash
# Navigate to backend directory
cd sports-teammate-finder/backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd sports-teammate-finder/frontend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit if needed

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)

```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sports-teammate-finder
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d

# Email Configuration (Gmail example)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL for CORS
FRONTEND_URL=http://localhost:5173

# Admin seed credentials
ADMIN_EMAIL=admin@sportsteam.com
ADMIN_PASSWORD=Admin@123
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000/api
```

> "Environment variables are managed securely using `.env` files."

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup/send-otp` | Send signup OTP |
| POST | `/api/auth/signup/verify-otp` | Verify & create account |
| POST | `/api/auth/login/send-otp` | Send login OTP |
| POST | `/api/auth/login/verify-otp` | Verify & login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/profile` | Update profile |
| POST | `/api/auth/logout` | Logout user |

### User Discovery

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/sports` | Get available sports |
| GET | `/api/users/discover` | Discover teammates (filtered) |
| GET | `/api/users/nearby` | Get nearby teammates |
| GET | `/api/users/active` | Get active teammates |

### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/admin/login` | Admin login |
| GET | `/api/admin/stats` | Dashboard statistics |
| GET | `/api/admin/users` | Get all users (paginated) |
| GET | `/api/admin/cities` | Get unique cities |
| DELETE | `/api/admin/users/:id` | Delete user |

## 🔑 Test Credentials

### Admin Access

```
Email: admin@sportsteam.com
Password: Admin@123
```

### Creating Test User

1. Go to `/signup`
2. Enter any valid email you have access to
3. Complete the signup flow with OTP

## 🌐 Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import repository in Vercel
3. Set root directory to `frontend`
4. Add environment variable: `VITE_API_URL`
5. Deploy

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service in Render
3. Set root directory to `backend`
4. Set build command: `npm install`
5. Set start command: `npm start`
6. Add all environment variables
7. Deploy

### MongoDB (Atlas)

1. Create free cluster
2. Add database user
3. Whitelist IP addresses (0.0.0.0/0 for Render)
4. Get connection string
5. Add to backend environment

## 📁 Project Structure

```
sports-teammate-finder/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   └── adminController.js
│   ├── middleware/
│   │   └── auth.js
│   ├── models/
│   │   ├── User.js
│   │   ├── OTP.js
│   │   └── Admin.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── userRoutes.js
│   │   └── adminRoutes.js
│   ├── utils/
│   │   ├── generateOTP.js
│   │   ├── generateToken.js
│   │   ├── seedAdmin.js
│   │   └── sendEmail.js
│   ├── server.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ProtectedRoute.jsx
│   │   │   ├── AdminProtectedRoute.jsx
│   │   │   └── TeammateCard.jsx
│   │   ├── context/
│   │   │   ├── AuthContext.jsx
│   │   │   └── AdminContext.jsx
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Signup.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Discover.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── AdminLogin.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   └── package.json
│
└── README.md
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

---

Built with ❤️ for sports enthusiasts
