# 🏷️ PIC Barcode Generator — Gold Pawn Manager

A full-stack Gold Pawning Management System with barcode tracking.  
Built with **Node.js + TypeScript + Express + Prisma (PostgreSQL)** backend and a **React + Vite** frontend.

---

## 📋 Prerequisites

Make sure the following are installed on your machine before proceeding:

| Tool | Version | Download |
|------|---------|----------|
| Node.js | v18+ | https://nodejs.org |
| npm | v9+ | bundled with Node.js |
| PostgreSQL | v14+ | https://www.postgresql.org |
| Git | any | https://git-scm.com |

---

## ⚙️ 1. Clone the Repository

```bash
git clone https://github.com/bloomtechmain/PIIC_Barcode_System.git
cd PIIC_Barcode_System
```

---

## 🗄️ 2. Set Up the Database

1. Open **pgAdmin** or the `psql` shell and create a new database:

```sql
CREATE DATABASE gold_pawn_db;
```

2. Make note of your PostgreSQL **username** and **password** (defaults are usually `postgres` / `postgres`).

---

## 🔧 3. Configure Environment Variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gold_pawn_db"

# JWT secret (change this in production!)
JWT_SECRET="gp-secret-2024-change-in-production"
JWT_EXPIRES_IN="7d"

# Backend port
PORT=3000
NODE_ENV="development"
```

---

## 📦 4. Install Dependencies

### Backend (root directory)

```bash
npm install
```

### Frontend

```bash
cd frontend
npm install
cd ..
```

---

## 🗃️ 5. Run Database Migrations & Seed

Run these commands from the **root** directory:

```bash
# Apply database schema
npm run db:push

# Generate Prisma client
npm run db:generate

# Seed the database with the default admin user
npm run db:seed
```

---

## 🚀 6. Run the Application

Open **two separate terminals**:

### Terminal 1 — Backend

```bash
# From the root directory
npm run dev
```

The API server will be available at: **http://localhost:3000**

### Terminal 2 — Frontend

```bash
# From the frontend directory
cd frontend
npm run dev
```

The web app will be available at: **http://localhost:5173**

---

## 🔑 7. Default Admin Credentials

After seeding the database, log in with:

| Field    | Value                   |
|----------|-------------------------|
| Email    | `admin@goldpawn.com`    |
| Password | `Admin@123`             |

> ⚠️ **Important:** Change the password immediately after your first login.

---

## 🧩 Available Scripts

### Backend (root)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start backend in development mode (hot reload) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run start` | Run compiled production build |
| `npm run db:push` | Push schema to the database |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed the database with admin user |
| `npm run db:studio` | Open Prisma Studio (DB GUI) |

### Frontend (`frontend/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server at http://localhost:5173 |
| `npm run build` | Build production bundle |
| `npm run preview` | Preview the production build |

---

## 📁 Project Structure

```
PIC_Barcode_Generator/
├── src/                    # Backend source
│   ├── controllers/        # Route handlers
│   ├── routes/             # API route definitions
│   │   ├── auth.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── item.routes.ts
│   │   ├── release.routes.ts
│   │   ├── audit.routes.ts
│   │   └── report.routes.ts
│   ├── services/           # Business logic
│   ├── middleware/         # Auth & error middleware
│   ├── validators/         # Zod request validators
│   ├── lib/                # Prisma client & utilities
│   └── server.ts           # Entry point
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── seed.ts             # Database seeder
│   └── migrations/         # Migration history
├── frontend/               # React + Vite frontend
│   ├── src/
│   └── index.html
├── .env                    # Environment variables (not committed)
├── .env.example            # Example env file
├── package.json
└── tsconfig.json
```

---

## 🗺️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login and get JWT token |
| GET/POST | `/api/customers` | List / create customers |
| GET/POST | `/api/items` | List / create pawn items |
| POST | `/api/releases` | Release a pawned item |
| GET/POST | `/api/audits` | Barcode audit sessions |
| GET | `/api/reports` | Generate reports |

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Node.js, Express, TypeScript |
| ORM | Prisma |
| Database | PostgreSQL |
| Auth | JWT (jsonwebtoken) |
| Validation | Zod |
| Barcode | JsBarcode |

---

## 🐛 Troubleshooting

**Database connection error**
- Ensure PostgreSQL is running and the `DATABASE_URL` in `.env` is correct.

**`npm run db:seed` fails**
- Make sure `npm run db:push` was run first to create the tables.

**Frontend can't reach the backend**
- Confirm the backend is running on port `3000`.
- Check `frontend/vite.config.ts` for the proxy configuration.

**`prisma generate` errors**
- Run `npm install` in the root directory again, then retry.
