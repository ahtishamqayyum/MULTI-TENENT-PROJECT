# Project Architecture & Explanation Guide

This document explains the architecture and implementation details for the Multi-Tenant Projects Module. Use this as a guide for creating the Loom video explanation.

## 1. Project Structure

```
Multi-Tenant Projects/
├── backend/                    # Node.js/Express Backend
│   ├── config/
│   │   └── database.js        # PostgreSQL connection & initialization
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication middleware
│   │   └── tenant.js          # Tenant isolation enforcement
│   ├── routes/
│   │   ├── auth.js            # Login/Register endpoints
│   │   └── projects.js        # CRUD endpoints for projects
│   ├── server.js              # Express server setup
│   └── package.json
│
├── frontend/                  # Next.js Frontend
│   ├── lib/
│   │   └── api.ts             # API client with TypeScript types
│   ├── pages/
│   │   ├── _app.tsx           # App wrapper with auth check
│   │   ├── login.tsx          # Login page
│   │   └── projects/
│   │       ├── index.tsx      # Project list & create
│   │       └── [id].tsx       # Project detail & edit
│   ├── styles/
│   │   └── globals.css        # Global styles
│   └── package.json
│
└── README.md                  # Main documentation
```

## 2. Database Schema

### Multi-Tenant Design

The database uses a **shared database, shared schema** approach with tenant isolation enforced at the application level.

#### Tables:

1. **tenants**
   - Stores tenant/organization information
   - Each tenant is completely isolated

2. **users**
   - Linked to tenants via `tenant_id` foreign key
   - Passwords are hashed with bcrypt
   - Users can only belong to one tenant

3. **projects**
   - Linked to tenants via `tenant_id` foreign key
   - Linked to users via `created_by` foreign key
   - All queries filter by `tenant_id`

#### Indexes:
- `idx_users_tenant_id` - Fast user lookup by tenant
- `idx_projects_tenant_id` - Fast project lookup by tenant

#### Sample Data:
- **Tenant 1**: Acme Corp (admin@acme.com)
- **Tenant 2**: Tech Solutions (user@tech.com)

## 3. Tenant Isolation

### How It Works:

1. **Authentication**: User logs in with email/password
2. **JWT Token**: Contains `userId` and `tenantId`
3. **Middleware Chain**:
   - `authenticateToken` - Validates JWT and loads user with `tenant_id`
   - `enforceTenantIsolation` - Ensures tenant context exists
4. **Query Filtering**: All project queries automatically include `WHERE tenant_id = $1`

### Isolation Points:

- **Database Level**: Foreign keys ensure data integrity
- **Query Level**: All SELECT/UPDATE/DELETE include tenant filter
- **API Level**: User's tenant_id is automatically used
- **Frontend Level**: Users can only see their tenant's data

### Example Query:
```sql
SELECT * FROM projects 
WHERE tenant_id = $1  -- User's tenant_id from JWT
ORDER BY created_at DESC
```

## 4. API Flow

### Authentication Flow:

```
1. POST /api/auth/login
   ├── Validate email/password
   ├── Verify password with bcrypt
   ├── Generate JWT token (contains userId, tenantId)
   └── Return token + user info

2. Frontend stores token in localStorage
3. All subsequent requests include: Authorization: Bearer <token>
```

### Project CRUD Flow:

```
GET /api/projects
├── authenticateToken middleware
│   └── Validates JWT, loads user with tenant_id
├── enforceTenantIsolation middleware
│   └── Ensures tenant_id is available
└── Query: SELECT * FROM projects WHERE tenant_id = $1

POST /api/projects
├── authenticateToken
├── enforceTenantIsolation
└── INSERT INTO projects (..., tenant_id, created_by)
    VALUES (..., req.user.tenant_id, req.user.id)

PUT /api/projects/:id
├── authenticateToken
├── enforceTenantIsolation
├── Verify project belongs to user's tenant
└── UPDATE projects SET ... WHERE id = $1 AND tenant_id = $2

DELETE /api/projects/:id
├── authenticateToken
├── enforceTenantIsolation
├── Verify project belongs to user's tenant
└── DELETE FROM projects WHERE id = $1 AND tenant_id = $2
```

## 5. Frontend Architecture

### Authentication:
- Token stored in `localStorage`
- `_app.tsx` checks for token on every route
- Redirects to `/login` if not authenticated
- API client automatically adds token to requests

### Pages:

1. **Login** (`/login`)
   - Simple form with email/password
   - On success: store token, redirect to `/projects`

2. **Projects List** (`/projects`)
   - Fetches all projects for user's tenant
   - Create new project form
   - Project cards with view/delete actions
   - Shows tenant name and user info

3. **Project Detail** (`/projects/[id]`)
   - View project details
   - Edit project (inline form)
   - Delete project
   - Shows creator and timestamps

### API Client:
- Centralized in `lib/api.ts`
- Axios instance with interceptors
- Automatically adds JWT token to headers
- TypeScript types for type safety

## 6. Security Features

1. **Password Hashing**: bcrypt with salt rounds
2. **JWT Tokens**: Signed tokens with expiration (24h)
3. **Tenant Isolation**: Enforced at multiple levels
4. **SQL Injection Prevention**: Parameterized queries
5. **CORS**: Configured for frontend origin

## 7. Key Implementation Details

### Backend Middleware Stack:

```javascript
// Projects routes
router.use(authenticateToken);      // 1. Validate JWT
router.use(enforceTenantIsolation); // 2. Ensure tenant context
// 3. Route handlers use req.user.tenant_id
```

### Database Initialization:

- Automatically creates tables on first run
- Creates indexes for performance
- Inserts sample data if database is empty
- Uses transactions for data integrity

### Error Handling:

- Consistent error responses
- 401 for authentication failures
- 403 for authorization failures
- 404 for not found
- 500 for server errors

## 8. Testing Tenant Isolation

To verify tenant isolation works:

1. Login as `admin@acme.com` (Tenant 1)
2. Create some projects
3. Logout
4. Login as `user@tech.com` (Tenant 2)
5. Verify you cannot see Tenant 1's projects
6. Create projects for Tenant 2
7. Verify they are separate

## 9. Technology Choices

### Backend:
- **Express.js**: Lightweight, flexible web framework
- **PostgreSQL**: Robust relational database
- **JWT**: Stateless authentication
- **bcryptjs**: Password hashing

### Frontend:
- **Next.js**: React framework with SSR capabilities
- **TypeScript**: Type safety and better DX
- **Axios**: HTTP client with interceptors

## 10. Future Enhancements (Not Implemented)

- Role-based access control (RBAC)
- Project sharing between users in same tenant
- File uploads for projects
- Project search and filtering
- Pagination for large project lists
- Email notifications
- Audit logging

## Video Explanation Checklist

When creating the Loom video, cover:

- [ ] Project structure overview
- [ ] Database schema explanation
- [ ] Tenant isolation mechanism
- [ ] JWT authentication flow
- [ ] API endpoints demonstration
- [ ] Frontend pages walkthrough
- [ ] Tenant isolation test (login as different tenants)
- [ ] Code walkthrough of key files:
  - [ ] Database initialization
  - [ ] Authentication middleware
  - [ ] Project routes with tenant filtering
  - [ ] Frontend API client
  - [ ] Project list page




