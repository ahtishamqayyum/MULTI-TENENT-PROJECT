# Backend - Multi-Tenant Projects API

Express.js backend with PostgreSQL database, JWT authentication, and multi-tenant isolation.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env` file:
   ```bash
   cp .env.example .env
   ```

3. Configure your PostgreSQL database in `.env`

4. Start the server:
   ```bash
   npm run dev
   ```

## API Routes

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Projects (Protected)
- `GET /api/projects` - List all projects for tenant
- `GET /api/projects/:id` - Get project details
- `POST /api/projects` - Create new project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

## Middleware

- `authenticateToken` - Validates JWT token and attaches user to request
- `enforceTenantIsolation` - Ensures tenant context is available

## Database

The database is automatically initialized on server start. Sample tenants and users are created if the database is empty.




