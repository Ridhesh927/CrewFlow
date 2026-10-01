# CrewFlow 🚢

> **Comprehensive Intern Management & Workforce Tracking Platform**

![Next.js](https://img.shields.io/badge/Next.js%2016-black?style=flat-square&logo=next.js)
![React](https://img.shields.io/badge/React%2019-%2320232a.svg?style=flat-square&logo=react&logoColor=%2361DAFB)
![Node.js](https://img.shields.io/badge/Node.js%2018+-%2343853D.svg?style=flat-square&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql&logoColor=white)
![NeonDB](https://img.shields.io/badge/NeonDB-00E599?style=flat-square&logo=neon&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS%20v4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)

[![Setup Guide](#setup-instructions)](#setup-instructions) [![Docs](#core-features-implemented)](#core-features-implemented)

---

## 📑 Table of Contents

- [Overview](#overview)
- [Core Features Implemented](#core-features-implemented)
- [Technology Stack](#technology-stack)
- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Setup Instructions](#setup-instructions)

---

## 📖 Overview

CrewFlow is a comprehensive intern and company management platform. It streamlines task assignments, tracks attendance, verifies proofs, handles documents and provides real-time analytics. The system supports 5 distinct user roles (Admin, Senior TL, TL, Captain, Intern), each with a tailored dashboard and permission set.

---

## 🚀 Core Features Implemented

### 1. Hierarchical Role-Based Access Control (RBAC)
* **Admin**: Global oversight, system configuration, and company-wide analytics.
* **Senior Team Lead (Senior TL)**: Department-level management and verification.
* **Team Lead (TL)**: Team-level management, supervising Captains and Interns.
* **Captain**: Direct intern management, attendance marking, and task verification.
* **Intern**: Personal dashboard for task execution, proof submission, and tracking personal metrics.

### 2. Interactive Role-Based Dashboards
* **Admin Dashboard**: Visualizes global statistics, pending approvals across departments, and recent system-wide activities.
* **Manager Dashboards (Senior TL, TL, Captain)**: Unified views displaying team metrics, subordinate lists, missing attendance alerts, and a queue for "Proofs Awaiting Verification."
* **Intern Dashboard**: Personal metrics tracking (Attendance %, Performance Rating) and an interactive "My Tasks" interface for submitting social media campaign proofs.
* **Analytics & Performance Dashboard**: Live visual charts using `recharts` to track ratings, tasks, and team averages.

### 3. Task & Document Management
* **Sub-tasks / Checklists**: Nested sub-tasks inside of main tasks so interns can keep track of their progress piece by piece.
* **Resource / Document Hub**: Integrated `@fastify/multipart` and `cloudinary` so managers can upload and share PDFs and other resources directly to the cloud.
* **Gamification & Leaderboard**: Interns gain points upon proof verification, and a leaderboard highlights top performers.

### 4. UI/UX Enhancements
* **Dark Mode Toggle**: Integrated `next-themes` to support immediate toggling between light and dark aesthetics.
* **Dynamic Navigation**: Sidebar dynamically adjusts routing links based on the active user's role.
* **Prototype State Simulation**: Robust mock data engine to simulate real-time interactions.

---

## 🛠 Technology Stack

### Frontend & Build
* **Next.js 16 (App Router)**: Core framework with Turbopack for instant hot-module reloading.
* **Tailwind CSS v4 & Shadcn UI**: Primary component management framework (CMF) providing accessible, beautifully designed components.
* **Framer Motion & Lucide React**: Smooth page transitions and modern scalable SVG icons.
* **Zustand**: Fast and scalable state management solution.

### Database & Backend Integration
* **Node.js**: High-performance backend API execution environment.
* **Neon PostgreSQL & Prisma**: Serverless Postgres database platform configured natively via Prisma.
* **Cloudinary**: Cloud storage solution for file and resource uploads.

---

## 📋 Prerequisites
- Node.js (v18+)
- PostgreSQL (Neon Database used natively via Prisma)
- Cloudinary Account (for file uploads)

---

## 🔐 Environment Variables
Create a `.env` file in the `backend` directory. The following variables are required:

```env
# Database configuration
DATABASE_URL="postgresql://user:password@host/db_name"

# JWT configuration
JWT_SECRET="your_jwt_secret"

# Cloudinary Integration (Required for Document Uploads)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"
```

---

## ⚙️ Setup Instructions

### 1. Backend Setup
Navigate to the `backend` folder and install dependencies:
```bash
cd backend
npm install
```

Push the Prisma schema to your database (Make sure your `.env` is configured):
```bash
npx prisma db push
```

Start the backend development server:
```bash
npm run dev
```

### 2. Frontend Setup
Navigate to the `frontend` folder and install dependencies:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```

### 3. Running the Application
Once both servers are running, the frontend will be available at `http://localhost:3000`, communicating with the backend API.
