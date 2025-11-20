# Frontend - Multi-Tenant Projects UI

Next.js frontend application with TypeScript for managing projects in a multi-tenant environment.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` file:
   ```bash
   cp .env.example .env.local
   ```

3. Configure API URL in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. Start development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000)

## Pages

- `/login` - User authentication
- `/projects` - Project list and creation
- `/projects/[id]` - Project details and editing

## Features

- JWT token-based authentication
- Automatic token injection in API requests
- Protected routes with authentication check
- Responsive UI design
- Real-time project CRUD operations

## Build

```bash
npm run build
npm start
```




