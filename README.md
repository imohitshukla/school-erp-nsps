# School Management System (ERP)

A highly scalable, zero-cost-hosted School Management System (ERP) designed to manage 1,000+ students. 

## Features
- **Authentication & Dashboard:** Multi-tenant logins (Super Admin, Teacher, Parent, Student) using JWT and RBAC.
- **Fee Management:** Zero-drift ledger system supporting partial payments, concessions, and daily collection reports.
- **Academic & Examination:** Gradebook interface, term weight calculations, and consolidated report cards.
- **Student Information System (SIS):** Comprehensive profiles, emergency contacts, and session management.

## Tech Stack
- **Frontend:** React + Vite, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL
- **Logging:** Winston
- **Auth:** JWT, bcrypt

## Setup Instructions (Local Development)

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or via Docker)

### 2. Backend Setup
```bash
cd server
npm install
# Create a .env file based on .env.example
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## Architecture
See the accompanying Architecture Blueprint for details on folder structure, database schema, and API routes.
