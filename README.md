# 🚀 MERN Project Management Platform

A production-ready full-stack project management application built with the MERN stack. Designed for teams to collaborate effectively with workspaces, real-time kanban boards, and comprehensive analytics.

## ✨ Main Features
- **📊 Real-time Analytics Dashboard:** Visualize task completion, priority breakdowns, and project distribution using `recharts`.
- **📋 Kanban Boards with Drag-and-Drop:** Intuitive task management with `@hello-pangea/dnd` and optimistic UI updates.
- **🔍 Global Command Palette (Cmd+K):** Instantly search across projects and tasks with keyboard navigation.
- **💬 Task Activity Threads:** Built-in commenting system for team discussions on specific tasks.
- **👥 Role-based Workspaces:** Invite members and assign roles (Owner, Admin, Member) to control access.
- **🌗 Persistent Dark Mode:** System-aware dark mode with local storage persistence and dynamic DOM manipulation.
- **🔐 Secure Authentication:** Complete JWT authentication flow including email verification and password resets.
- **🔔 Global Toast Notifications:** Instant, non-intrusive feedback for all user actions using `sonner`.

---

## 💻 Tech Stack

### Frontend (Client)
- **Framework:** React 18, Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management & Data Fetching:** Tanstack React Query
- **Routing:** React Router v6
- **Charts:** Recharts
- **Drag & Drop:** `@hello-pangea/dnd`
- **Icons & UI:** Lucide React, Sonner (Toasts)

### Backend (Server)
- **Runtime:** Node.js
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** MongoDB (via Mongoose)
- **Authentication:** JSON Web Tokens (JWT), BcryptJS
- **Email Service:** SendGrid

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB instance (local or Atlas)
- SendGrid API Key (for emails)

### Installation
1. Clone the repository
2. Install dependencies for both client and server:
   ```bash
   cd client && npm install
   cd ../server && npm install
   ```

3. Configure Environment Variables:
   - Create a `.env` file in the `server` directory using the `.env.example` template.
   - Create a `.env` file in the `client` directory (include `VITE_API_URL`).

4. Start the Application:
   - Run the backend (default port 5000):
     ```bash
     cd server && npm run dev
     ```
   - Run the frontend (default port 5173):
     ```bash
     cd client && npm run dev
     ```

## 🌐 Deployment
The platform is designed to be easily deployed:
- **Frontend:** Vercel (Configured with `vercel.json` for SPA routing)
- **Backend:** Render (Configured for Node/Express environments)
