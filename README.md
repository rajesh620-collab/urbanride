# UrbanRide – Smart Last-Mile Connectivity Solution

![UrbanRide Banner](https://img.shields.io/badge/UrbanRide-Smart%20Mobility-blue)
![Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-green)
![Built With](https://img.shields.io/badge/Built%20With-MERN%20Stack-orange)

## 🌐 Live Demo

🔗 Website: [https://urbanride-psi.vercel.app/](https://urbanride-psi.vercel.app/)

---

# 📌 Overview

UrbanRide is a smart last-mile connectivity and peer ride-pooling platform designed to improve short-distance urban transportation.

The system focuses on:

* Reducing unnecessary travel detours
* Improving ride-sharing efficiency
* Minimizing waiting time
* Enabling landmark-based pooling
* Providing safer ride options
* Enhancing urban mobility using intelligent ride matching

Unlike traditional ride-hailing systems, UrbanRide allows users to create and join rides using predefined high-demand landmarks instead of exact door-to-door matching.

This approach:

* Reduces route complexity
* Improves ride match success rate
* Optimizes travel efficiency
* Encourages eco-friendly transportation

---

# 🚀 Problem Statement

Existing ride-sharing platforms primarily focus on full-distance transportation and exact pickup-drop locations.

This creates several issues:

* ❌ Increased ride costs
* ❌ Unnecessary detours
* ❌ Low seat utilization
* ❌ Longer waiting times
* ❌ Poor last-mile connectivity
* ❌ No smart re-notification for unmatched rides
* ❌ Limited user safety features

UrbanRide solves these issues through:

* Landmark-based ride pooling
* Smart ride re-notification engine
* Real-time ride matching
* Seat-based fare sharing
* Female-only ride filters
* Intelligent route optimization

---

# 🎯 Objectives

* Provide efficient last-mile transportation
* Reduce commuter waiting time
* Improve ride-sharing success rate
* Enable decentralized peer-to-peer ride pooling
* Enhance safety and comfort for users
* Build a scalable smart mobility platform

---

# ✨ Key Features

## 👥 Peer-to-Peer Ride Pooling

Users can:

* Create rides
* Join available rides
* Share seats with other commuters

---

## 📍 Landmark-Based Matching

Instead of exact addresses, rides are matched using:

* Metro stations
* Bus stops
* Public landmarks
* Popular urban pickup points

Benefits:

* Better ride compatibility
* Faster matching
* Reduced detours

---

## 🔔 Smart Re-Notification Engine

If no ride is immediately available:

* User requests are stored
* System continuously rechecks ride availability
* Users are notified when a compatible ride appears

---

## 👩 Female-Only Matching Filter

To improve safety and comfort:

* Users can opt for female-only rides
* System filters matching rides accordingly

---

## 🗺️ Real-Time Tracking

Features include:

* Live ride status
* Real-time location updates
* Estimated arrival tracking

---

## 💰 Seat-Based Fare Sharing

Fare is calculated based on:

* Distance traveled
* Seat occupancy
* Shared ride allocation

This ensures:

* Fair pricing
* Reduced travel cost

---

# 🧠 System Architecture

UrbanRide follows a modular client-server architecture.

## Main Components

### 1. User Interface

* Ride creation
* Ride joining
* Notifications
* Real-time updates

### 2. Backend Server

Handles:

* Ride requests
* Authentication
* Ride lifecycle management
* Notifications

### 3. Matching Engine

Responsible for:

* Ride compatibility checks
* Route overlap analysis
* Time constraint filtering
* Seat validation

### 4. Database

Stores:

* User profiles
* Ride data
* Booking history
* Notifications

### 5. Real-Time Communication

Uses WebSockets for:

* Instant ride updates
* Live notifications
* Ride status synchronization

---

# ⚙️ Technology Stack

## Frontend

* React.js
* HTML5
* CSS3
* JavaScript
* Tailwind CSS (if used)

## Backend

* Node.js
* Express.js

## Database

* MongoDB

## APIs & Services

* Google Maps API / OpenStreetMap
* GPS Services
* WebSockets

## Deployment

* Vercel

---

# 📂 Project Structure

```bash
UrbanRide/
│
├── client/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── context/
│   │   └── App.js
│
├── server/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── middleware/
│   ├── config/
│   └── server.js
│
├── README.md
├── package.json
└── .env
```

---

# 🔄 Workflow of the System

## Step 1: User Registration

Users create an account and login.

## Step 2: Ride Creation

User enters:

* Pickup landmark
* Destination landmark
* Travel time
* Seat availability
* Preferences

## Step 3: Ride Matching

System checks:

* Route overlap
* Time compatibility
* Seat availability
* Gender preference

## Step 4: Ride Confirmation

Compatible users are grouped into shared rides.

## Step 5: Real-Time Tracking

Users receive:

* Live ride updates
* Notifications
* Ride status

## Step 6: Ride Completion

Fare is calculated and ride is closed.

---

# 🧮 Matching Algorithm Logic

UrbanRide uses heuristic-based ride matching.

Matching conditions include:

* Spatial route similarity
* Time compatibility
* Available seat count
* Landmark overlap
* User preference constraints

This improves:

* Ride efficiency
* Successful pooling probability
* User satisfaction

---

# 📊 Advantages of UrbanRide

✅ Reduced travel cost

✅ Lower traffic congestion

✅ Better seat utilization

✅ Faster ride matching

✅ Eco-friendly transportation

✅ Increased user safety

✅ Improved urban mobility

---

# 🔐 Security Features

* User authentication
* Secure database handling
* Role-based access control
* Protected ride information
* Safe user matching

---

# 📈 Future Enhancements

## 🤖 AI-Based Ride Prediction

Machine learning for:

* Demand prediction
* Smart ride suggestions
* Intelligent route planning

---

## 💳 Payment Gateway Integration

Add:

* Online payments
* Wallet systems
* UPI support

---

## 📱 Mobile Application

Develop:

* Android app
* iOS app
* Cross-platform mobile support

---

## 🚦 Traffic-Aware Routing

Use:

* Real-time traffic APIs
* Dynamic route optimization

---

## 🧾 Admin Dashboard

Features:

* User management
* Ride analytics
* System monitoring

---
# 🧪 Installation Guide

## Clone the Repository

```bash
git clone https://github.com/your-username/UrbanRide.git
```

---

## Navigate into the Project

```bash
cd UrbanRide
```

---

## Install Dependencies

### Frontend

```bash
cd client
npm install
```

### Backend

```bash
cd server
npm install
```

---

## Configure Environment Variables

Create a `.env` file in the backend folder.

Example:

```env
MONGO_URI=your_mongodb_connection
JWT_SECRET=your_secret_key
GOOGLE_MAPS_API_KEY=your_api_key
PORT=5000
```

---

## Run the Application

### Backend

```bash
npm start
```

### Frontend

```bash
npm run dev
```

---

# 🧪 Testing

Suggested testing types:

* Unit Testing
* Integration Testing
* API Testing
* UI Testing
* Performance Testing

Tools:

* Postman
* Jest
* React Testing Library

---

# 📊 Evaluation Metrics

UrbanRide can be evaluated using:

* Ride match success rate
* Average waiting time
* Seat utilization rate
* User satisfaction
* Route optimization efficiency
* Notification response rate

---

# 👨‍💻 Contributors

## Team Members

* T. Yogesh
* V. Nagarajeswara Reddy
* Y. Sreetham Kruthik
* T. Sruthi

## Guided By

Mrs. V. Sathya Priya
Assistant Professor
Department of Computer Science and Engineering
BVRIT

---

# 🏫 Academic Information

Department of Computer Science and Engineering

B V Raju Institute of Technology

Domain: Full Stack Development with GenAI

Academic Year: 2025–2026

---

# 📜 License

This project is developed for academic and educational purposes.

You may modify and use the project with proper attribution.

---

# 🤝 Contributing

Contributions are welcome.

Steps:

1. Fork the repository
2. Create a new branch
3. Commit changes
4. Push the branch
5. Create a Pull Request

---

# ⭐ Support

If you like this project:

⭐ Star the repository

🍴 Fork the repository

📢 Share the project

---

# 📬 Contact

For queries and collaboration:

📧 Add your email here

🔗 LinkedIn: Add LinkedIn profile

🌐 Portfolio: Add portfolio link

---
