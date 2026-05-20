# Multi-Tenant Projects Module

A full-stack multi-tenant application with JWT authentication and CRUD operations for projects. Users can only see and manage projects from their own tenant.

## Features

- **Multi-Tenant Architecture**: Complete tenant isolation at the database and API level
- **JWT Authentication**: Secure token-based authentication
- **Project Management**: Full CRUD operations for projects
- **Tenant Isolation**: Users can only access projects from their own tenant
- **SQLite Database**: Local SQLite with PostgreSQL-style query compatibility layer
- **Next.js Frontend**: Modern React-based UI with TypeScript

## Project Structure

```
Multi-Tenant Projects/
├── backend/              # Node.js/Express backend
│   ├── config/          # Database configuration
│   ├── middleware/      # Auth and tenant isolation middleware
│   ├── routes/          # API routes (auth, projects)
│   └── server.js        # Express server entry point
├── frontend/            # Next.js frontend
│   ├── lib/             # API client
│   ├── pages/           # Next.js pages
│   ├── styles/          # Global styles
│   └── package.json
└── README.md
```

## Database Schema

### Tables

1. **tenants**
   - `id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR, UNIQUE)
   - `created_at` (TIMESTAMP)

2. **users**
   - `id` (SERIAL PRIMARY KEY)
   - `email` (VARCHAR, UNIQUE)
   - `password` (VARCHAR, hashed with bcrypt)
   - `name` (VARCHAR)
   - `tenant_id` (INTEGER, FOREIGN KEY → tenants.id)
   - `created_at` (TIMESTAMP)

3. **projects**
   - `id` (SERIAL PRIMARY KEY)
   - `name` (VARCHAR)
   - `description` (TEXT)
   - `tenant_id` (INTEGER, FOREIGN KEY → tenants.id)
   - `created_by` (INTEGER, FOREIGN KEY → users.id)
   - `created_at` (TIMESTAMP)
   - `updated_at` (TIMESTAMP)

### Indexes

- `idx_users_tenant_id` on `users(tenant_id)`
- `idx_projects_tenant_id` on `projects(tenant_id)`

## Setup Instructions

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file (copy from `.env.example`):
   ```bash
   cp .env.example .env
   ```

4. Update `.env` with your PostgreSQL credentials:
   ```
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=multitenant_db
   DB_USER=postgres
   DB_PASSWORD=your_password
   PORT=5000
   JWT_SECRET=your-secret-key
   ```

5. Create the PostgreSQL database:
   ```sql
   CREATE DATABASE multitenant_db;
   ```

6. Start the backend server:
   ```bash
   npm run dev
   ```

   The server will automatically:
   - Create all necessary tables
   - Insert sample tenants and users
   - Start listening on port 5000

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file (copy from `.env.example`):
   ```bash
   cp .env.example .env.local
   ```

4. Update `.env.local` with your API URL:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

## Demo Credentials

The application comes with sample data:

**Tenant 1 - Acme Corp:**
- Email: `admin@acme.com`
- Password: `password123`

**Tenant 2 - Tech Solutions:**
- Email: `user@tech.com`
- Password: `password123`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Projects (Requires Authentication)

- `GET /api/projects` - Get all projects for user's tenant
- `GET /api/projects/:id` - Get a single project
- `POST /api/projects` - Create a new project
- `PUT /api/projects/:id` - Update a project
- `DELETE /api/projects/:id` - Delete a project

All project endpoints automatically filter by the user's `tenant_id` to ensure tenant isolation.

## Tenant Isolation

The application enforces tenant isolation at multiple levels:

1. **Database Level**: All queries include `tenant_id` filters
2. **Middleware Level**: `enforceTenantIsolation` middleware ensures tenant context
3. **API Level**: All project operations automatically use the authenticated user's `tenant_id`

Users can only:
- See projects from their own tenant
- Create projects in their own tenant
- Update/delete projects from their own tenant

## Frontend Pages

- `/login` - Login page
- `/projects` - Project list with create functionality
- `/projects/[id]` - View and edit individual project

## Technology Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs
- pg (PostgreSQL client)

### Frontend
- Next.js 14
- React 18
- TypeScript
- Axios

## Development

### Backend
```bash
cd backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend
```bash
cd frontend
npm run dev  # Next.js development server
```

## Production Build

### Backend
```bash
cd backend
npm start
```

### Frontend
```bash
cd frontend
npm run build
npm start
```

## Security Notes

- Change the `JWT_SECRET` in production
- Use strong passwords in production
- Consider adding rate limiting
- Add input validation and sanitization
- Use HTTPS in production
- Consider adding CORS restrictions

## License

ISC




