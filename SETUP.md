# Quick Setup Guide

## Prerequisites

1. **Node.js** (v16 or higher) - [Download](https://nodejs.org/)
2. **PostgreSQL** (v12 or higher) - [Download](https://www.postgresql.org/download/)

## Step-by-Step Setup

### 1. Database Setup

Create a PostgreSQL database:

```sql
CREATE DATABASE multitenant_db;
```

### 2. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Create .env file (copy from .env.example)
# Windows:
copy .env.example .env
# Mac/Linux:
cp .env.example .env

# Edit .env file with your database credentials:
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=multitenant_db
# DB_USER=postgres
# DB_PASSWORD=your_password
# PORT=5000
# JWT_SECRET=your-secret-key-here

# Start the backend server
npm run dev
```

The backend will:
- Automatically create all database tables
- Insert sample tenants and users
- Start on http://localhost:5000

### 3. Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Create .env.local file
# Windows:
copy .env.example .env.local
# Mac/Linux:
cp .env.example .env.local

# Edit .env.local file:
# NEXT_PUBLIC_API_URL=http://localhost:5000/api

# Start the frontend server
npm run dev
```

The frontend will start on http://localhost:3000

### 4. Test the Application

1. Open http://localhost:3000 in your browser
2. Login with demo credentials:
   - **Tenant 1**: admin@acme.com / password123
   - **Tenant 2**: user@tech.com / password123
3. Create projects and verify tenant isolation

## Troubleshooting

### Database Connection Issues

- Verify PostgreSQL is running
- Check database credentials in `.env`
- Ensure database `multitenant_db` exists

### Port Already in Use

- Backend: Change `PORT` in `backend/.env`
- Frontend: Change port with `npm run dev -- -p 3001`

### TypeScript Errors

- Run `npm install` in the frontend directory
- Ensure all dependencies are installed

## Demo Credentials

**Tenant 1 - Acme Corp:**
- Email: `admin@acme.com`
- Password: `password123`

**Tenant 2 - Tech Solutions:**
- Email: `user@tech.com`
- Password: `password123`

## Next Steps

- Review the main [README.md](README.md) for detailed documentation
- Check API endpoints in `backend/README.md`
- Explore the frontend structure in `frontend/README.md`




