# Backend setup

The `server/` directory contains the Node.js and Express API used by the
frontend. It uses PostgreSQL and JWT authentication.

## Requirements

- Node.js 18 or newer
- PostgreSQL
- A strong `SESSION_SECRET`

From the repository root:

```bash
cd server
npm install
```

Set these environment variables before starting the server:

```bash
export DATABASE_URL="postgres://user:password@localhost:5432/database"
export SESSION_SECRET="replace-with-a-long-random-secret"
export NODE_ENV="development"
export PORT="3001"
export CORS_ALLOWED_ORIGINS="http://localhost:8081"
```

`CORS_ALLOWED_ORIGINS` is a comma-separated list of allowed browser origins.
Native mobile clients normally do not send an Origin header.

Start the API:

```bash
npm start
```

To create the initial administrator, provide a valid email and a strong
one-time password through the environment:

```bash
export ADMIN_EMAIL="admin@example.com"
export ADMIN_PASSWORD="replace-with-a-strong-one-time-password"
npm run seed
```

The seed command does not contain default credentials and does not print the
password.

The API is served under `/api`; the health endpoint is
`http://localhost:3001/api/health` unless `PORT` is changed. Keep database
credentials and secrets outside version control.
