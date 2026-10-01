# Project Features & Technologies

This document tracks the implemented features and the technology stack utilized in the UpToSkills Intern Management & Workforce Tracking System.

## Technology Stack

### Frontend & Build
* **Next.js 16 (App Router)**: The core framework for the React application, offering server-side rendering and static site generation.
* **Turbopack**: The lightning-fast, Rust-based successor to Webpack, used as the Next.js development bundler for instant hot-module reloading.
* **Tailwind CSS v4**: Utility-first CSS framework used for all styling and responsive design.
* **Shadcn UI (Base UI & Radix Primitives)**: The primary component management framework (CMF), providing accessible, beautifully designed, and highly customizable UI components (e.g., Cards, Buttons, Avatars, Dropdowns).
* **Framer Motion**: Library used to power the smooth page transitions and micro-animations throughout the application.
* **Lucide React**: Modern, scalable SVG icon library.

### State Management
* **Zustand**: A small, fast, and scalable bear-bones state management solution currently powering the mock authentication, role switching, and dynamic data storage for the interactive prototype.

### Database & Backend Integration
* **Neon PostgreSQL**: A serverless Postgres database platform configured via the project `.env` file to serve as the highly available, scalable primary database for the system.

## Core Features Implemented

### 1. Hierarchical Role-Based Access Control (RBAC)
The system supports 5 distinct user roles, each with a tailored dashboard and permission set:
* **Admin**: Global oversight, system configuration, and company-wide analytics.
* **Senior Team Lead (Senior TL)**: Department-level management and verification.
* **Team Lead (TL)**: Team-level management, supervising Captains and Interns.
* **Captain**: Direct intern management, attendance marking, and task verification.
* **Intern**: Personal dashboard for task execution, proof submission, and tracking personal metrics.

### 2. Interactive Role-Based Dashboards
* **Admin Dashboard**: Visualizes global statistics, pending approvals across departments, and recent system-wide activities.
* **Manager Dashboards (Senior TL, TL, Captain)**: Unified views displaying team metrics, subordinate lists, missing attendance alerts, and a queue for "Proofs Awaiting Verification."
* **Intern Dashboard**: Personal metrics tracking (Attendance %, Performance Rating) and an interactive "My Tasks" interface for submitting social media campaign proofs.

### 3. Theme Management
* **Dark Mode Toggle**: Integrated `next-themes` to support immediate toggling between light and dark aesthetics across all components, adhering to system preferences.

### 4. Dynamic Navigation
* **Sidebar**: Dynamically adjusts its routing links and options based on the active user's hierarchical role.
* **Top Navigation Bar**: Features a user profile dropdown menu and an interactive notification bell system.

### 5. Prototype State Simulation
* Includes a robust mock data engine to simulate real-time interactions (e.g., submitting a task as an intern, then immediately logging in as a captain to approve it) without requiring a fully deployed backend during the UI/UX testing phase.
