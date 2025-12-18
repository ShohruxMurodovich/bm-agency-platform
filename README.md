# BM Agency Platform

A comprehensive multi-marketplace automation platform featuring a robust **Web Admin Panel** and **Internal API Gateway**. Designed for scalability, security, and ease of use.

## 🚀 Key Features

### 🛡️ Role-Based Access Control (RBAC)
Strict permission system ensuring secure access across the platform:
- **Admin**: Full superuser access to all modules (Products, Orders, Users, Sellers, Settings). Can delete items and manage system configurations.
- **Staff**: Operational access. Can view and manage day-to-day items but restricted from high-risk actions (e.g., cannot delete products/users). Custom sidebar view.
- **Seller**: **Read-Only** access to their own specific data.
  - Can view their linked Products and Stores.
  - **Cannot** Add, Edit, or Delete products (UI buttons hidden & API protected).
  - Data is automatically filtered to show *only* items belonging to their linked Seller Profile.

### 📦 Product Management
- **Centralized Inventory**: Full CRUD (Create, Read, Update, Delete) capabilities.
- **Dynamic Categories**: Category selection fetches real-time data from the backend.
- **Quick Actions**: Update Status, Price, and Stock directly from the list view.
- **Smart Filtering**: Admin/Staff see all; Sellers see only their own.
- **Visual Status**: Color-coded indicators for Active, Draft, and Inactive states.

### 📊 Interactive Dashboard
- **Real-time Metrics**: At-a-glance view of Total Revenue, Active Orders, and Product counts.
- **Modern UI**: Built with a custom Design System using TailwindCSS, featuring glassmorphism, smooth transitions, and a clean aesthetic.

### 👥 User & Seller Management
- **User Administration**: Create and manage system users with specific roles.
- **Seller Linking**: Link a User account to a specific Seller profile to enforce data scoping.
- **Store Management**: Manage physical or digital store entities.

### 📁 Category Management
- **Organization**: Create and manage product categories.
- **Dynamic Integration**: Changes here immediately reflect in the Product creation forms.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: Vue 3 (Composition API)
- **Build Tool**: Vite
- **Styling**: TailwindCSS + Custom Design System
- **State Management**: Pinia
- **Icons**: Lucide Vue Next
- **HTTP Client**: Axios

### Backend (Server)
- **Framework**: NestJS
- **Language**: TypeScript
- **Database ORM**: TypeORM
- **Database**: PostgreSQL
- **Authentication**: Passport Strategy + JWT Guards
- **Validation**: Class Validator

---

## ⚙️ Installation & Setup

### Prerequisites
- **Node.js** (v18 or higher)
- **Docker Desktop** (for PostgreSQL database)

### 1. Database Setup
Start the PostgreSQL container using Docker Compose:
```bash
docker-compose up -d
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

**Configuration**:
Ensure your `.env` file (or default config) points to the Docker database credentials (usually `postgres`/`postgres` on port 5432).

**Start the Server**:
```bash
npm run start:dev
```
*Server will run at `http://localhost:3000`*

**Seeding Data (Important)**:
To create the initial Admin user and default data, run:
```bash
npm run seed
```

### 3. Frontend Setup
Navigate to the client directory and install dependencies:
```bash
cd client
npm install
```

**Start the Client**:
```bash
npm run dev
```
*Application will run at `http://localhost:5173`*

---

## 🔐 Default Credentials

After seeding, use the following credentials to log in:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | `admin@platform.com` | `admin123` |

*(Note: Create Staff and Seller users via the "Users" module in the Admin panel).*

---

## 🧪 API Documentation

The backend includes a Swagger UI for exploring endpoints.
Visit: `http://localhost:3000/api` (when server is running).

---

## 📝 Troubleshooting

- **"Uncategorized" Products**: If products show as "Uncategorized", ensure you have created Categories and re-save the product with a selected category. The system now enforces dynamic category linking.
- **Login Fails**: Ensure you have run `npm run seed`. If the database was reset, users are lost.
- **Port Conflicts**: Ensure ports `3000` (API) and `5173` (Web) are free.

---

© 2025 Internal Platform. All Rights Reserved.
